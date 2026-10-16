import { validateSnapshot, projectTotals, taskTotals, taskState, paymentState, paymentTotals } from './model.mjs';
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
  const tasks = compact ? allTasks.slice(0, COMPACT_TASK_LIMIT) : allTasks;
  return { snapshot, title: snapshot.title, updatedLabel: dateLabel(snapshot.updatedAt), totals,
    remainingLabel: `${totals.remainingPercent}% осталось`,
    resourceLabel: `${hours(totals.remainingHours)} из ${hours(snapshot.weeklyCapacityHours)} ч`,
    spentLabel: `${hours(totals.spentHours)} ч`, reservedLabel: `${hours(totals.reservedHours)} ч`,
    availableLabel: `${hours(totals.availableHours)} ч`, totalPriceLabel: money(totals.totalPriceCents),
    payments, payment, paidLabel:snapshot.payments.some(p=>p.status==='received'&&!p.amountCents)?(payment.receivedCents?money(payment.receivedCents)+' + сумма не задана':'Сумма не задана'):money(payment.receivedCents), plannedPaymentLabel:money(payment.plannedCents),
    allTasks, tasks, hiddenTaskCount: allTasks.length - tasks.length };
}
