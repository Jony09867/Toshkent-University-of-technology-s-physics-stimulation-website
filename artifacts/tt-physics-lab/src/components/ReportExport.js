/** Laboratoriya o‘lchovlari va grafiklarini eksport qilish. */
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const pretty = (value) => Number.isFinite(value) ? Number(value.toPrecision(8)) : "";

export function mountReportExport(container, config, getState) {
  if (!container) return { update() {}, destroy() {} };
  const samples = [];
  const el = document.createElement("div");
  el.className = "report-export-toolbar";
  el.innerHTML = '<button type="button" class="report-export-btn" data-report="sample">＋ O‘lchov</button><button type="button" class="report-export-btn" data-report="csv">📥 CSV hisobot</button><button type="button" class="report-export-btn" data-report="pdf">🖨️ PDF / chop etish</button><span class="report-sample-count" aria-live="polite">0 o‘lchov</span>';
  container.append(el);
  const count = el.querySelector(".report-sample-count");
  const capture = (force = false) => {
    const { state, p, t } = getState();
    if (!state) return;
    const previous = samples.at(-1);
    const signature = JSON.stringify((config.params || []).map((param) => p?.[param.key]));
    if (!force && previous && previous.signature === signature && Math.abs(previous.t - t) < Math.max(0.08, (config.duration || 1) / 250)) return;
    samples.push({ t: Number(t || 0), p: { ...p }, state: { ...state }, signature });
    if (samples.length > 1200) samples.shift();
    count.textContent = `${samples.length} o‘lchov`;
  };
  const rows = () => {
    if (!samples.length) capture(true);
    const headers = ["Vaqt (s)", ...(config.params || []).map((param) => `${param.label || param.key} (${param.unit || ""})`), ...(config.results || []).map((result) => `${result.label || result.key} (${result.unit || ""})`)];
    return [headers, ...samples.map((sample) => [pretty(sample.t), ...(config.params || []).map((param) => pretty(sample.p[param.key])), ...(config.results || []).map((result) => pretty(sample.state[result.key]))])];
  };
  el.querySelector('[data-report="sample"]').onclick = () => capture(true);
  el.querySelector('[data-report="csv"]').onclick = () => {
    const table = rows();
    const data = [
      ["Toshkent texnika universiteti — fizika laboratoriyasi"],
      ["Tajriba", config.topicTitle || config.title],
      ["Formula", config.formulaLatex || ""],
      ["Sana", new Date().toLocaleString("uz-UZ")],
      [],
      ...table,
    ].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", data], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${config.key || "fizika"}-laboratoriya-hisoboti.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  el.querySelector('[data-report="pdf"]').onclick = () => {
    const table = rows();
    const chartImages = [...document.querySelectorAll("#charts canvas")].map((canvas) => {
      try { return canvas.toDataURL("image/png"); } catch { return null; }
    }).filter(Boolean);
    const report = window.open("", "_blank");
    if (!report) return;
    const head = table[0].map((value) => `<th>${escapeHtml(value)}</th>`).join("");
    const body = table.slice(1).map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`).join("");
    report.document.write(`<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${escapeHtml(config.title)} — laboratoriya hisoboti</title><style>body{font:13px Arial,sans-serif;color:#17212b;margin:32px}h1{font-size:23px}p{line-height:1.5}table{border-collapse:collapse;width:100%;font-size:10px}th,td{border:1px solid #aab4bf;padding:5px;text-align:left}th{background:#edf1f4}img{display:block;max-width:100%;max-height:300px;margin:20px 0;page-break-inside:avoid}@page{size:A4 landscape;margin:14mm}</style></head><body><h1>${escapeHtml(config.topicTitle || config.title)}</h1><p><b>Tajriba:</b> ${escapeHtml(config.title)}<br><b>Formula:</b> ${escapeHtml(config.formulaLatex || "")}<br><b>Sana:</b> ${escapeHtml(new Date().toLocaleString("uz-UZ"))}</p>${chartImages.map((src) => `<img src="${src}" alt="Tajriba grafigi">`).join("")}<h2>O‘lchovlar (${samples.length})</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`);
    report.document.close();
    report.onload = () => report.print();
  };
  return { update() { capture(false); }, destroy() { el.remove(); } };
}
