import { paramNames, resultNames } from '../i18n/uz.js';
import { format, formatResult } from './ResultCard.js';
import { formula } from './FormulaDisplay.js';

const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label = item => item.label || paramNames[item.key] || resultNames[item.key] || item.key;

// Bir xil vaqtdagi ikki holat: faqat tanlangan parametr o‘zgaradi.
export function compareParameter(config, params, key, value, time) {
  const parameter = config.params.find(item => item.key === key);
  if (!parameter || !Number.isFinite(value) || value < parameter.min || value > parameter.max)
    throw new Error('Qiymat parametrning ruxsat etilgan oralig‘ida bo‘lishi kerak.');
  const referenceTime = config.static ? 0 : time;
  const before = config.calculate({ ...params }, referenceTime);
  const after = config.calculate({ ...params, [key]: value }, referenceTime);
  const rows = config.results.map(result => {
    const a = before[result.key], b = after[result.key];
    const valid = typeof a === 'number' && typeof b === 'number' && Number.isFinite(a) && Number.isFinite(b);
    const tolerance = Math.max(Number.MIN_VALUE, Math.abs(a), Math.abs(b)) * 1e-8;
    return { result, before: a, after: b, direction: !valid ? 'unavailable' : Math.abs(b-a) <= tolerance ? 'same' : b > a ? 'up' : 'down' };
  });
  return { rows, warnings: [...new Set([before.warning, after.warning].filter(Boolean))] };
}

export function coachMarkup(config, params) {
  return `<section class="experiment-coach" aria-labelledby="coach-heading"><div class="coach-intro"><span class="eyebrow orange">QADAMMA-QADAM TAJRIBA</span><h2 id="coach-heading">${safe(config.title)}: qanday o‘rganamiz?</h2><p>${safe(config.lesson || config.easy || config.model)}</p><ol><li><strong>Kuzating.</strong> ${config.static ? 'Bu muvozanat yoki bog‘lanish modeli: parametr o‘zgarsa natija darhol hisoblanadi.' : 'Boshlash tugmasini bosing. Qiziqarli holatda pauza qiling; sekinlashtirish yoki vaqt shkalasidan foydalaning.'}</li><li><strong>Taxmin qiling.</strong> Bitta parametrni tanlang. Uni o‘zgartirsangiz qaysi natija ortadi yoki kamayadi?</li><li><strong>Tekshiring.</strong> Quyida ikkinchi qiymatni kiriting. Boshqa parametrlar va vaqt bir xil qolgan ikki hisobni taqqoslang.</li></ol><details><summary>Formula va model chegaralari</summary><div class="coach-formula">${formula(config.formulaLatex)}</div><p>${safe(config.model)}</p></details></div><div class="coach-trial"><h3>Bitta parametrning ta’siri</h3><label>O‘zgartiriladigan parametr<select id="coach-param">${params.map(item => `<option value="${safe(item.key)}">${safe(label(item))}${item.unit ? ` (${safe(item.unit)})` : ''}</option>`).join('')}</select></label><label>Taqqoslash uchun qiymat<input id="coach-value" type="number" inputmode="decimal" required aria-describedby="coach-range"></label><p id="coach-range" class="coach-muted"></p><button type="button" class="button secondary" id="coach-compare">Hisoblab tushuntirish</button><div id="coach-output" aria-live="polite"><p class="coach-muted">Avval taxminingizni ayting, so‘ng natijani tekshiring. Bu hisob asosiy tajriba sozlamalarini o‘zgartirmaydi.</p></div></div></section>`;
}

export function mountExperimentCoach(root, config, getState) {
  const select = root.querySelector('#coach-param');
  const input = root.querySelector('#coach-value');
  const output = root.querySelector('#coach-output');
  const range = root.querySelector('#coach-range');
  const button = root.querySelector('#coach-compare');
  const setup = () => {
    const item = config.params.find(p => p.key === select.value);
    const current = getState().p[item.key];
    input.min = item.min; input.max = item.max; input.step = item.step || 'any';
    const candidate = current + (item.max - item.min) / 5;
    const step = Number(item.step) || 1;
    input.value = Number(Math.max(item.min, Math.min(item.max, item.min + Math.round(((candidate <= item.max ? candidate : current - (item.max-item.min)/5) - item.min)/step)*step)).toPrecision(12));
    range.textContent = `Oraliq: ${format(item.min)}–${format(item.max)} ${item.unit || ''}. Asosiy sozlama: ${format(current)} ${item.unit || ''}.`;
    output.replaceChildren();
  };
  select.onchange = setup;
  button.onclick = () => {
    if (!input.reportValidity()) return;
    const { p, t } = getState();
    const item = config.params.find(p => p.key === select.value);
    const value = input.valueAsNumber;
    try {
      const { rows, warnings } = compareParameter(config, p, item.key, value, t);
      const words = { up: 'Ortadi', down: 'Kamayadi', same: 'O‘zgarmaydi', unavailable: 'Bu holatda chekli son bilan ifodalanmaydi' };
      range.textContent = `Asosiy sozlama: ${format(p[item.key])} ${item.unit || ''}. Oraliq: ${format(item.min)}–${format(item.max)} ${item.unit || ''}.`;
      output.innerHTML = `<p><strong>${safe(label(item))}: ${safe(format(p[item.key]))} → ${safe(format(value))} ${safe(item.unit)}</strong></p><p class="coach-muted">${config.static ? 'Ikkala hisob bir xil shartlarda bajarildi.' : `Ikkala hisob uchun t = ${safe(format(t))} s. Vaqt o‘tishining ta’siri aralashtirilmagan.`} Quyidagi natija hisoblangan paytdagi holatga tegishli.</p><div class="coach-table-wrap" tabindex="0" role="region" aria-label="Ikki hisob natijalari"><table><thead><tr><th>Natija</th><th>Hozirgi</th><th>Yangi</th><th>Xulosa</th></tr></thead><tbody>${rows.map(row => `<tr><th scope="row">${safe(label(row.result))}${row.result.unit ? ` (${safe(row.result.unit)})` : ''}</th><td>${safe(formatResult(row.result, row.before))}</td><td>${safe(formatResult(row.result, row.after))}</td><td>${words[row.direction]}</td></tr>`).join('')}</tbody></table></div><p>${p[item.key] === value ? 'Qiymatlar teng. Farqni ko‘rish uchun boshqa qiymat kiriting.' : 'Natijani yuqoridagi formula bilan bog‘lang: o‘zgargan kattalik formulada qayerda qatnashadi? Bir nuqtadagi farq butun oraliqda bir xil qonuniyat borligini isbotlamaydi.'}</p>${!config.static && t === 0 ? '<p class="coach-muted">t = 0 da ayrim ta’sirlar hali ko‘rinmasligi mumkin. Tajribani ishga tushirib, keyin qayta taqqoslang.</p>' : ''}<p class="coach-muted">${safe(config.model)}</p>`;
      if (warnings.length) {
        const notice = document.createElement('p');
        notice.className = 'coach-warning';
        notice.textContent = 'Model chegarasi: ' + warnings.join(' ');
        output.prepend(notice);
      }
    } catch {
      output.textContent = 'Bu qiymatlarda hisobni bajarib bo‘lmadi. Parametr oralig‘i va model shartlarini tekshiring.';
    }
  };
  setup();
  return { destroy() { select.onchange = null; button.onclick = null; } };
}
