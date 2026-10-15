import { validateSnapshot } from './model.mjs';
import { viewerPageUrl } from './urls.mjs';
export const MAX_PLAINTEXT_BYTES = 65536;
export const MAX_ENVELOPE_BYTES = 90000;
export const ENVELOPE_FORMAT = 'nomadcatapult-aes-gcm';
const encoder = new TextEncoder();
export class EncryptedError extends Error {
  constructor(message, code) { super(message); this.name = 'EncryptedError'; this.code = code; }
}
function check(valid, message, code = 'CORRUPT') { if (!valid) throw new EncryptedError(message, code); }
export function encodeBase64Url(bytes) {
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodeBase64Url(value) {
  check(typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value), 'Повреждённый зашифрованный файл.');
  try { return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0)); }
  catch { throw new EncryptedError('Повреждённый зашифрованный файл.', 'CORRUPT'); }
}
export const validProjectId = id => typeof id === 'string' && /^[a-f0-9]{32}$/.test(id);
export function validKey(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value)) return false;
  try { return decodeBase64Url(value).length === 32; } catch { return false; }
}
function cryptoProvider(provider) {
  check(provider?.subtle && provider?.getRandomValues, 'Для просмотра нужен современный браузер и HTTPS (или localhost).', 'UNSUPPORTED');
  return provider;
}
/** Explicit client allowlist; notes, owner metadata, tokens and unknown nested fields are discarded. */
export function clientProjection(value) { return validateSnapshot(value); }
export function createProjectIdentity(provider = globalThis.crypto) {
  const crypto = cryptoProvider(provider), id = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
  return { id, key: encodeBase64Url(crypto.getRandomValues(new Uint8Array(32))) };
}
export function validateEnvelope(value) {
  check(value && typeof value === 'object' && !Array.isArray(value), 'Повреждённый зашифрованный файл.');
  const allowed = ['format', 'version', 'demo', 'id', 'revision', 'iv', 'ciphertext'];
  check(Object.keys(value).length === allowed.length && Object.keys(value).every(key => allowed.includes(key)), 'Неожиданные поля зашифрованного файла.');
  check(value.format === ENVELOPE_FORMAT && value.version === 1 && value.demo === true, 'Неподдерживаемый формат. Сейчас разрешено только вымышленное демо.');
  check(validProjectId(value.id) && Number.isSafeInteger(value.revision) && value.revision >= 1, 'Повреждённые метаданные файла.');
  check(typeof value.iv === 'string' && value.iv.length === 16 && decodeBase64Url(value.iv).length === 12, 'Повреждённый IV.');
  check(typeof value.ciphertext === 'string' && value.ciphertext.length <= Math.ceil((MAX_PLAINTEXT_BYTES + 16) * 4 / 3), 'Файл слишком большой.', 'TOO_LARGE');
  const bytes = decodeBase64Url(value.ciphertext); check(bytes.length >= 16 && bytes.length <= MAX_PLAINTEXT_BYTES + 16, 'Некорректный размер данных.');
  return { format: value.format, version: 1, demo: true, id: value.id, revision: value.revision, iv: value.iv, ciphertext: value.ciphertext };
}
const authenticatedMetadata = (id, revision) => encoder.encode(`${ENVELOPE_FORMAT}:1:demo:${id}:${revision}`);
export async function encryptProject(input, identity, revision, provider = globalThis.crypto) {
  const crypto = cryptoProvider(provider);
  check(validProjectId(identity?.id) && validKey(identity?.key), 'Некорректные параметры владельца.', 'BAD_KEY');
  check(Number.isSafeInteger(revision) && revision >= 1, 'Некорректная ревизия.');
  const plaintext = encoder.encode(JSON.stringify(clientProjection(input)));
  check(plaintext.length <= MAX_PLAINTEXT_BYTES, 'Проект слишком большой: максимум 64 КБ клиентских данных.', 'TOO_LARGE');
  const key = await crypto.subtle.importKey('raw', decodeBase64Url(identity.key), 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: authenticatedMetadata(identity.id, revision), tagLength: 128 }, key, plaintext);
  return { format: ENVELOPE_FORMAT, version: 1, demo: true, id: identity.id, revision, iv: encodeBase64Url(iv), ciphertext: encodeBase64Url(new Uint8Array(ciphertext)) };
}
export async function decryptProject(input, encodedKey, expectedId, provider = globalThis.crypto) {
  const crypto = cryptoProvider(provider), envelope = validateEnvelope(input);
  check(envelope.id === expectedId && validProjectId(expectedId), 'Файл относится к другому проекту.', 'CORRUPT');
  check(validKey(encodedKey), 'В ссылке нет корректного ключа просмотра.', 'BAD_KEY');
  const key = await crypto.subtle.importKey('raw', decodeBase64Url(encodedKey), 'AES-GCM', false, ['decrypt']);
  let plaintext;
  try { plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decodeBase64Url(envelope.iv), additionalData: authenticatedMetadata(envelope.id, envelope.revision), tagLength: 128 }, key, decodeBase64Url(envelope.ciphertext)); }
  catch { throw new EncryptedError('Не удалось расшифровать проект: ключ неверен или файл повреждён.', 'DECRYPT_FAILED'); }
  check(plaintext.byteLength <= MAX_PLAINTEXT_BYTES, 'Данные слишком большие.', 'TOO_LARGE');
  try { return { snapshot: clientProjection(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plaintext))), revision: envelope.revision, demo: true }; }
  catch { throw new EncryptedError('Клиентские данные повреждены или имеют неподдерживаемую версию.', 'CORRUPT'); }
}
export function encryptedViewerUrl(identity, baseUrl) {
  check(validProjectId(identity?.id) && validKey(identity?.key), 'Некорректная ссылка.', 'BAD_LINK');
  const url = viewerPageUrl(baseUrl);
  check(url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)), 'Нужен HTTPS адрес сайта или localhost.', 'BAD_LINK');
  url.search = ''; url.searchParams.set('id', identity.id); url.hash = 'key=' + identity.key; return url.href;
}
export function parseEncryptedLink(value) {
  const url = new URL(value), fragment = new URLSearchParams(url.hash.slice(1));
  const id = url.searchParams.get('id'), key = fragment.get('key');
  check(url.searchParams.getAll('id').length === 1 && validProjectId(id) && fragment.getAll('key').length === 1 && validKey(key), 'Нужна полная ссылка проекта, включая ключ после #.', 'BAD_LINK');
  return { id, key, dataUrl: new URL('data/' + id + '.json', viewerPageUrl(url.href)).href };
}
export async function envelopeHash(envelope, provider = globalThis.crypto) {
  const digest = await cryptoProvider(provider).subtle.digest('SHA-256', encoder.encode(JSON.stringify(validateEnvelope(envelope))));
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}
async function readEnvelopeResponse(response) {
  const declared = Number(response.headers.get('Content-Length') || 0);
  check(!declared || declared <= MAX_ENVELOPE_BYTES, 'Файл слишком большой.', 'TOO_LARGE');
  const reader = response.body?.getReader(); let bytes;
  if (reader) {
    const chunks = []; let size = 0;
    while (true) {
      const { value, done } = await reader.read(); if (done) break; size += value.length;
      if (size > MAX_ENVELOPE_BYTES) { await reader.cancel(); throw new EncryptedError('Файл слишком большой.', 'TOO_LARGE'); }
      chunks.push(value);
    }
    bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  } else { bytes = new Uint8Array(await response.arrayBuffer()); check(bytes.length <= MAX_ENVELOPE_BYTES, 'Файл слишком большой.', 'TOO_LARGE'); }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new EncryptedError('Повреждённый JSON проекта.', 'CORRUPT'); }
}
export async function loadEncryptedProject(link, { fetchImpl = fetch, cryptoImpl = globalThis.crypto, timeoutMs = 12000 } = {}) {
  const { id, key, dataUrl } = parseEncryptedLink(link), controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(dataUrl, { cache: 'no-store', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal });
    if (!response.ok) throw new EncryptedError(response.status === 404 ? 'Файл проекта недоступен. Возможно, обновление ещё не опубликовано.' : 'Не удалось загрузить файл проекта. Попробуйте обновить страницу.', 'UNAVAILABLE');
    const envelope = await readEnvelopeResponse(response); return await decryptProject(envelope, key, id, cryptoImpl);
  } catch (error) {
    if (error instanceof EncryptedError) throw error;
    throw new EncryptedError('Нет сети или время ожидания истекло. Подключитесь к интернету и обновите страницу.', 'NETWORK');
  } finally { clearTimeout(timer); }
}
