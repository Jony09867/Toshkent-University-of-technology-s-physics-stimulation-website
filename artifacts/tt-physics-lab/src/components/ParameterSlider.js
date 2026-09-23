import { uz } from "../i18n/uz.js";
export function parameterSlider(p, value) {
  return `<div class="parameter"><div class="parameter-top"><label for="p-${p.key}">${p.label}</label><span class="value-wrap"><input id="n-${p.key}" type="number" aria-label="${p.label}: ${uz.numberValue}" min="${p.min}" max="${p.max}" step="${p.step}" value="${value}" data-number="${p.key}"><span>${p.unit}</span></span></div><input id="p-${p.key}" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${value}" data-param="${p.key}" style="--fill:${((value - p.min) / (p.max - p.min)) * 100}%"><div class="range-labels"><span>${p.min} ${p.unit}</span><span>${p.max} ${p.unit}</span></div></div>`;
}
