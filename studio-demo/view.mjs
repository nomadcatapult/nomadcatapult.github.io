import { buildCardViewModel, hours, money, CARD_SURFACE_URL } from './presentation.mjs';
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
  const previousPercent=Number(root.querySelector('[role=meter]')?.getAttribute('aria-valuenow')||0);
  const open = new Set([...root.querySelectorAll('details[open][data-key]')].map(node => node.dataset.key));
  root.replaceChildren(); root.className = `widget${compact ? ' compact' : ''}`;
  root.setAttribute('aria-label', 'Карточка состояния проекта NomadCatapult');
  const vm = buildCardViewModel(snapshot, { compact }), totals = vm.totals, header = element('header', 'widget-header');
  const brand = element('div');
  brand.append(element('p', 'wordmark', 'NomadCatapult'), element('h1', 'project-name', vm.title));
  header.append(brand, element('span', 'demo-badge', 'ДЕМО')); root.append(header);
  root.style.setProperty('--card-surface', 'url("'+CARD_SURFACE_URL+'")');root.dataset.measure=vm.measure.kind;
  const resource = element('section', 'resource');
  const measure=vm.measure;
  resource.append(element('p','eyebrow',measure.eyebrow),element('p','remaining',measure.headline),element('p','resource-caption',measure.caption));
  const meter=element('div','meter');meter.setAttribute('role','meter');meter.setAttribute('aria-label',measure.ariaLabel);meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');meter.setAttribute('aria-valuenow',String(measure.primaryPercent));meter.setAttribute('aria-valuetext',measure.ariaText);
  const fill=element('span','meter-primary');fill.style.width=measure.primaryPercent+'%';meter.append(fill);
  if(measure.kind!=='hours'){const review=element('span','meter-review');review.style.width=measure.reviewPercent+'%';review.setAttribute('aria-hidden','true');meter.append(review);}resource.append(meter);
  const stats=element('div','resource-stats');stats.dataset.columns=measure.stats.length;for(const [label,value]of measure.stats)stats.append(pair(label,value));resource.append(stats);
  if(measure.kind==='hours')resource.append(pair(measure.unallocatedLabel,measure.unallocatedValue,'unallocated'));
  resource.append(element('p','micro metric-explanation',measure.explanation));for(const warning of measure.warnings)resource.append(element('p','warning',warning));root.append(resource);
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
    if(measure.kind==='hours')body.append(pair('План с согласованными правками', `${hours(estimate.estimateHours)} ч`), pair('Потрачено / осталось в резерве', `${hours(task.spentHours)} / ${hours(estimate.reservedHours)} ч`));
    const quote = disclosure('Смета задачи', money(estimate.totalPriceCents), [pair('Базовая работа', money(task.basePriceCents)), pair('Согласованные дополнительные правки', money(estimate.extraPriceCents))]);
    body.append(quote);
    if (task.rounds.length) {
      const rounds = task.rounds.map(round => pair(`Раунд ${round.number}`, round.included ? 'Включён в базовую цену' : measure.kind!=='hours' ? (round.agreed?'Согласовано: ':'Предложено: ')+money(Math.round(round.estimateHours*round.rateCents)) : `${hours(round.estimateHours)} ч × ${money(round.rateCents)} = ${money(Math.round(round.estimateHours * round.rateCents))} · ${round.agreed ? 'согласован' : 'не согласован'}`));
      body.append(disclosure('Раунды правок', String(task.rounds.length), rounds));
    }
    if (state.reasons.length) {
      const list = element('ul', 'blocker-list'); state.reasons.forEach(reason => list.append(element('li', '', reason)));
      body.append(element('p', 'micro', 'Для старта нужны все условия:'), list);
    } else if (state.key === 'ready') body.append(element('p', 'micro', 'Условия выполнены. Задача готова к старту; работа ещё не начата.'));
    details.append(body); section.append(details);
  }
  if (vm.hiddenTaskCount) section.append(element('p', 'remaining-tasks', vm.hiddenTasksLabel));
  root.append(section);
  const payments=element('section','payment-section');payments.append(element('h2','section-label','АВАНСЫ · СОБЫТИЯ ОПЛАТЫ'));
  if(!vm.payments.length)payments.append(element('p','micro','Платёжные этапы не заданы.'));
  for(const p of vm.payments){const row=element('div','payment-row payment-'+p.state.key);row.dataset.payment=p.id;
    const head=element('div','payment-row-head');head.append(element('span','payment-icon',p.state.key==='received'?'✓':'↗'),element('strong','payment-title',p.title),element('strong','payment-amount',p.amountLabel));
    row.append(head,element('span','payment-status',p.state.label));if(p.state.reasons.length)row.append(element('p','micro',p.state.reasons.join(' · ')));payments.append(row);
  }
  payments.append(pair('Получено · ручные отметки',vm.paidLabel),element('p','micro','Авансы входят в оплату заказа, не прибавляются к его цене.'));root.append(payments);
  const budget = disclosure('Согласованная сумма', vm.totalPriceLabel, [pair('Базовый заказ', money(totals.basePriceCents)), pair('Дополнительные согласованные правки', money(totals.extraPriceCents)), element('p', 'micro', 'Согласовано ≠ оплачено. Все цены в этом демо условные.')], 'budget');
  budget.dataset.key = 'budget'; budget.open = open.has('budget'); root.append(budget);

  const footer = element('footer', 'widget-footer');
  footer.append(element('span', '', `Обновлено · ${vm.updatedLabel}`), element('span', '', 'Демо · цены условные')); root.append(footer);
  if(previousPercent!==measure.primaryPercent&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&measure.primaryPercent){fill.animate([{transform:'scaleX('+previousPercent/measure.primaryPercent+') scaleY(.85)'},{transform:'scaleX(1.03) scaleY(1.08)',offset:.7},{transform:'scaleX(1) scaleY(1)'}],{duration:420,easing:'cubic-bezier(.2,.7,.25,1)'});}
}
