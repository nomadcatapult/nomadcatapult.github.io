import { fragmentSnapshotTransport } from './model.mjs';
import { renderCard, element } from './view.mjs';
import { createLocalProjectStore, STORAGE_KEY } from './storage.mjs';
import { loadEncryptedProject } from './encrypted.mjs';
let generation = 0;
async function showSnapshot() {
  const request = ++generation;
  const root = document.querySelector('#widget');
  root.className = 'widget'; root.replaceChildren(element('p', 'help', 'Загружаем карточку…'));
  document.querySelector('#viewer-caption').textContent = '';
  try {
    const parameters = new URLSearchParams(location.search);
    const projectId = parameters.get('project'), encrypted = parameters.has('id');
    const result = encrypted ? await loadEncryptedProject(location.href) : null;
    const snapshot = result ? result.snapshot : projectId ? await createLocalProjectStore(localStorage).load(projectId) : fragmentSnapshotTransport.decode(location.hash);
    if (request !== generation) return;
    document.querySelector('#viewer-caption').textContent = encrypted
      ? `Вымышленное демо · зашифрованный просмотр · версия ${result.revision}. Данные получены из файла сайта; новые изменения видны после их публикации и обновления страницы. Ссылка с ключом даёт доступ к карточке — не пересылайте её посторонним.`
      : projectId
      ? 'Локальный просмотр по ID · только чтение. Обновления видны в этом браузере. На другом устройстве данные недоступны: внешнее минихранилище ещё не подключено. Демо, без авторизации.'
      : 'Опциональный снимок · только просмотр. Обновления редактора требуют новой ссылки. Hash не шифрует данные: получатель может их прочитать и изменить. Все суммы — демо.';
    document.querySelector('#viewer-shell').classList.toggle('dark', parameters.get('background') === 'dark');
    renderCard(root, snapshot, { compact: parameters.get('compact') === '1' });
  } catch (error) {
    if (request !== generation) return;
    root.className = 'viewer-error'; root.replaceChildren(element('h1', '', 'Проект недоступен'), element('p', 'help', error.message), element('p', 'help', 'Проверьте сеть и полную ссылку у дизайнера. Другие демо-данные вместо недоступного проекта не подставляются.'));
  }
}
showSnapshot(); window.addEventListener('hashchange', showSnapshot);
window.addEventListener('storage', event => { if (event.key === STORAGE_KEY && new URLSearchParams(location.search).has('project')) showSnapshot(); });
window.addEventListener('focus', () => { if (new URLSearchParams(location.search).has('project')) showSnapshot(); });
