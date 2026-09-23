import { resultNames } from "../i18n/uz.js";
export const format = (n) =>
  n === 0
    ? "0"
    : !Number.isFinite(n)
      ? n < 0
        ? "−∞"
        : "∞"
      : Math.abs(n) >= 1e5 || (Math.abs(n) > 0 && Math.abs(n) < 0.001)
        ? n.toExponential(2)
        : n.toLocaleString("en-US", { maximumFractionDigits: 3 });
export const resultCard = (r, value) =>
  `<div class="result-card"><span>${resultNames[r.key] || r.key}</span><div><strong data-result="${r.key}">${format(value * r.scale)}</strong> <small>${r.unit}</small></div></div>`;
