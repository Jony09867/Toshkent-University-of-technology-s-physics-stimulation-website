import { resultNames } from "../i18n/uz.js";

/** Shown when an engine result is missing or cannot be expressed as a number. */
export const NO_VALUE = "—";

/** Numeric coercion that treats null/undefined/""/garbage as "no value". */
const toNumber = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return Number.NaN;
};

/**
 * Formats a result value for display. Non numeric input becomes a dash instead
 * of a misleading "0" or "∞".
 */
export const format = (n) => {
  const value = toNumber(n);
  if (Number.isNaN(value)) return NO_VALUE;
  if (value === 0) return "0";
  if (!Number.isFinite(value)) return value < 0 ? "−∞" : "∞";
  const abs = Math.abs(value);
  return abs >= 1e5 || abs < 0.001
    ? value.toExponential(2)
    : value.toLocaleString("en-US", { maximumFractionDigits: 3 });
};

/** Applies a result definition unit scale, then formats the value. */
export const formatResult = (r, value) => {
  const numeric = toNumber(value);
  if (Number.isNaN(numeric)) return NO_VALUE;
  const scale = toNumber(r?.scale);
  return format(Number.isNaN(scale) ? numeric : numeric * scale);
};

export const resultCard = (r, value) => {
  const key = typeof r?.key === "string" ? r.key : "";
  const label = resultNames[key] || key;
  const unit = typeof r?.unit === "string" ? r.unit : "";
  const formatted = formatResult(r, value);
  return `<div class="result-card"><span>${label}</span><div><strong data-result="${key}">${formatted}</strong>${unit ? ` <small data-result-unit="${key}"${formatted === NO_VALUE ? " hidden" : ""}>${unit}</small>` : ""}</div></div>`;
};
