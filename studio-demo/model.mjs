/** Shared, DOM-free model for an editor and a snapshot viewer. Money is integer cents. */
import { viewerPageUrl } from './urls.mjs';
export const SNAPSHOT_VERSION = 2;
export const MAX_FRAGMENT_LENGTH = 24000;
const MAX_TASKS = 40;
const clone = value => JSON.parse(JSON.stringify(value));
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const number = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const text = (value, max) => typeof value === 'string' && value.length > 0 && value.length <= max;
const requireValue = (valid, message) => { if (!valid) throw new Error(message); };
const roundHours = value => Math.round(value * 100) / 100;
export function createDemo(now = new Date().toISOString()) {
  return validateSnapshot({
    version: SNAPSHOT_VERSION, title: 'Демо-проект', updatedAt: now,
    weeklyCapacityHours: 20, manualSecondAdvanceRecorded: false,
    tasks: [
      { id: 'episode-1', title: 'Эпизод 1', estimateHours: 8, spentHours: 8,
        basePriceCents: 14000, progress: 80, accepted: false,
        requiresSecondAdvance: false, dependencies: [], missingDependencies: [],
        rounds: [
          { id: 'round-1', number: 1, included: true, agreed: true, estimateHours: 0, rateCents: 0 },
          { id: 'round-2', number: 2, included: true, agreed: true, estimateHours: 0, rateCents: 0 },
          { id: 'round-3', number: 3, included: false, agreed: true, estimateHours: 3, rateCents: 5000 }
        ] },
      { id: 'montage', title: 'Монтаж', estimateHours: 4, spentHours: 0,
        basePriceCents: 6000, progress: 0, accepted: false,
        requiresSecondAdvance: true, dependencies: ['episode-1'], missingDependencies: [], rounds: [] }
    ]
  });
}
export function validateSnapshot(value) {
  value = clone(value);
  requireValue(object(value) && [1, SNAPSHOT_VERSION].includes(value.version), 'Неподдерживаемая версия снимка.');
  const legacy = !Array.isArray(value.payments);
  if (legacy) value.payments = [{id:'legacy-second-advance',title:'Второй аванс',amountCents:0,status:value.manualSecondAdvanceRecorded ? 'received' : 'planned',dependencies:[],missingDependencies:[]}];
  for (const task of value.tasks || []) {
    task.paymentDependencies ??= task.requiresSecondAdvance ? ['legacy-second-advance'] : [];
    task.requiresSecondAdvance ??= false;
  }
  value.manualSecondAdvanceRecorded = Boolean(value.payments.find(p=>p.id==='legacy-second-advance')?.status === 'received');
  value.mode = ['turnkey','together','consult','rescue'].includes(value.mode) ? value.mode : 'turnkey';
  requireValue(Array.isArray(value.payments) && value.payments.length <= 20, 'Допустимо до 20 платёжных этапов.');
  const paymentIds = new Set();
  for (const p of value.payments) {
    requireValue(object(p) && text(p.id,80) && /^[a-zA-Z0-9_-]+$/.test(p.id) && !paymentIds.has(p.id), 'Некорректный ID аванса.'); paymentIds.add(p.id);
    requireValue(text(p.title,160) && Number.isInteger(p.amountCents) && number(p.amountCents,0,100000000), 'Некорректная сумма аванса.');
    requireValue(['planned','received'].includes(p.status), 'Некорректный статус аванса.');
    requireValue(Array.isArray(p.dependencies) && p.dependencies.length<=60 && p.dependencies.every(id=>text(id,80)&&id!==p.id) && new Set(p.dependencies).size===p.dependencies.length, 'Некорректные условия аванса.');
    requireValue(Array.isArray(p.missingDependencies) && p.missingDependencies.length<=60 && p.missingDependencies.every(name=>text(name,160)), 'Некорректные удалённые условия аванса.');
  }
  requireValue(text(value.title, 100), 'Название проекта должно содержать 1–100 символов.');
  requireValue(text(value.updatedAt, 40) && Number.isFinite(Date.parse(value.updatedAt)), 'Некорректная дата снимка.');
  requireValue(number(value.weeklyCapacityHours, 0.25, 500), 'Некорректный недельный ресурс.');
  requireValue(typeof value.manualSecondAdvanceRecorded === 'boolean', 'Некорректная ручная отметка оплаты.');
  requireValue(Array.isArray(value.tasks) && value.tasks.length <= MAX_TASKS, 'В снимке допустимо до 40 задач.');
  const ids = new Set();
  for (const task of value.tasks) {
    requireValue(object(task) && text(task.id, 80) && /^[a-zA-Z0-9_-]+$/.test(task.id) && !ids.has(task.id), 'Некорректный или повторяющийся ID задачи.');
    requireValue(!paymentIds.has(task.id), 'ID задачи совпадает с авансом.'); ids.add(task.id);
    requireValue(Array.isArray(task.paymentDependencies) && task.paymentDependencies.length<=20 && task.paymentDependencies.every(id=>text(id,80)) && new Set(task.paymentDependencies).size===task.paymentDependencies.length, 'Некорректные условия оплаты.');
    requireValue(text(task.title, 160), 'Некорректное название задачи.');
    requireValue(number(task.estimateHours, 0, 500) && number(task.spentHours, 0, 500), 'Некорректные часы задачи.');
    requireValue(Number.isInteger(task.basePriceCents) && number(task.basePriceCents, 0, 100000000), 'Некорректная цена задачи.');
    requireValue(number(task.progress, 0, 100) && typeof task.accepted === 'boolean' && typeof task.requiresSecondAdvance === 'boolean', 'Некорректное состояние задачи.');
    requireValue(Array.isArray(task.dependencies) && task.dependencies.length <= MAX_TASKS && task.dependencies.every(id => text(id, 80) && id !== task.id), 'Некорректные зависимости.');
    requireValue(new Set(task.dependencies).size === task.dependencies.length, 'Повторяющиеся зависимости.');
    requireValue(Array.isArray(task.missingDependencies) && task.missingDependencies.length <= MAX_TASKS && task.missingDependencies.every(name => text(name, 160)), 'Некорректные удалённые зависимости.');
    requireValue(Array.isArray(task.rounds) && task.rounds.length <= 10, 'Слишком много раундов правок.');
    const roundIds = new Set();
    for (const round of task.rounds) {
      requireValue(object(round) && text(round.id, 80) && !roundIds.has(round.id) && Number.isInteger(round.number) && number(round.number, 1, 100), 'Некорректный раунд правок.');
      roundIds.add(round.id);
      requireValue(typeof round.included === 'boolean' && typeof round.agreed === 'boolean' && number(round.estimateHours, 0, 500) && Number.isInteger(round.rateCents) && number(round.rateCents, 0, 10000000), 'Некорректная оценка правок.');
      requireValue(!round.included || (round.rateCents === 0 && round.estimateHours === 0), 'Включённые раунды уже входят в базовую оценку.');
    }
  }
  const tasksById = new Map([...value.tasks,...value.payments].map(task => [task.id, task]));
  const visiting = new Set(), visited = new Set();
  function visit(id) {
    if (visited.has(id)) return;
    requireValue(!visiting.has(id), 'Циклические зависимости задач.');
    visiting.add(id);
    for (const dependency of [...tasksById.get(id).dependencies,...(tasksById.get(id).paymentDependencies || [])]) if (tasksById.has(dependency)) visit(dependency);
    visiting.delete(id); visited.add(id);
  }
  [...value.tasks,...value.payments].forEach(task => visit(task.id));
  // Construct an allowlisted copy: imported JSON never supplies executable markup or extra state.
  return {
    version: SNAPSHOT_VERSION, title: value.title, updatedAt: value.updatedAt,
    weeklyCapacityHours: value.weeklyCapacityHours, manualSecondAdvanceRecorded: value.manualSecondAdvanceRecorded, mode:value.mode,
    payments:value.payments.map(p=>({id:p.id,title:p.title,amountCents:p.amountCents,status:p.status,dependencies:[...p.dependencies],missingDependencies:[...p.missingDependencies]})),
    tasks: value.tasks.map(task => ({
      id: task.id, title: task.title, estimateHours: task.estimateHours, spentHours: task.spentHours,
      basePriceCents: task.basePriceCents, progress: task.progress, accepted: task.accepted,
      requiresSecondAdvance: task.requiresSecondAdvance, paymentDependencies:[...task.paymentDependencies], dependencies: [...task.dependencies],
      missingDependencies: [...task.missingDependencies],
      rounds: task.rounds.map(round => ({ id: round.id, number: round.number, included: round.included,
        agreed: round.agreed, estimateHours: round.estimateHours, rateCents: round.rateCents }))
    }))
  };
}
export function taskTotals(task) {
  const extraRounds = task.rounds.filter(round => !round.included && round.agreed);
  const extraPriceCents = extraRounds.reduce((sum, round) => sum + Math.round(round.estimateHours * round.rateCents), 0);
  const estimateHours = roundHours(task.estimateHours + extraRounds.reduce((sum, round) => sum + round.estimateHours, 0));
  return { estimateHours, extraPriceCents, totalPriceCents: task.basePriceCents + extraPriceCents,
    reservedHours: task.accepted ? 0 : roundHours(Math.max(0, estimateHours - task.spentHours)) };
}
export function taskState(snapshot, task) {
  const reasons = [];
  for (const id of task.paymentDependencies || (task.requiresSecondAdvance ? ['legacy-second-advance'] : [])) {
    const payment=snapshot.payments?.find(p=>p.id===id);
    if (!payment || paymentState(snapshot,payment).key !== 'received') reasons.push(payment ? 'Ждёт аванс: '+payment.title : 'Аванс отсутствует — переназначьте условие');
  }
  for (const id of task.dependencies) {
    const predecessor = snapshot.tasks.find(item => item.id === id);
    if (!predecessor) reasons.push('Предшественник отсутствует — переназначьте зависимость');
    else if (!predecessor.accepted) reasons.push(`Ожидаем принятия: ${predecessor.title}`);
  }
  for (const name of task.missingDependencies) reasons.push(`Удалён предшественник «${name}» — переназначьте или снимите зависимость`);
  if (reasons.length) return { key: 'blocked', label: 'Ожидает условий', reasons };
  if (task.accepted) return { key: 'accepted', label: 'Принято', reasons };
  if (task.progress >= 100) return { key: 'review', label: 'Ожидает принятия', reasons };
  if (task.progress > 0) return { key: 'active', label: 'В работе', reasons };
  return { key: 'ready', label: 'Готова к старту', reasons };
}
export function projectTotals(snapshot) {
  const totals = snapshot.tasks.map(taskTotals);
  const spentHours = roundHours(snapshot.tasks.reduce((sum, task) => sum + task.spentHours, 0));
  const remainingHours = roundHours(Math.max(0, snapshot.weeklyCapacityHours - spentHours));
  const reservedHours = roundHours(totals.reduce((sum, task) => sum + task.reservedHours, 0));
  const basePriceCents = snapshot.tasks.reduce((sum, task) => sum + task.basePriceCents, 0);
  const extraPriceCents = totals.reduce((sum, task) => sum + task.extraPriceCents, 0);
  return { spentHours, remainingHours, reservedHours, availableHours: roundHours(Math.max(0, remainingHours - reservedHours)),
    overReservedHours: roundHours(Math.max(0, reservedHours - remainingHours)),
    overSpentHours: roundHours(Math.max(0, spentHours - snapshot.weeklyCapacityHours)),
    remainingPercent: Math.round(remainingHours / snapshot.weeklyCapacityHours * 100),
    basePriceCents, extraPriceCents, totalPriceCents: basePriceCents + extraPriceCents };
}
export function removeTask(snapshot, id, now = new Date().toISOString()) {
  const result = clone(snapshot), removed = result.tasks.find(task => task.id === id);
  if (!removed) return result;
  result.tasks = result.tasks.filter(task => task.id !== id);
  for (const task of [...result.tasks,...result.payments]) if (task.dependencies.includes(id)) {
    task.dependencies = task.dependencies.filter(dependency => dependency !== id);
    task.missingDependencies = [...new Set([...task.missingDependencies, removed.title])];
  }
  result.updatedAt = now;
  return validateSnapshot(result);
}
export function setManualAdvance(snapshot, recorded, now = new Date().toISOString()) {
  const result = clone(snapshot);
  result.manualSecondAdvanceRecorded = Boolean(recorded);
  const p=result.payments.find(p=>p.id==='legacy-second-advance'); if(p)p.status=recorded?'received':'planned'; result.updatedAt = now;
  return validateSnapshot(result);
}
export function setTaskAccepted(snapshot, id, accepted, now = new Date().toISOString()) {
  const result = clone(snapshot), task = result.tasks.find(item => item.id === id);
  requireValue(task, 'Задача не найдена.');
  requireValue(!accepted || taskState(result, task).key !== 'blocked', 'Сначала выполните условия задачи.');
  task.accepted = Boolean(accepted);
  if (accepted) task.progress = 100;
  result.updatedAt = now;
  return validateSnapshot(result);
}
export function addTask(snapshot, input, id, now = new Date().toISOString()) {
  const result = clone(snapshot);
  result.tasks.push({ id, title: input.title.trim(), estimateHours: input.estimateHours, spentHours: 0,
    basePriceCents: input.basePriceCents, progress: 0, accepted: false, requiresSecondAdvance: false,
    dependencies: [], missingDependencies: [], rounds: [] });
  result.updatedAt = now;
  return validateSnapshot(result);
}
/** A replaceable transport boundary: later an ID/storage adapter can implement these two methods. */
export const fragmentSnapshotTransport = {
  encode(snapshot) {
    const bytes = new TextEncoder().encode(JSON.stringify(validateSnapshot(snapshot)));
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    const fragment = 'snapshot=' + btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    requireValue(fragment.length <= MAX_FRAGMENT_LENGTH, 'Снимок слишком большой для ссылки. Сократите число задач или длину названий.');
    return fragment;
  },
  decode(fragment) {
    requireValue(typeof fragment === 'string' && fragment.length <= MAX_FRAGMENT_LENGTH + 1, 'Ссылка слишком длинная.');
    const normalized = fragment.startsWith('#') ? fragment.slice(1) : fragment;
    requireValue(normalized.startsWith('snapshot='), 'В ссылке нет снимка проекта.');
    const encoded = normalized.slice(9);
    requireValue(encoded.length > 0 && /^[A-Za-z0-9_-]+$/.test(encoded), 'Повреждённый снимок в ссылке.');
    try {
      const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
      const json = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
      return validateSnapshot(JSON.parse(json));
    } catch (error) { throw new Error(`Не удалось открыть снимок: ${error.message}`); }
  }
};
export function createViewerUrl(snapshot, editorUrl) {
  const url = viewerPageUrl(editorUrl);
  url.search = ''; url.hash = fragmentSnapshotTransport.encode(snapshot);
  return url.href;
}

