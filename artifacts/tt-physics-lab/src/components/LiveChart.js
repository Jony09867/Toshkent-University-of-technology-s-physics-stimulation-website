import { uz, resultNames } from "../i18n/uz.js";
import { carnotCycle } from "../physics/carnot-cycle.js";
const colors = ["#F1592A", "#3883d9", "#b18b4d", "#53697a"];

// Chart.js draws into a canvas, so the axis and grid colors are read from the
// same CSS custom properties the rest of the theme uses.
const readToken = (name, fallback) => {
  if (typeof getComputedStyle !== "function") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
};
const grid = () => readToken("--chart-grid", "#1b2733");
const line = () => readToken("--chart-line", "#2a3642");
const muted = () => readToken("--canvas-muted", "#8b9aa8");
const surface = () => readToken("--chart-surface", "#111820");

const phaseMap = {
  spring: { x: "x", y: "v", xLabel: "x (Siljish, m)", yLabel: "v (Tezlik, m/s)" },
  pendulum: { x: "theta", y: "velocity", xLabel: "θ (Burchak, rad)", yLabel: "v (Tezlik, m/s)" },
  circular: { x: "x", y: "y", xLabel: "x (Koordinata, m)", yLabel: "y (Koordinata, m)" },
  lcr: { x: "charge", y: "current", xLabel: "q (Zaryad, C)", yLabel: "I (Tok, A)" },
  isoProcess: { x: "volume", y: "pressureKpa", xLabel: "V (Hajm, L)", yLabel: "p (Bosim, kPa)" },
  motion: { x: "x", y: "v", xLabel: "x (Koordinata, m)", yLabel: "v (Tezlik, m/s)" },
  fall: { x: "y", y: "vy", xLabel: "y (Balandlik, m)", yLabel: "vy (Tezlik, m/s)" },
  projectile: { x: "x", y: "vx", xLabel: "x (Masofa, m)", yLabel: "vx (Tezlik, m/s)" },
  energy: { x: "q", y: "v", xLabel: "q (Traektoriya, m)", yLabel: "v (Tezlik, m/s)" },
  gas: { x: "volume", y: "pressure", xLabel: "V (Hajm, L)", yLabel: "P (Bosim, kPa)" },
};

