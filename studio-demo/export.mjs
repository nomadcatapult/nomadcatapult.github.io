import { buildCardViewModel, hours, cardSurfaceImage } from './presentation.mjs';
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
  const resourceWidth=innerWidth-34,m=vm.measure;
  ctx.font=`400 14px ${FONT}`;const captionLines=wrapText(ctx,m.caption,resourceWidth,3);
  const barY=79+captionLines.length*17+12,statsY=barY+26,columnWidth=resourceWidth/m.stats.length;
  ctx.font=`400 9px ${FONT}`;const stats=m.stats.map(([label,value])=>({labelLines:wrapText(ctx,label,columnWidth-8,3),value}));const labelHeight=Math.max(...stats.map(s=>s.labelLines.length))*12,valueY=statsY+labelHeight+4;
  let textY=valueY+29;const unallocatedY=m.kind==='hours'?textY:null;if(unallocatedY!==null)textY+=25;
  ctx.font=`400 9px ${FONT}`;const explanationLines=wrapText(ctx,m.explanation,resourceWidth,5),explanationY=textY;textY+=explanationLines.length*12;
  const warningLines=m.warnings.flatMap(w=>wrapText(ctx,w,resourceWidth,3)),warningY=textY+7;if(warningLines.length)textY+=7+warningLines.length*12;
  const resourceHeight=textY+16,resourceLayout={captionLines,barY,statsY,stats,valueY,columnWidth,unallocatedY,explanationLines,explanationY,warningLines,warningY};
  const titleFontSize = 15, titleLineHeight = 21, rowTextWidth = innerWidth - 64;
  const rows = vm.tasks.map(task => {
    ctx.font = `700 ${titleFontSize}px ${FONT}`; const titleLines = wrapText(ctx, task.title, rowTextWidth);
    ctx.font = `400 11px ${FONT}`; const reasonLines = task.shortReason ? wrapText(ctx, task.shortReason, rowTextWidth, 3) : [];
    return { task, titleLines, reasonLines, height: Math.max(76, 52 + titleLines.length * titleLineHeight + reasonLines.length * 16) };
  });
  const paymentRows=vm.payments.map(payment=>{ctx.font=`600 12px ${FONT}`;const titleLines=wrapText(ctx,payment.title,innerWidth-140);ctx.font=`400 10px ${FONT}`;const reasonLines=payment.state.reasons.length?wrapText(ctx,payment.state.reasons.join(' · '),innerWidth-30,2):[];return {payment,titleLines,reasonLines,height:48+titleLines.length*17+reasonLines.length*14};});
  const paymentsHeight=paymentRows.reduce((s,p)=>s+p.height,0)+66;
  const hiddenHeight = vm.hiddenTaskCount ? 30 : 0, emptyHeight = rows.length ? 0 : 45;
  const height = Math.ceil(pad * 2 + headerHeight + 18 + resourceHeight + 24 + 20 + rows.reduce((sum, row) => sum + row.height, 0) + hiddenHeight + emptyHeight + paymentsHeight + 19 + 108);
  return { vm, resourceLayout, paymentRows, paymentsHeight, width, height, pad, innerWidth, headerHeight, resourceHeight, rows, hiddenHeight, emptyHeight, titleFontSize, titleLineHeight };
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
  ctx.beginPath();ctx.roundRect(0,0,width,height,21);ctx.clip();
  // Fixed resting frame; matches the web surface before the slow compositor-only drift.
  ctx.drawImage(await cardSurfaceImage(),-width*.03,-height*.03,width*1.06,height*1.06);
  rounded(ctx, .5, .5, width - 1, height - 1, 21, null, '#73808c55');
  let y = pad;
  text(ctx, 'NomadCatapult', pad, y, compact ? 24 : 28, 800, '#141a22');
  rounded(ctx, width - pad - 49, y + 2, 49, 23, 12, '#edf0f15c'); text(ctx, 'ДЕМО', width - pad - 40, y + 9, 9, 700, '#38434e');
  ctx.font = `500 15px ${FONT}`;
  wrapText(ctx, vm.title, innerWidth - 56).forEach((line, index) => text(ctx, line, pad, y + 39 + index * 21, 15, 500));
  y += headerHeight + 18;
  rounded(ctx, pad, y, innerWidth, resourceHeight, 14, '#f1f3f340', '#63717e33');
  const inset = pad + 17, contentWidth = innerWidth - 34;
  const m=vm.measure,r=layout.resourceLayout;
  text(ctx,m.eyebrow,inset,y+16,9,750);text(ctx,m.headline,inset,y+35,compact?31:36,800,'#141a22');
  r.captionLines.forEach((line,i)=>text(ctx,line,inset,y+79+i*17,14));
  rounded(ctx,inset,y+r.barY,contentWidth,12,6,'#59687830');
  ctx.save();ctx.beginPath();ctx.roundRect(inset,y+r.barY,contentWidth,12,6);ctx.clip();
  const acceptedWidth=contentWidth*m.primaryPercent/100,reviewWidth=contentWidth*m.reviewPercent/100;
  if(acceptedWidth){ctx.fillStyle='#c8ff00';ctx.fillRect(inset,y+r.barY,acceptedWidth,12);}
  if(reviewWidth){ctx.save();ctx.beginPath();ctx.rect(inset+acceptedWidth,y+r.barY,reviewWidth,12);ctx.clip();ctx.fillStyle='#c4dad1';ctx.fillRect(inset+acceptedWidth,y+r.barY,reviewWidth,12);ctx.strokeStyle='#657c738c';ctx.lineWidth=2;for(let x=inset+acceptedWidth-12;x<inset+acceptedWidth+reviewWidth+12;x+=7){ctx.beginPath();ctx.moveTo(x,y+r.barY+12);ctx.lineTo(x+12,y+r.barY);ctx.stroke();}ctx.restore();}ctx.restore();
  r.stats.forEach((stat,i)=>{const x=inset+i*r.columnWidth;stat.labelLines.forEach((line,j)=>text(ctx,line,x,y+r.statsY+j*12,9));text(ctx,stat.value,x,y+r.valueY,13,650,'#27333e');});
  if(r.unallocatedY!==null){text(ctx,m.unallocatedLabel,inset,y+r.unallocatedY,10,600);ctx.font=`700 12px ${FONT}`;text(ctx,m.unallocatedValue,inset+contentWidth-ctx.measureText(m.unallocatedValue).width,y+r.unallocatedY-1,12,700);}
  r.explanationLines.forEach((line,i)=>text(ctx,line,inset,y+r.explanationY+i*12,9));r.warningLines.forEach((line,i)=>text(ctx,line,inset,y+r.warningY+i*12,9,600,'#6d3c24'));
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
  if (vm.hiddenTaskCount) { text(ctx, vm.hiddenTasksLabel, pad + 2, y + 12, 11, 600); y += layout.hiddenHeight; }
  y+=20;text(ctx,'АВАНСЫ · СОБЫТИЯ ОПЛАТЫ',pad,y,9,750);y+=22;
  for(const row of layout.paymentRows){const {payment}=row;rounded(ctx,pad,y,innerWidth,row.height-7,10,payment.state.key==='received'?'#dae7c64d':'#d2d8de70','#63717e33');
    row.titleLines.forEach((line,i)=>text(ctx,line,pad+12,y+10+i*17,12,650));ctx.font=`700 13px ${FONT}`;const amountWidth=ctx.measureText(payment.amountLabel).width;text(ctx,payment.amountLabel,width-pad-12-amountWidth,y+10,13,700);
    const statusY=y+15+row.titleLines.length*17;text(ctx,payment.state.label,pad+12,statusY,10,600);row.reasonLines.forEach((line,i)=>text(ctx,line,pad+12,statusY+17+i*14,10));y+=row.height;
  }
  text(ctx,'Получено · ручные отметки: '+vm.paidLabel,pad,y+4,11,600);y+=24;
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
