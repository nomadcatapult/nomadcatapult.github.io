import { buildCardViewModel, hours } from './presentation.mjs';
const FONT = '"Segoe UI", Arial, sans-serif';
export function wrapText(ctx, value, maxWidth, maxLines = Infinity) {
  const lines = []; let current = '';
  for (const word of String(value).split(/\s+/u).filter(Boolean)) {
    const combined = current ? current + ' ' + word : word;
    if (ctx.measureText(combined).width <= maxWidth) { current = combined; continue; }
    if (current) { lines.push(current); current = ''; }
    for (const character of word) {
      if (current && ctx.measureText(current + character).width > maxWidth) { lines.push(current); current = character; }
      else current += character;
    }
  }
  if (current || !lines.length) lines.push(current.trimEnd());
  if (lines.length > maxLines) {
    lines.length = maxLines; let last = lines[maxLines - 1];
    while (last && ctx.measureText(last + '…').width > maxWidth) last = Array.from(last).slice(0, -1).join('');
    lines[maxLines - 1] = last.trimEnd() + '…';
  }
  return lines;
}
/** Four task summaries; totals include every task. Detailed quotes/rounds stay in the web view. */
export function compactCardLayout(snapshot, { compact = false, context } = {}) {
  const vm = buildCardViewModel(snapshot, { compact: true }), width = compact ? 420 : 520, pad = compact ? 23 : 29;
  const ctx = context || document.createElement('canvas').getContext('2d'), innerWidth = width - pad * 2;
  ctx.font = `500 15px ${FONT}`;
  const projectLines = wrapText(ctx, vm.title, innerWidth - 56), headerHeight = 43 + projectLines.length * 21;
  const resourceHeight = 171 + (vm.totals.overSpentHours || vm.totals.overReservedHours ? 24 : 0);
  const titleFontSize = 15, titleLineHeight = 21, rowTextWidth = innerWidth - 64;
  const rows = vm.tasks.map(task => {
    ctx.font = `700 ${titleFontSize}px ${FONT}`; const titleLines = wrapText(ctx, task.title, rowTextWidth);
    ctx.font = `400 11px ${FONT}`; const reasonLines = task.shortReason ? wrapText(ctx, task.shortReason, rowTextWidth, 3) : [];
    return { task, titleLines, reasonLines, height: Math.max(76, 52 + titleLines.length * titleLineHeight + reasonLines.length * 16) };
  });
  const hiddenHeight = vm.hiddenTaskCount ? 30 : 0, emptyHeight = rows.length ? 0 : 45;
  const height = Math.ceil(pad * 2 + headerHeight + 18 + resourceHeight + 24 + 20 + rows.reduce((sum, row) => sum + row.height, 0) + hiddenHeight + emptyHeight + 19 + 108);
  return { vm, width, height, pad, innerWidth, headerHeight, resourceHeight, rows, hiddenHeight, emptyHeight, titleFontSize, titleLineHeight };
}
function rounded(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}
function text(ctx, value, x, y, size = 12, weight = 400, color = '#45515d') {
  ctx.font = `${weight} ${size}px ${FONT}`; ctx.fillStyle = color; ctx.textBaseline = 'top'; ctx.fillText(value, x, y);
}
function icon(ctx, kind, x, y, color) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.1; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (kind === 'lock') {
    ctx.beginPath(); ctx.arc(10, 9, 5, Math.PI, 0); ctx.stroke(); rounded(ctx, 2.5, 9, 15, 13, 2.5, null, color);
    ctx.beginPath(); ctx.moveTo(10, 14); ctx.lineTo(10, 17); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(10, 11, 9, 0, Math.PI * 2); if (kind === 'check') ctx.fill(); else ctx.stroke();
    if (kind === 'check') { ctx.strokeStyle = '#f4f7ef'; ctx.beginPath(); ctx.moveTo(5.5, 11); ctx.lineTo(9, 14.5); ctx.lineTo(15, 8); ctx.stroke(); }
  }
  ctx.restore();
}
export async function cardPng(snapshot, { compact = false } = {}) {
  const layout = compactCardLayout(snapshot, { compact });
  const { vm, width, height, pad, innerWidth, headerHeight, resourceHeight, rows } = layout;
  const scale = 2, canvas = document.createElement('canvas'); canvas.width = width * scale; canvas.height = height * scale;
  const ctx = canvas.getContext('2d'); ctx.scale(scale, scale);
  const gradient = ctx.createLinearGradient(0, 0, width, height); gradient.addColorStop(0, '#d6dce0'); gradient.addColorStop(.52, '#bdc5cc'); gradient.addColorStop(1, '#adb9bd');
  ctx.beginPath(); ctx.roundRect(0, 0, width, height, 21); ctx.clip(); ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
  let seed = 23; const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < width * height / 20; i++) { ctx.fillStyle = random() > .5 ? '#ffffff08' : '#25313d05'; ctx.fillRect(random() * width, random() * height, 1, 1); }
  rounded(ctx, .5, .5, width - 1, height - 1, 21, null, '#73808c55');
  let y = pad;
  text(ctx, 'NomadCatapult', pad, y, compact ? 24 : 28, 800, '#141a22');
  rounded(ctx, width - pad - 49, y + 2, 49, 23, 12, '#edf0f15c'); text(ctx, 'ДЕМО', width - pad - 40, y + 9, 9, 700, '#38434e');
  ctx.font = `500 15px ${FONT}`;
  wrapText(ctx, vm.title, innerWidth - 56).forEach((line, index) => text(ctx, line, pad, y + 39 + index * 21, 15, 500));
  y += headerHeight + 18;
  rounded(ctx, pad, y, innerWidth, resourceHeight, 14, '#f1f3f340', '#63717e33');
  const inset = pad + 17, contentWidth = innerWidth - 34;
  text(ctx, 'НЕДЕЛЬНЫЙ РЕСУРС', inset, y + 16, 9, 750); text(ctx, vm.remainingLabel, inset, y + 35, compact ? 31 : 36, 800, '#141a22');
  text(ctx, vm.resourceLabel, inset, y + 77, 14);
  rounded(ctx, inset, y + 106, contentWidth, 12, 6, '#59687830');
  if (vm.totals.remainingPercent) rounded(ctx, inset, y + 106, contentWidth * vm.totals.remainingPercent / 100, 12, 6, '#c8ff00');
  [['Потрачено', vm.spentLabel], ['В резерве', vm.reservedLabel], ['Свободно', vm.availableLabel]].forEach(([label, value], index) => { const x = inset + index * contentWidth / 3; text(ctx, label, x, y + 131, 9); text(ctx, value, x, y + 146, 13, 650, '#27333e'); });
  if (resourceHeight > 171) {
    const warnings = [];
    if (vm.totals.overSpentHours) warnings.push(`Перерасход: ${hours(vm.totals.overSpentHours)} ч`);
    if (vm.totals.overReservedHours) warnings.push(`Резерв сверх остатка: ${hours(vm.totals.overReservedHours)} ч`);
    text(ctx, warnings.join(' · '), inset, y + 172, 9, 600, '#6d3c24');
  }
  y += resourceHeight + 24; text(ctx, 'ЗАДАЧИ · ГОТОВНОСТЬ РЕЗУЛЬТАТА', pad, y, 9, 750); y += 20;
  if (rows.length) {
    rounded(ctx, pad, y, innerWidth, rows.reduce((sum, row) => sum + row.height, 0), 13, '#e9eef12d', '#63717e30');
    rows.forEach((row, index) => {
      const { task } = row, x = pad + 46;
      if (index) { ctx.fillStyle = '#62707b23'; ctx.fillRect(pad + 12, y, innerWidth - 24, 1); }
      icon(ctx, task.tone.icon, pad + 13, y + 17, task.tone.ink);
      row.titleLines.forEach((line, lineIndex) => text(ctx, line, x, y + 15 + lineIndex * layout.titleLineHeight, layout.titleFontSize, 700, task.state.key === 'blocked' ? '#46535e' : '#18212a'));
      const chipY = y + 18 + row.titleLines.length * layout.titleLineHeight;
      ctx.font = `650 10px ${FONT}`; const chipWidth = Math.min(innerWidth - 61, ctx.measureText(task.state.label).width + 18);
      rounded(ctx, x, chipY, chipWidth, 21, 6, task.tone.chip); text(ctx, task.state.label, x + 9, chipY + 5, 10, 650, task.tone.ink);
      row.reasonLines.forEach((line, lineIndex) => text(ctx, line, x, chipY + 29 + lineIndex * 16, 11)); y += row.height;
    });
  } else { text(ctx, 'Пока нет задач', pad + 12, y + 12, 13); y += layout.emptyHeight; }
  if (vm.hiddenTaskCount) { text(ctx, `Ещё ${vm.hiddenTaskCount} задач · итог учитывает все ${vm.allTasks.length}`, pad + 2, y + 12, 11, 600); y += layout.hiddenHeight; }
  y += 19; ctx.fillStyle = '#62707b3a'; ctx.fillRect(pad, y, innerWidth, 1); y += 17;
  const totalFont = compact ? 29 : 33; ctx.font = `800 ${totalFont}px ${FONT}`; const priceWidth = ctx.measureText(vm.totalPriceLabel).width;
  text(ctx, 'Согласованная сумма', pad, y + 8, compact ? 11 : 12); text(ctx, vm.totalPriceLabel, width - pad - priceWidth, y, totalFont, 800, '#141a22');
  text(ctx, 'Согласовано ≠ оплачено · цены условные', pad, y + 42, 10); ctx.fillStyle = '#f2f5f56a'; ctx.fillRect(pad, y + 63, innerWidth, 1);
  text(ctx, `Обновлено · ${vm.updatedLabel}`, pad, y + 75, 10);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Браузер не смог создать PNG.')), 'image/png'));
}
export function download(blob, filename) {
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}