/** Payment events never add to the agreed budget or consume labour hours. */
export function paymentState(snapshot,payment,seen=new Set()) {
  if(seen.has(payment.id))return {key:'blocked',label:'Ошибка условий',reasons:['Циклические зависимости']};
  const chain=new Set(seen);chain.add(payment.id);const reasons=[];
  for(const id of payment.dependencies){const task=snapshot.tasks.find(t=>t.id===id), p=snapshot.payments.find(p=>p.id===id);
    if(task){if(!task.accepted)reasons.push('Ждёт принятия: '+task.title);}
    else if(p){if(paymentState(snapshot,p,chain).key!=='received')reasons.push('Ждёт аванс: '+p.title);}
    else reasons.push('Условие отсутствует — переназначьте зависимость');
  }
  for(const name of payment.missingDependencies)reasons.push('Удалено условие: '+name);
  if(payment.status==='received')return {key:'received',label:'Получен · вручную',reasons};
  return reasons.length?{key:'blocked',label:'После условий',reasons}:{key:'planned',label:'Ожидается',reasons};
}
export function paymentTotals(snapshot){const receivedCents=snapshot.payments.filter(p=>p.status==='received').reduce((s,p)=>s+p.amountCents,0), plannedCents=snapshot.payments.filter(p=>p.status!=='received').reduce((s,p)=>s+p.amountCents,0);return {receivedCents,plannedCents};}
export function removePayment(snapshot,id,now=new Date().toISOString()){
  const next=clone(snapshot),removed=next.payments.find(p=>p.id===id);if(!removed)return next;
  next.payments=next.payments.filter(p=>p.id!==id);
  for(const item of [...next.tasks,...next.payments]){const key='paymentDependencies' in item?'paymentDependencies':'dependencies';if(item[key].includes(id)){item[key]=item[key].filter(d=>d!==id);item.missingDependencies=[...new Set([...item.missingDependencies,removed.title])];}}
  next.updatedAt=now;return validateSnapshot(next);
}
export const MODES=[
 {id:'turnkey',title:'Мы делаем — вы пьёте чай',short:'Под ключ',description:'От идеи до готового результата. Вы согласуете ключевые этапы.'},
 {id:'together',title:'Мы делаем — вы за штурвалом',short:'Вместе',description:'Вы задаёте направление, мы собираем и проверяем каждую итерацию.'},
 {id:'consult',title:'Вы делаете — мы подсказываем',short:'Консультация',description:'Разбираем задачу, даём рекомендации и проверяем ваш следующий шаг.'},
 {id:'rescue',title:'Вы уже сделали — мы спасаем',short:'Спасение',description:'Сначала диагностика, затем согласованный план исправлений и проверка.'}
];
export function createTemplate(mode,now=new Date().toISOString()){
  const spec={
    turnkey:{hours:24,tasks:[['Бриф и концепция',4,120],['Производство',12,360],['Финальная сборка',4,120]],advance:180},
    together:{hours:16,tasks:[['Совместная сессия',2,80],['Прототип по вашему курсу',6,180],['Совместная итерация',4,120]],advance:120},
    consult:{hours:6,tasks:[['Разбор материалов',1,40],['Консультация и план',2,100],['Проверка вашего решения',1,40]],advance:80},
    rescue:{hours:12,tasks:[['Диагностика проекта',2,80],['Исправление главного риска',5,200],['Проверка и передача',2,80]],advance:100}
  }[mode]; requireValue(spec,'Неизвестный режим.');
  const tasks=spec.tasks.map(([title,estimateHours,price],i)=>({id:mode+'-task-'+i,title,estimateHours,spentHours:0,basePriceCents:price*100,progress:0,accepted:false,requiresSecondAdvance:false,paymentDependencies:[i===0?'start-advance':'next-advance'],dependencies:i?[mode+'-task-'+(i-1)]:[],missingDependencies:[],rounds:[1,2].map(n=>({id:'round-'+n,number:n,included:true,agreed:true,estimateHours:0,rateCents:0}))}));
  return validateSnapshot({version:SNAPSHOT_VERSION,title:'Демо · '+MODES.find(m=>m.id===mode).short,mode,updatedAt:now,weeklyCapacityHours:spec.hours,manualSecondAdvanceRecorded:false,tasks,payments:[
    {id:'start-advance',title:'Стартовый аванс',amountCents:spec.advance*100,status:'planned',dependencies:[],missingDependencies:[]},
    {id:'next-advance',title:'Аванс следующего этапа',amountCents:spec.advance*100,status:'planned',dependencies:[tasks[0].id],missingDependencies:[]}
  ]});
}
