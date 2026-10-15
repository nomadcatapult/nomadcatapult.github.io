import { buildCardViewModel, hours, money } from './presentation.mjs';
export { hours, money, dateLabel } from './presentation.mjs';
export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function pair(label, value, className = '') {
  const row = element('div', `pair ${className}`);
  row.append(element('span', '', label), element('strong', '', value));
  return row;
}
function disclosure(title, value, children, className = '') {
  const details = element('details', `disclosure ${className}`), summary = element('summary');
  summary.append(element('span', '', title), element('strong', '', value));
  details.append(summary, ...children);
  return details;
}
export function renderCard(root, snapshot, { compact = false } = {}) {
  const open = new Set([...root.querySelectorAll('details[open][data-key]')].map(node => node.dataset.key));
  root.replaceChildren(); root.className = `widget${compact ? ' compact' : ''}`;
  root.setAttribute('aria-label', 'Карточка состояния проекта NomadCatapult');
  const vm = buildCardViewModel(snapshot, { compact }), totals = vm.totals, header = element('header', 'widget-header');
  const brand = element('div');
  brand.append(element('p', 'wordmark', 'NomadCatapult'), element('h1', 'project-name', vm.title));
  header.append(brand, element('span', 'demo-badge', 'ДЕМО')); root.append(header);
  const resource = element('section', 'resource');
  resource.append(element('p', 'eyebrow', 'НЕДЕЛЬНЫЙ РЕСУРС'), element('p', 'remaining', vm.remainingLabel), element('p', 'resource-caption', vm.resourceLabel));
  const meter = element('div', 'meter');
  meter.setAttribute('role', 'meter'); meter.setAttribute('aria-label', 'Остаток недельного ресурса');
  meter.setAttribute('aria-valuemin', '0'); meter.setAttribute('aria-valuemax', '100'); meter.setAttribute('aria-valuenow', String(totals.remainingPercent));
  const fill = element('span'); fill.style.width = `${totals.remainingPercent}%`; meter.append(fill); resource.append(meter);
  const stats = element('div', 'resource-stats');
  stats.append(pair('Израсходовано', vm.spentLabel), pair('В резерве', vm.reservedLabel), pair('Свободно', vm.availableLabel));
  resource.append(stats, element('p', 'micro', 'Ожидание не расходует часы. Резерв входит в остаток.'));
  if (totals.overReservedHours) resource.append(element('p', 'warning', `Резерв превышает остаток на ${hours(totals.overReservedHours)} ч.`));
  if (totals.overSpentHours) resource.append(element('p', 'warning', `Превышение недельного ресурса: ${hours(totals.overSpentHours)} ч.`));
  root.append(resource);
  const section = element('section', 'task-section');
  section.append(element('h2', 'section-label', 'ЗАДАЧИ · ГОТОВНОСТЬ РЕЗУЛЬТАТА'));
  if (!snapshot.tasks.length) section.append(element('p', 'empty', 'Пока нет задач. Добавьте их в редакторе.'));
  for (const task of vm.tasks) {
    const { state, estimate } = task;
    const details = element('details', `task task-${state.key}`); details.dataset.key = task.id; details.open = open.has(task.id);
    const summary = element('summary');
    const symbol = element('span', 'status-symbol', task.tone.glyph); symbol.setAttribute('aria-hidden', 'true');
    const title = element('span', 'task-heading'); title.append(element('strong', '', task.title));
    if (state.reasons.length) title.append(element('span', 'task-reason', compact ? task.shortReason : state.reasons.join(' · ')));
    const status = element('span', 'status', state.label);
    summary.append(symbol, title, status); details.append(summary);
    const body = element('div', 'task-body');
    body.append(pair('Готовность', `${hours(task.progress)}%`));
    const progress = element('div', 'task-progress'), bar = element('span'); bar.style.width = `${task.progress}%`; progress.append(bar); body.append(progress);
    body.append(pair('План с согласованными правками', `${hours(estimate.estimateHours)} ч`), pair('Потрачено / осталось в резерве', `${hours(task.spentHours)} / ${hours(estimate.reservedHours)} ч`));
    const quote = disclosure('Смета задачи', money(estimate.totalPriceCents), [pair('Базовая работа', money(task.basePriceCents)), pair('Согласованные дополнительные правки', money(estimate.extraPriceCents))]);
    body.append(quote);
    if (task.rounds.length) {
      const rounds = task.rounds.map(round => pair(`Раунд ${round.number}`, round.included ? 'Включён в базовую цену' : `${hours(round.estimateHours)} ч × ${money(round.rateCents)} = ${money(Math.round(round.estimateHours * round.rateCents))} · ${round.agreed ? 'согласован' : 'не согласован'}`));
      body.append(disclosure('Раунды правок', String(task.rounds.length), rounds));
    }
    if (state.reasons.length) {
      const list = element('ul', 'blocker-list'); state.reasons.forEach(reason => list.append(element('li', '', reason)));
      body.append(element('p', 'micro', 'Для старта нужны все условия:'), list);
    } else if (state.key === 'ready') body.append(element('p', 'micro', 'Условия выполнены. Задача готова к старту; работа ещё не начата.'));
    details.append(body); section.append(details);
  }
  if (vm.hiddenTaskCount) section.append(element('p', 'remaining-tasks', `Ещё ${vm.hiddenTaskCount} задач · полный список в обычном режиме`));
  root.append(section);
  const budget = disclosure('Согласованная сумма', vm.totalPriceLabel, [pair('Базовый заказ', money(totals.basePriceCents)), pair('Дополнительные согласованные правки', money(totals.extraPriceCents)), element('p', 'micro', 'Согласовано ≠ оплачено. Все цены в этом демо условные.')], 'budget');
  budget.dataset.key = 'budget'; budget.open = open.has('budget'); root.append(budget);
  root.append(element('p', 'payment-note', snapshot.manualSecondAdvanceRecorded ? 'Второй аванс: вручную отмечен как полученный.' : 'Второй аванс: получение не отмечено.'));
  const footer = element('footer', 'widget-footer');
  footer.append(element('span', '', `Обновлено · ${vm.updatedLabel}`), element('span', '', 'Демо · цены условные')); root.append(footer);
}