export class LiveChart {
  constructor(container, config, p, onInspect = null) {
    this.config = config;
    this.charts = [];
    this.last = -1;
    this.destroyed = false;
    this.onInspect = onInspect;
    if (!container) return;
    const phaseCfg = phaseMap[config.key];
    this.phaseCfg = phaseCfg;
    this.phaseMode = false;
    this.savedDatasets = null;

    if (phaseCfg && !config.static) {
      const modeBar = document.createElement("div");
      modeBar.className = "chart-mode-bar";
      modeBar.innerHTML = `
        <button type="button" class="chart-mode-btn active" data-cm="time">📈 Vaqt grafigi</button>
        <button type="button" class="chart-mode-btn" data-cm="phase">🔄 Faza fazosi (${phaseCfg.xLabel.split(" ")[0]} - ${phaseCfg.yLabel.split(" ")[0]})</button>
      `;
      container.prepend(modeBar);

      modeBar.querySelectorAll(".chart-mode-btn").forEach((btn) => {
        btn.onclick = () => {
          const isPhase = btn.dataset.cm === "phase";
          this.setPhaseMode(isPhase);
          modeBar.querySelectorAll(".chart-mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
        };
      });
    }
    this.static =
      config.static ||
      ["coulomb", "lens", "ohm", "circuit", "gas", "resonance"].includes(
        config.key,
      );
    if (!globalThis.Chart) {
      container.textContent = uz.chartUnavailable;
      return;
    }
    const grouped =
      config.key === "energy" || config.key === "buoyancy"
        ? [config.series]
        : config.series.map((s) => [s]);
    for (const series of grouped) {
      const wrap = document.createElement("div");
      wrap.className = "chart-wrap";
      const canvas = document.createElement("canvas");
      canvas.setAttribute("role", "img");
      canvas.setAttribute(
        "aria-label",
        series.map((s) => this.label(s[0])).join(", "),
      );
      wrap.append(canvas);
      const inspector = document.createElement("output");
      inspector.className = "chart-inspector";
      inspector.setAttribute("aria-live", "off");
      inspector.textContent = "Grafikdagi nuqtaga boring: aniq qiymat ko‘rinadi.";
      wrap.append(inspector);
      container.append(wrap);
      canvas.addEventListener("mouseleave", () => {
        if (ch) { ch.$inspectorPoint = null; ch.draw(); }
      });
      const axisMuted = muted();
      const gridColor = grid();
      const lineColor = line();
      let ch;
      try {
        ch = new Chart(canvas, {
          type: "line",
          plugins: [{
            id: "labCrosshair",
            afterDatasetsDraw(chart) {
              const point = chart.$inspectorPoint;
              if (!point) return;
              const { ctx, chartArea } = chart;
              ctx.save();
              ctx.setLineDash([4, 4]);
              ctx.strokeStyle = "rgba(241, 89, 42, 0.7)";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(point.x, chartArea.top);
              ctx.lineTo(point.x, chartArea.bottom);
              ctx.moveTo(chartArea.left, point.y);
              ctx.lineTo(chartArea.right, point.y);
              ctx.stroke();
              ctx.restore();
            },
          }],
          data: {
            datasets: series.map(([key, unit, scale = 1], i) => ({
              label: `${this.label(key)} (${unit})`,
              data: [],
              borderColor: colors[i],
              backgroundColor: colors[i] + "13",
              borderWidth: 2,
              borderDash: key === "initial" ? [5, 5] : [],
              pointRadius: 0,
              fill: series.length === 1,
              tension: 0.15,
              spanGaps: false,
              key,
              unit,
              scale,
            })),
          },
          options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            parsing: false,
            normalized: true,
            onHover: (_event, points, chart) => this.inspect(chart, points, inspector),
            onClick: (_event, points, chart) => {
              this.inspect(chart, points, inspector);
              if (this.phaseMode || this.static || !points?.length || !this.onInspect) return;
              const point = chart.data.datasets[points[0].datasetIndex]?.data?.[points[0].index];
              if (Number.isFinite(point?.x)) this.onInspect(point.x);
            },
            plugins: {
              legend: {
                display: series.length > 1,
                labels: {
                  boxWidth: 12,
                  usePointStyle: true,
                  color: axisMuted,
                  filter: (item, data) =>
                    !data.datasets[item.datasetIndex]?.currentMarker,
                },
              },
              tooltip: {
                mode: "nearest",
                intersect: false,
                backgroundColor: surface(),
                titleColor: axisMuted,
                bodyColor: axisMuted,
                borderColor: lineColor,
                borderWidth: 1,
              },
            },
            scales: {
              x: {
                type: "linear",
                title: { display: true, text: uz.unitTime, color: axisMuted },
                grid: { color: gridColor },
                ticks: { maxTicksLimit: 6, color: axisMuted },
                border: { color: lineColor },
              },
              y: {
                title: {
                  display: true,
                  text:
                    series.length > 1
                      ? series[0][1]
                      : `${this.label(series[0][0])} (${series[0][1]})`,
                  color: axisMuted,
                },
                grid: { color: gridColor },
                ticks: { maxTicksLimit: 5, color: axisMuted },
                border: { color: lineColor },
              },
            },
          },
        });
      } catch (error) {
        console.warn("Chart could not be created:", error);
        wrap.textContent = uz.chartUnavailable;
        continue;
      }
      this.charts.push(ch);
    }
    if (this.static) this.curve(p);
    if (config.key === "heatEngine") this.initCarnot(container, p);
  }
  initCarnot(container, p) {
    const wrap = document.createElement("div");
    wrap.className = "chart-wrap carnot-chart";
    wrap.innerHTML = '<strong>Ideal Karno sikli · p–V</strong><div class="carnot-plot"><canvas role="img" aria-label="Ideal Karno sikli: bosim va hajm grafigi"></canvas></div><p class="carnot-note">Bir atomli ideal gaz (γ = 5/3), V₁ = 1 L, V₂ = 2 L. Grafik ideal yuqori chegarani ko‘rsatadi.</p>';
    container.append(wrap);
    this.carnotNote = wrap.querySelector(".carnot-note");
    this.carnotChart = new Chart(wrap.querySelector("canvas"), {
      type: "line",
      data: { datasets: [] },
      options: {
        animation: false, parsing: false, responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: muted(), boxWidth: 9, font: { size: 10 } } }, tooltip: { mode: "nearest", intersect: false } },
        scales: {
          x: { type: "linear", title: { display: true, text: "V (L)", color: muted() }, ticks: { color: muted() }, grid: { color: grid() } },
          y: { title: { display: true, text: "p (kPa)", color: muted() }, ticks: { color: muted() }, grid: { color: grid() } },
        },
      },
    });
    this.updateCarnot(p);
  }
  updateCarnot(p) {
    if (!this.carnotChart) return;
    const cycle = carnotCycle(p);
    this.carnotChart.data.datasets = cycle ? cycle.stages.map((stage, index) => ({
      label: stage.label,
      data: stage.data,
      borderColor: ["#f1592a", "#a967e8", "#3883d9", "#19a378"][index],
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
    })) : [];
    this.carnotNote.textContent = cycle
      ? `Bir atomli ideal gaz (γ = 5/3). Q₁ = ${Number(p.heatIn).toFixed(0)} J, Q₂ = ${cycle.heatOut.toFixed(1)} J, ideal ish = ${cycle.work.toFixed(1)} J.`
      : "Karno sikli uchun T_issiq > T_sovuq > 0 bo‘lishi kerak.";
    this.updateChart(this.carnotChart);
  }
  label(key) {
    return (
      this.config.results.find((r) => r.key === key)?.label ||
      resultNames[key] ||
      key
    );
  }
  inspect(chart, points, output) {
    const selected = points?.find((point) => {
      const dataset = chart.data.datasets[point.datasetIndex];
      return dataset && !dataset.snapshot && !dataset.focusGuide;
    });
    if (!selected) {
      if (chart.$inspectorPoint) { chart.$inspectorPoint = null; chart.draw(); }
      return;
    }
    const dataset = chart.data.datasets[selected.datasetIndex];
    const point = dataset.data[selected.index];
    if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return;
    const pixel = chart.getDatasetMeta(selected.datasetIndex)?.data?.[selected.index];
    if (pixel && Number.isFinite(pixel.x) && Number.isFinite(pixel.y)) {
      chart.$inspectorPoint = { x: pixel.x, y: pixel.y };
      chart.draw();
    }
    const axis = this.phaseMode ? this.phaseCfg?.xLabel : chart.options.scales.x.title.text;
    output.textContent = `${axis}: ${Number(point.x.toPrecision(6))} · ${dataset.label}: ${Number(point.y.toPrecision(6))}`;
  }
  safeCalculate(p) {
    try {
      return this.config.calculate(p, 0);
    } catch (error) {
      console.warn("Graph calculation failed:", error);
      return null;
    }
  }
  updateChart(chart) {
    try {
      chart?.update("none");
    } catch (error) {
      console.warn("Graph update failed:", error);
    }
  }
  setCursor(chart, t, state) {
    chart.data.datasets = chart.data.datasets.filter((ds) => !ds.currentMarker);
    const sources = chart.data.datasets.filter(
      (ds) => !ds.focusGuide && !ds.snapshot && ds.key,
    );
    for (const [index, source] of sources.entries()) {
      const raw = state[source.key],
        y = typeof raw === "number" ? raw * source.scale : NaN;
      chart.data.datasets.push({
        label: uz.currentValue,
        currentMarker: true,
        data: Number.isFinite(y) ? [{ x: t, y }] : [],
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: source.borderColor || colors[index],
        pointBorderColor: "#fff",
        pointBorderWidth: 1.5,
        showLine: false,
        fill: false,
      });
    }
  }
  curve(p) {
    if (this.destroyed) return;
    const key = this.config.key;
    let param, min, max, label;
    if (this.config.sweep) {
      const definition = this.config.params.find(
        (p) => p.key === this.config.sweep,
      );
      param = definition.key;
      min = definition.min;
      max = definition.max;
      label = `${definition.label} (${definition.unit})`;
    } else if (key === "coulomb") {
      param = "r";
      min = 0.1;
      max = 3;
      label = "r (m)";
    } else if (key === "lens") {
      param = "object";
      min = 0.1;
      max = 3;
      label = "d (m)";
    } else if (key === "ohm") {
      param = "voltage";
      min = 0;
      max = 24;
      label = "U (V)";
    } else if (key === "circuit") {
      param = "resistance";
      min = 1;
      max = 100;
      label = "R (Ω)";
    } else if (key === "gas") {
      param = "volume";
      min = 5;
      max = 50;
      label = "V (L)";
    } else {
      param = "frequency";
      min = 0.1;
      max = 3;
      label = "ω (rad/s)";
    }
    const definition = this.config.params?.find((item) => item.key === param);
    if (definition) {
      min = definition.min;
      max = definition.max;
    }
    for (const chart of this.charts) {
      chart.options.scales.x.title.text = label;
      const snapshots = chart.data.datasets.filter((ds) => ds.snapshot),
        sources = chart.data.datasets.filter(
          (ds) => !ds.currentMarker && !ds.focusGuide && !ds.snapshot,
        );
      chart.data.datasets = [...sources, ...snapshots];
      for (const ds of sources) {
        ds.data = Array.from({ length: 181 }, (_, i) => {
          const x = min + ((max - min) * i) / 180,
            q = { ...p, [param]: x },
            r = this.safeCalculate(q);
          if (!r) return { x, y: null };
          const raw = key === "resonance" ? r.amplitude : r[ds.key];
          let y = typeof raw === "number" ? raw * ds.scale : null;
          if (
            key === "lens" &&
            (Math.abs(x - p.focal) < 0.025 || Math.abs(y) > 20)
          )
            y = null;
          return { x, y: Number.isFinite(y) ? y : null };
        });
        if (key === "resonance") {
          ds.label = resultNames.amplitude + " (m)";
          ds.key = "amplitude";
          chart.options.scales.y.title.text = ds.label;
        }
      }
      if (key === "lens") {
        chart.data.datasets.push({
          label: "Fokus",
          focusGuide: true,
          data: [
            { x: p.focal, y: -20 },
            { x: p.focal, y: 20 },
          ],
          borderColor: "#e05757",
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        });
      }
      const ds = sources[0],
        r = this.safeCalculate(p),
        raw = r ? (key === "resonance" ? r.amplitude : r[ds.key]) : null,
        value = typeof raw === "number" ? raw * ds.scale : NaN;
      chart.data.datasets.push({
        label: uz.currentValue,
        currentMarker: true,
        data: Number.isFinite(value) ? [{ x: p[param], y: value }] : [],
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "#F1592A",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        showLine: false,
        fill: false,
      });
      this.updateChart(chart);
    }
  }
  setPhaseMode(active) {
    if (!this.phaseCfg || this.charts.length === 0) return;
    this.phaseMode = active;
    const ch = this.charts[0];

    if (active) {
      if (!this.savedDatasets) {
        this.savedDatasets = ch.data.datasets.map(ds => ({ ...ds, data: [...ds.data] }));
        this.savedXTitle = ch.options.scales.x.title.text;
        this.savedYTitle = ch.options.scales.y.title.text;
      }
      ch.options.scales.x.title.text = this.phaseCfg.xLabel;
      ch.options.scales.y.title.text = this.phaseCfg.yLabel;
      ch.data.datasets = [
        {
          label: `Fazoviy portret (${this.phaseCfg.xLabel.split(" ")[0]} - ${this.phaseCfg.yLabel.split(" ")[0]})`,
          data: [],
          borderColor: "#F1592A",
          backgroundColor: "rgba(241, 89, 42, 0.08)",
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
          tension: 0.15,
          isPhase: true,
        },
      ];
    } else {
      if (this.savedDatasets) {
        ch.data.datasets = this.savedDatasets;
        ch.options.scales.x.title.text = this.savedXTitle;
        ch.options.scales.y.title.text = this.savedYTitle;
        this.savedDatasets = null;
      }
    }
    this.updateChart(ch);
  }
  add(t, state, force = false) {
    if (this.static || this.destroyed || !state) return;
    const sampleInterval = Math.min(0.09, this.config.duration / 240);
    if (!force && t - this.last < sampleInterval) return;
    this.last = t;

    if (this.phaseMode && this.phaseCfg && this.charts[0]) {
      const ch = this.charts[0];
      const rawX = state[this.phaseCfg.x];
      const rawY = state[this.phaseCfg.y];
      const px = typeof rawX === "number" ? rawX : NaN;
      const py = typeof rawY === "number" ? rawY : NaN;
      if (Number.isFinite(px) && Number.isFinite(py)) {
        const ds = ch.data.datasets.find((d) => d.isPhase);
        if (ds) {
          ds.data.push({ x: px, y: py });
          if (ds.data.length > 900) ds.data.shift();
        }
        ch.data.datasets = ch.data.datasets.filter((d) => !d.currentMarker);
        ch.data.datasets.push({
          label: uz.currentValue,
          currentMarker: true,
          data: [{ x: px, y: py }],
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "#F1592A",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          showLine: false,
          fill: false,
        });
        this.updateChart(ch);
      }
      return;
    }
    for (const ch of this.charts) {
      const snapshots = ch.data.datasets.filter((ds) => ds.snapshot);
      const sources = ch.data.datasets.filter(
        (ds) => !ds.currentMarker && !ds.snapshot,
      );
      ch.data.datasets = [...sources, ...snapshots];
      for (const ds of sources) {
        const raw = state[ds.key],
          y = typeof raw === "number" ? raw * ds.scale : NaN;
        ds.data.push({ x: t, y: Number.isFinite(y) ? y : null });
        if (ds.data.length > 1200) ds.data.shift();
      }
      this.setCursor(ch, t, state);
      this.updateChart(ch);
    }
  }
  seek(t, state) {
    if (this.static || this.destroyed || !state) return;
    this.last = t;
    for (const ch of this.charts) {
      const snapshots = ch.data.datasets.filter((ds) => ds.snapshot);
      const sources = ch.data.datasets.filter(
        (ds) => !ds.currentMarker && !ds.snapshot,
      );
      ch.data.datasets = [...sources, ...snapshots];
      for (const ds of sources)
        ds.data = ds.data.filter((point) => point.x <= t + this.config.duration * 1e-9);
      this.setCursor(ch, t, state);
      this.updateChart(ch);
    }
  }
  reset(p) {
    if (this.destroyed) return;
    this.last = -1;
    if (this.phaseMode && this.charts[0]) {
      const ds = this.charts[0].data.datasets.find((d) => d.isPhase);
      if (ds) ds.data = [];
      this.charts[0].data.datasets = this.charts[0].data.datasets.filter((d) => !d.currentMarker);
      this.updateChart(this.charts[0]);
      return;
    }
    if (this.static) {
      this.curve(p);
      this.updateCarnot(p);
      return;
    }
    for (const ch of this.charts) {
      const snapshots = ch.data.datasets.filter((ds) => ds.snapshot),
        live = ch.data.datasets.filter(
          (ds) => !ds.currentMarker && !ds.snapshot,
        );
      ch.data.datasets = [...live, ...snapshots];
      for (const ds of live) ds.data = [];
      this.updateChart(ch);
    }
  }
  saveSnapshot(label) {
    if (this.destroyed) return;
    for (const chart of this.charts) {
      const live = chart.data.datasets.filter(
        (ds) => !ds.currentMarker && !ds.focusGuide && !ds.snapshot,
      );
      for (const [index, source] of live.entries()) {
        chart.data.datasets.push({
          ...source,
          label: `${label} · ${source.label}`,
          data: source.data.map((point) => ({ ...point })),
          snapshot: true,
          fill: false,
          borderWidth: 1.5,
          borderDash: [6, 5],
          borderColor: colors[(index + 1) % colors.length] + "b8",
          pointRadius: 0,
        });
      }
      const snapshots = chart.data.datasets.filter((ds) => ds.snapshot);
      if (snapshots.length > 12) {
        const remove = snapshots.slice(0, snapshots.length - 12);
        chart.data.datasets = chart.data.datasets.filter(
          (ds) => !remove.includes(ds),
        );
      }
      this.updateChart(chart);
    }
  }
  clearSnapshots() {
    if (this.destroyed) return;
    for (const chart of this.charts) {
      chart.data.datasets = chart.data.datasets.filter((ds) => !ds.snapshot);
      this.updateChart(chart);
    }
  }
  destroy() {
    this.destroyed = true;
    this.charts.forEach((ch) => ch.destroy());
    this.carnotChart?.destroy();
    this.charts = [];
  }
}
