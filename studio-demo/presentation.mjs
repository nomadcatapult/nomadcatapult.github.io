import { validateSnapshot, projectTotals, taskTotals, taskState, paymentState, paymentTotals, resultProgress } from './model.mjs';
/** One fixed original SVG surface is shared by the web card and the PNG's resting frame. */
export const SURFACE_PALETTE = Object.freeze(['#ed625d','#42b6c6','#f79f88','#b2dfe6','#03232d']);
export const CARD_SURFACE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" preserveAspectRatio="none"><defs>
<linearGradient id="base" x2="1" y2="1"><stop stop-color="#b2dfe6"/><stop offset=".52" stop-color="#ed625d"/><stop offset="1" stop-color="#f79f88"/></linearGradient>
<radialGradient id="cyan"><stop stop-color="#42b6c6"/><stop offset="1" stop-color="#42b6c6" stop-opacity="0"/></radialGradient>
<radialGradient id="teal"><stop stop-color="#03232d"/><stop offset="1" stop-color="#03232d" stop-opacity="0"/></radialGradient>
<radialGradient id="peach"><stop stop-color="#f79f88"/><stop offset="1" stop-color="#f79f88" stop-opacity="0"/></radialGradient>
<filter id="bend" x="-.2" y="-.2" width="1.4" height="1.4"><feTurbulence type="fractalNoise" baseFrequency=".002 .003" numOctaves="2" seed="8" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="90" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" stitchTiles="stitch" seed="23"/></filter></defs>
<rect width="800" height="1000" fill="url(#base)"/><g filter="url(#bend)"><ellipse cx="40" cy="430" rx="490" ry="530" fill="url(#cyan)"/><ellipse cx="0" cy="1010" rx="760" ry="600" fill="url(#teal)"/><ellipse cx="760" cy="1020" rx="660" ry="540" fill="url(#peach)"/></g>
<rect width="800" height="1000" filter="url(#grain)" opacity=".25"/><rect width="800" height="1000" fill="#edf0ed" opacity=".66"/></svg>`;
export const CARD_SURFACE_URL='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(CARD_SURFACE_SVG);
let surfaceImage;
export function cardSurfaceImage(){return surfaceImage??=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{surfaceImage=null;reject(new Error('Не удалось подготовить текстуру PNG.'));};image.src=CARD_SURFACE_URL;});}
export const COMPACT_TASK_LIMIT = 4;
export const hours = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
export const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(cents / 100).replace(/\.00$/, '');
export const dateLabel = iso => new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
const tones = {
  blocked: { chip: '#d4dbe0', ink: '#3d4854', icon: 'lock', glyph: 'Ⅱ' },
  accepted: { chip: '#d4e3c9', ink: '#315f28', icon: 'check', glyph: '✓' },
  active: { chip: '#eee0ae', ink: '#665020', icon: 'ring', glyph: '○' },
  review: { chip: '#eee0ae', ink: '#665020', icon: 'ring', glyph: '○' },
  ready: { chip: '#dce7bd', ink: '#495f24', icon: 'ring', glyph: '○' }
};
function shortReasons(reasons) {
  return reasons.map(reason => reason
    .replace('Ждёт аванс: Второй аванс', 'Ждёт второй аванс')
    .replace('Ожидаем ручную отметку второго аванса', 'Ждёт второй аванс')
    .replace('Ожидаем принятия:', 'Ждёт принятия:')
    .replace(/Удалён предшественник «.*» — переназначьте или снимите зависимость/, 'Удалён предшественник — нужно решение')
    .replace('Предшественник отсутствует — переназначьте зависимость', 'Нет предшественника — нужно решение'));
}
/** Shared DOM/PNG presentation. Totals always account for every task, including hidden ones. */
export function buildCardViewModel(input, { compact = false } = {}) {
  const snapshot = validateSnapshot(input), totals = projectTotals(snapshot);
  const allTasks = snapshot.tasks.map(task => {
    const state = taskState(snapshot, task), total = taskTotals(task), reasons = shortReasons(state.reasons);
    return { ...task, state, estimate: total, tone: tones[state.key],
      shortReason: reasons.slice(0, 2).join(' · ') + (reasons.length > 2 ? ` · ещё ${reasons.length - 2} условий` : ''),
      priceLabel: money(total.totalPriceCents) };
  });
  const payments=snapshot.payments.map(p=>({...p,state:paymentState(snapshot,p),amountLabel:p.amountCents?money(p.amountCents):'Сумма не задана'}));
  const payment=paymentTotals(snapshot);
  const results=resultProgress(snapshot),kind=snapshot.measurement.kind;
  const measure=kind==='hours'?{
    kind,eyebrow:'НЕДЕЛЬНЫЙ РЕСУРС · ОСТАТОК',headline:`${totals.remainingPercent}% осталось`,caption:`${hours(totals.remainingHours)} из ${hours(snapshot.weeklyCapacityHours)} ч`,
    primaryPercent:totals.remainingPercent,reviewPercent:0,ariaLabel:'Остаток недельного ресурса',
    ariaText:`Осталось ${hours(totals.remainingHours)} из ${hours(snapshot.weeklyCapacityHours)} часов. Из них ${hours(totals.reservedHours)} в резерве; ${hours(totals.availableHours)} не распределено по задачам.`,
    stats:[['Использовано',`${hours(totals.spentHours)} ч`],['Резерв под задачи',`${hours(totals.reservedHours)} ч`]],
    unallocatedLabel:'Не распределено по задачам',unallocatedValue:`${hours(totals.availableHours)} ч`,
    explanation:'Остаток уже включает резерв. Не распределено = пакет − использовано − резерв, минимум 0. Ожидание часы не расходует.',
    warnings:[totals.overSpentHours?`Использовано сверх пакета: ${hours(totals.overSpentHours)} ч.`:'',totals.overReservedHours?`Резерв сверх остатка: ${hours(totals.overReservedHours)} ч.`:''].filter(Boolean)
  }:{kind,eyebrow:'РЕЗУЛЬТАТЫ · ПРИНЯТЫЙ ОБЪЁМ',
    headline:kind==='units'?`${results.accepted} из ${results.total}`:`${Math.round(results.acceptedPercent)}% принято`,
    caption:results.total?(kind==='units'?snapshot.measurement.unitLabel+' · принято':'По задачам с равным весом'):'Пока нет задач · добавьте результат в список',
    primaryPercent:results.acceptedPercent,reviewPercent:results.readyPercent,ariaLabel:'Доля принятых результатов',
    ariaText:kind==='units'?`Принято ${results.accepted} из ${results.total} ${snapshot.measurement.unitLabel}; готово к приёмке ${results.ready}.`:`Принято ${Math.round(results.acceptedPercent)} процентов; готово к приёмке ${Math.round(results.readyPercent)} процентов.`,
    stats:kind==='units'?[['Принято',String(results.accepted)],['Готово, ждёт приёмки',String(results.ready)],['В работе / ожидании',String(results.pending)]]:[['Принято',Math.round(results.acceptedPercent)+'%'],['Готово, ждёт приёмки',Math.round(results.readyPercent)+'%'],['В работе / ожидании',Math.round(results.pendingPercent)+'%']],
    explanation:'Лайм — принято. Штриховка — готово к приёмке, ещё не завершено. Одна задача — один результат; авансы не учитываются.',warnings:[]};
  const tasks = compact ? allTasks.slice(0, COMPACT_TASK_LIMIT) : allTasks;
  return { snapshot, title: snapshot.title, updatedLabel: dateLabel(snapshot.updatedAt), totals,
    remainingLabel: `${totals.remainingPercent}% осталось`,
    resourceLabel: `${hours(totals.remainingHours)} из ${hours(snapshot.weeklyCapacityHours)} ч`,
    spentLabel: `${hours(totals.spentHours)} ч`, reservedLabel: `${hours(totals.reservedHours)} ч`,
    availableLabel: `${hours(totals.availableHours)} ч`, totalPriceLabel: money(totals.totalPriceCents),
    measure, results, payments, payment, paidLabel:snapshot.payments.some(p=>p.status==='received'&&!p.amountCents)?(payment.receivedCents?money(payment.receivedCents)+' + сумма не задана':'Сумма не задана'):money(payment.receivedCents), plannedPaymentLabel:money(payment.plannedCents),
    allTasks, tasks, hiddenTaskCount: allTasks.length - tasks.length,
    hiddenTasksLabel:kind==='percent'?'Остальные задачи — в полной карточке':`Ещё ${allTasks.length-tasks.length} ${['задача','задачи','задач'][new Intl.PluralRules('ru-RU').select(allTasks.length-tasks.length)==='one'?0:new Intl.PluralRules('ru-RU').select(allTasks.length-tasks.length)==='few'?1:2]} · итоги учитывают весь список` };
}
