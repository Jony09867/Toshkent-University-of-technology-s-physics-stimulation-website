import { format, formatResult } from "./ResultCard.js";
import { paramNames, resultNames } from "../i18n/uz.js";

/**
 * LabReportModal Component
 * Generates an official university physics laboratory report with student info,
 * theoretical basis, measurement tables, CSV export, and PDF print preview.
 */

export class LabReportModal {
  constructor(config, getCurrentState, getSnapshots) {
    this.config = config;
    this.getState = getCurrentState;
    this.getSnapshots = getSnapshots;
    this.modal = null;
  }

  open() {
    this.close();
    const sim = this.getState();
    const snapshots = this.getSnapshots?.() || [];
    const now = new Date().toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    this.modal = document.createElement("div");
    this.modal.className = "lab-report-backdrop";
    this.modal.innerHTML = `
      <div class="lab-report-modal" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <div class="report-actions-bar">
          <div class="report-action-buttons">
            <button type="button" class="button primary" id="report-print">
              🖨️ Chop etish / PDF
            </button>
            <button type="button" class="button secondary" id="report-csv">
              📥 CSV yuklab olish
            </button>
          </div>
          <button type="button" class="icon-button" id="report-close" aria-label="Yopish">✕</button>
        </div>

        <!-- Printable Document Area -->
        <div class="report-printable-sheet" id="report-printable">
          <header class="report-header">
            <div class="report-brand">
              <strong>TT PHYSICS LAB · MUHANDISLIK FAKULTETI</strong>
              <small>Umumiy fizika kafedrasi · Virtual laboratoriya ishi</small>
            </div>
            <div class="report-date">${now}</div>
          </header>

          <div class="report-title-section">
            <span class="report-label">LABORATORIYA ISHI</span>
            <h1 id="report-title">${this.config.title}</h1>
            <p class="report-desc">${this.config.description}</p>
          </div>

          <!-- Student Credentials Box -->
          <div class="report-student-grid">
            <div class="field">
              <label>Talaba F.I.Sh:</label>
              <input type="text" id="student-name" placeholder="Masalan: Aliyev Vali Olimovich" value="Muhammadyusuf Toirov">
            </div>
            <div class="field">
              <label>Guruh / Yo‘nalish:</label>
              <input type="text" id="student-group" placeholder="Masalan: 221-guruh, Mexatronika" value="Axborot xavfsizligi, 3-kurs">
            </div>
          </div>

          <!-- Theoretical Foundation -->
          <section class="report-section">
            <h2>1. Nazariy asoslar va hisoblash formulalari</h2>
            <div class="report-formula-box">
              <code>${this.config.formulaLatex}</code>
            </div>
            <p>${this.config.easy || this.config.medium || ""}</p>
          </section>

          <!-- Measurements & Data Table -->
          <section class="report-section">
            <h2>2. O‘tkazilgan o‘lchovlar va tajriba natijalari jadvali</h2>
            <div class="report-table-wrap">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Kirish parametrlari</th>
                    ${this.config.results.map((r) => `<th>${resultNames[r.key] || r.key} (${r.unit})</th>`).join("")}
                  </tr>
                </thead>
                <tbody id="report-table-body">
                  ${this.renderTableRows(sim, snapshots)}
                </tbody>
              </table>
            </div>
          </section>

          <!-- Student Conclusion -->
          <section class="report-section">
            <h2>3. Laboratoriya xulosasi va tahlil</h2>
            <textarea class="report-textarea" id="student-conclusion" rows="3" placeholder="Olingan natijalar asosida ilmiy xulosangizni yozing...">${this.generateDefaultConclusion(sim)}</textarea>
          </section>

          <footer class="report-footer">
            <div>
              <span>Talaba imzosi: ___________________</span>
            </div>
            <div>
              <span>O‘qituvchi tekshiruvi: ___________________ (Baho: _____)</span>
            </div>
          </footer>
        </div>
      </div>
    `;

    document.body.append(this.modal);
    this.bindEvents(sim, snapshots);
  }

  renderTableRows(currentSim, snapshots) {
    const rows = [];

    // First row: current measurement
    if (currentSim) {
      const pStr = Object.entries(currentSim.p)
        .map(([k, v]) => `${paramNames[k] || k}: ${format(v)}`)
        .slice(0, 3)
        .join("; ");
      const resCells = this.config.results
        .map((r) => `<td><b>${formatResult(r, currentSim.s[r.key])}</b></td>`)
        .join("");
      rows.push(`<tr><td>#1 (Hozirgi)</td><td>${pStr}</td>${resCells}</tr>`);
    }

    // Snapshot rows
    snapshots.forEach((snap, idx) => {
      const pStr = `${paramNames[snap.focusKey] || snap.focusKey}: ${format(snap.focusValue)}`;
      const resCells = this.config.results
        .map((r) => `<td>${formatResult(r, snap.results[r.key])}</td>`)
        .join("");
      rows.push(`<tr><td>#${idx + 2} (Saqlangan)</td><td>${pStr}</td>${resCells}</tr>`);
    });

    return rows.join("");
  }

  generateDefaultConclusion(sim) {
    if (!sim) return "O‘lchovlar fizik formulalar bilan to‘liq mos kelishi aniqlandi.";
    const firstRes = this.config.results[0];
    const val = formatResult(firstRes, sim.s[firstRes.key]);
    return `Tajriba davomida ${this.config.title.toLowerCase()} o‘rganildi. Olingan natijalar nazariy formulalarni to‘liq tasdiqladi. Bosh ko‘rsatkich ${resultNames[firstRes.key] || firstRes.key} = ${val} ${firstRes.unit} ga teng ekanligi qayd etildi.`;
  }

  bindEvents(sim, snapshots) {
    this.modal.querySelector("#report-close")?.addEventListener("click", () => this.close());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });

    this.modal.querySelector("#report-print")?.addEventListener("click", () => {
      window.print();
    });

    this.modal.querySelector("#report-csv")?.addEventListener("click", () => {
      this.exportCSV(sim, snapshots);
    });
  }

  exportCSV(sim, snapshots) {
    const headers = ["Olchov", "Parametrlar", ...this.config.results.map((r) => `${resultNames[r.key] || r.key} (${r.unit})`)];
    const rows = [headers.join(",")];

    if (sim) {
      const pStr = Object.entries(sim.p)
        .map(([k, v]) => `${k}=${v}`)
        .join(";");
      const resVals = this.config.results.map((r) => sim.s[r.key] ?? "");
      rows.push([`"Hozirgi"`, `"${pStr}"`, ...resVals].join(","));
    }

    snapshots.forEach((snap, idx) => {
      const pStr = `${snap.focusKey}=${snap.focusValue}`;
      const resVals = this.config.results.map((r) => snap.results[r.key] ?? "");
      rows.push([`"Saqlangan_${idx + 1}"`, `"${pStr}"`, ...resVals].join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laboratoriya_${this.config.key}_hisobot.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  close() {
    this.modal?.remove();
    this.modal = null;
  }
}
