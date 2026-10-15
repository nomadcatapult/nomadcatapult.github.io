import { createDemo, validateSnapshot, taskState, addTask, removeTask, setManualAdvance, setTaskAccepted, createViewerUrl } from './model.mjs';
import { renderCard, element, hours } from './view.mjs';
import { cardPng, download } from './export.mjs';
import { createLocalProjectStore, localViewerUrl } from './storage.mjs';
import { clientProjection } from './encrypted.mjs';
const $ = selector => document.querySelector(selector);
let browserStorage;
try { browserStorage = window.localStorage; }
catch { browserStorage = { getItem: () => null, setItem: () => { throw new Error('Локальное хранилище недоступно.'); } }; }
const projectStore = createLocalProjectStore(browserStorage);
const now = () => new Date().toISOString(), newId = () => 'p-' + crypto.randomUUID();
let projects = [], currentId, snapshot, compact = false, generatedAt = null, toastTimer;
function message(text) { $('#toast').textContent = text; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').textContent = ''; }, 6000); }
try {
  const saved = projectStore.readAll();
  if (saved) {
    projects = saved.projects;
    currentId = saved.currentId;
  }
} catch { message('Локальные данные не прочитаны. Открыто новое демо; используйте JSON для резервной копии.'); }
if (!projects.length) { currentId = newId(); projects = [{ id: currentId, snapshot: createDemo() }]; }
if (!projects.some(project => project.id === currentId)) currentId = projects[0].id;
snapshot = projects.find(project => project.id === currentId).snapshot;
function persist() {
  projects = projects.map(project => project.id === currentId ? { id: currentId, snapshot } : project);
  try { projectStore.writeAll({ currentId, projects }); $('#save-status').textContent = 'Сохранено в этом браузере'; }
  catch { $('#save-status').textContent = 'Хранилище недоступно. Сохраните JSON вручную.'; }
}
function field(label, name, value, options = {}) {
  const wrapper = element('label', '', label), input = element('input');
  input.dataset.field = name; input.value = value; input.type = options.type || 'text';
  for (const key of ['min', 'max', 'step', 'maxLength']) if (options[key] !== undefined) input[key] = options[key];
  input.required = true; input.disabled = Boolean(options.disabled); wrapper.append(input); return wrapper;
}
function check(label, name, checked, disabled = false) {
  const wrapper = element('label', 'check-label'), input = element('input'); input.type = 'checkbox'; input.dataset.field = name; input.checked = checked; input.disabled = disabled;
  wrapper.append(input, document.createTextNode(label)); return wrapper;
}
function renderEditors() {
  const open = new Set([...$('#task-editors').querySelectorAll('details[open]')].map(item => item.dataset.task));
  $('#task-editors').replaceChildren();
  for (const task of snapshot.tasks) {
    const state = taskState(snapshot, task), block = element('details', 'task-editor'); block.dataset.task = task.id; block.open = open.has(task.id);
    block.append(element('summary', '', task.title));
    const fields = element('div', 'fields'); fields.append(field('Название', 'title', task.title, { maxLength: 160 }));
    const plan = element('div', 'field-row'); plan.append(field('Базовая оценка, ч', 'estimateHours', task.estimateHours, { type: 'number', min: 0, max: 500, step: .25 }), field('Базовая цена, $', 'basePrice', task.basePriceCents / 100, { type: 'number', min: 0, max: 1000000, step: .01 })); fields.append(plan);
    const actual = element('div', 'field-row'); actual.append(field('Потрачено, ч', 'spentHours', task.spentHours, { type: 'number', min: 0, max: 500, step: .25, disabled: state.key === 'blocked' }), field('Готовность, %', 'progress', task.progress, { type: 'number', min: 0, max: 100, step: 1, disabled: state.key === 'blocked' })); fields.append(actual);
    fields.append(check('Результат принят', 'accepted', task.accepted, state.key === 'blocked'), check('Нужна ручная отметка второго аванса', 'requiresSecondAdvance', task.requiresSecondAdvance));
    const dependencyLabel = element('label', '', 'Дождаться принятия задачи'), select = element('select'); select.dataset.field = 'dependencies';
    const none = element('option', '', 'Без предшественника'); none.value = ''; select.append(none);
    for (const candidate of snapshot.tasks.filter(item => item.id !== task.id)) { const option = element('option', '', candidate.title); option.value = candidate.id; option.selected = task.dependencies.includes(candidate.id); select.append(option); }
    // Model permits multiple dependencies; this small editor retains existing sets until explicitly changed.
    if (task.dependencies.length > 1) fields.append(element('p', 'help', 'В снимке несколько предшественников. Выбор ниже заменит их одним.'));
    dependencyLabel.append(select); fields.append(dependencyLabel);
    if (task.missingDependencies.length || task.dependencies.some(id => !snapshot.tasks.some(item => item.id === id))) {
      fields.append(element('p', 'warning', 'Предшественник удалён. Задача остаётся заблокированной до переназначения или явного снятия зависимости.'));
      const clear = element('button', '', 'Снять отсутствующую зависимость'); clear.type = 'button'; clear.dataset.action = 'clear-missing'; fields.append(clear);
    }
    for (const round of task.rounds) {
      const row = element('div', 'round-editor'); row.dataset.round = round.id;
      row.append(element('strong', '', `Раунд ${round.number} · ${round.included ? 'включён в базовую оценку' : 'дополнительный'}`));
      if (!round.included) {
        const estimates = element('div', 'field-row'); estimates.append(field('Оценка, ч', 'roundHours', round.estimateHours, { type: 'number', min: 0, max: 500, step: .25 }), field('Ставка, $/ч', 'roundRate', round.rateCents / 100, { type: 'number', min: 0, max: 100000, step: .01 }));
        row.append(estimates, check('Дополнительный раунд согласован', 'roundAgreed', round.agreed));
      }
      fields.append(row);
    }
    const remove = element('button', 'danger', 'Удалить задачу'); remove.type = 'button'; remove.dataset.action = 'delete'; fields.append(remove);
    block.append(fields); $('#task-editors').append(block);
  }
}
function render() {
  $('#project-title').value = snapshot.title; $('#capacity').value = snapshot.weeklyCapacityHours; $('#advance').checked = snapshot.manualSecondAdvanceRecorded;
  $('#project-list').replaceChildren(); projects.forEach(project => { const option = element('option', '', project.id === currentId ? snapshot.title : project.snapshot.title); option.value = project.id; option.selected = project.id === currentId; $('#project-list').append(option); });
  renderCard($('#widget'), snapshot, { compact }); renderEditors(); persist();
  if (generatedAt) $('#share-status').textContent = generatedAt === snapshot.updatedAt ? 'Ссылка содержит текущий снимок.' : 'После создания ссылки данные изменились. Создайте новую ссылку.';
}
function commit(value) { snapshot = validateSnapshot(value); render(); }
function attempt(action) { try { action(); } catch (error) { message(error.message); render(); } }
$('#project-title').addEventListener('change', event => attempt(() => commit({ ...snapshot, title: event.target.value.trim(), updatedAt: now() })));
$('#capacity').addEventListener('change', event => attempt(() => commit({ ...snapshot, weeklyCapacityHours: Number(event.target.value), updatedAt: now() })));
$('#advance').addEventListener('change', event => commit(setManualAdvance(snapshot, event.target.checked)));
$('#task-editors').addEventListener('change', event => attempt(() => {
  const control = event.target, name = control.dataset.field;
  if (!name || !control.reportValidity()) return;
  const id = control.closest('[data-task]').dataset.task;
  if (name === 'accepted') { commit(setTaskAccepted(snapshot, id, control.checked)); return; }
  const next = structuredClone(snapshot), task = next.tasks.find(item => item.id === id);
  const roundId = control.closest('[data-round]')?.dataset.round;
  if (roundId) { const round = task.rounds.find(item => item.id === roundId); if (name === 'roundHours') round.estimateHours = Number(control.value); if (name === 'roundRate') round.rateCents = Math.round(Number(control.value) * 100); if (name === 'roundAgreed') round.agreed = control.checked; }
  else if (name === 'dependencies') { task.dependencies = control.value ? [control.value] : []; task.missingDependencies = []; }
  else if (name === 'basePrice') task.basePriceCents = Math.round(Number(control.value) * 100);
  else if (name === 'requiresSecondAdvance') task[name] = control.checked;
  else if (name === 'title') task.title = control.value.trim();
  else { task[name] = Number(control.value); if (name === 'progress' && task.progress < 100) task.accepted = false; }
  next.updatedAt = now(); commit(next);
}));
$('#task-editors').addEventListener('click', event => attempt(() => {
  const button = event.target.closest('button[data-action]'); if (!button) return;
  const id = button.closest('[data-task]').dataset.task;
  if (button.dataset.action === 'delete') commit(removeTask(snapshot, id));
  if (button.dataset.action === 'clear-missing') { const next = structuredClone(snapshot), task = next.tasks.find(item => item.id === id); task.missingDependencies = []; task.dependencies = task.dependencies.filter(dependency => next.tasks.some(item => item.id === dependency)); next.updatedAt = now(); commit(next); }
}));
$('#add-task').addEventListener('submit', event => { event.preventDefault(); attempt(() => { const form = event.currentTarget, values = new FormData(form); commit(addTask(snapshot, { title: String(values.get('title')), estimateHours: Number(values.get('estimateHours')), basePriceCents: Math.round(Number(values.get('price')) * 100) }, newId())); form.reset(); message('Задача добавлена.'); }); });
$('#background').addEventListener('change', event => $('#preview-area').classList.toggle('dark', event.target.value === 'dark'));
$('#compact').addEventListener('change', event => { compact = event.target.checked; renderCard($('#widget'), snapshot, { compact }); });
$('#project-list').addEventListener('change', event => { currentId = event.target.value; snapshot = projects.find(project => project.id === currentId).snapshot; generatedAt = null; $('#share-result').hidden = true; render(); });
$('#new-project').addEventListener('click', () => attempt(() => {
  if (projects.length >= 20) throw new Error('В этом демо можно сохранить до 20 локальных проектов.');
  currentId = newId(); snapshot = createDemo(); snapshot.title = `Новый проект ${projects.length + 1}`; snapshot.tasks = [];
  projects.push({ id: currentId, snapshot }); generatedAt = null; $('#share-result').hidden = true; render();
}));
$('#share').addEventListener('click', () => attempt(() => {
  const url = localViewerUrl(currentId, location.href); $('#share-url').value = url; $('#open-viewer').href = url;
  $('#share-result').hidden = false; generatedAt = null; render();
  $('#share-status').textContent = 'Один и тот же локальный ID получает обновления в этом браузере. С другого устройства данные пока недоступны.';
  message('Локальный просмотр по ID готов. Внешнее хранилище ещё не подключено.');
}));
$('#snapshot-link').addEventListener('click', () => attempt(() => {
  const url = createViewerUrl(snapshot, location.href); $('#share-url').value = url; $('#open-viewer').href = url;
  $('#share-result').hidden = false; generatedAt = snapshot.updatedAt; render();
  message('Создан опциональный снимок. Он не обновляется автоматически и не заменяет общую базу.');
}));
$('#copy-share').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#share-url').value); message('Ссылка скопирована.'); }
  catch { $('#share-url').focus(); $('#share-url').select(); message('Выделена ссылка. Нажмите Ctrl+C или скопируйте её вручную.'); }
});
$('#reset').addEventListener('click', () => { generatedAt = null; $('#share-result').hidden = true; commit(createDemo()); message('Текущий проект сброшен к демо-данным.'); });
$('#export').addEventListener('click', async event => {
  const button = event.currentTarget; if (button.disabled) return; button.disabled = true;
  try { const blob = await cardPng(validateSnapshot(snapshot), { compact }); download(blob, `NomadCatapult-${snapshot.updatedAt.slice(0, 10)}.png`); message('PNG карточки сохранён.'); }
  catch (error) { message(error.message); } finally { button.disabled = false; }
});
$('#export-json').addEventListener('click', () => download(new Blob([JSON.stringify(clientProjection(snapshot), null, 2)], { type: 'application/json' }), `NomadCatapult-${snapshot.updatedAt.slice(0, 10)}.json`));
$('#import-json').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    if (file.size > 65536) throw new Error('JSON слишком большой: максимум 64 КБ. Медиафайлы в снимок не включаются.');
    const imported = validateSnapshot(JSON.parse(await file.text()));
    if (projects.length >= 20) throw new Error('Достигнут лимит 20 локальных проектов.');
    currentId = newId(); snapshot = imported; projects.push({ id: currentId, snapshot }); generatedAt = null; $('#share-result').hidden = true; render(); message('JSON импортирован как отдельный локальный проект.');
  } catch (error) { message(`Импорт не выполнен: ${error.message}`); }
  finally { event.target.value = ''; }
});
render();
