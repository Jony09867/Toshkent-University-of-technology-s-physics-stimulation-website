import { uz, resultNames } from "../i18n/uz.js";
const colors = ["#F1592A", "#3883d9", "#b18b4d", "#53697a"];
export class LiveChart {
  constructor(container, config, p) {
    this.config = config;
    this.charts = [];
    this.last = -1;
    this.destroyed = false;
    if (!container) return;
    this.static = [
      "coulomb",
      "lens",
      "ohm",
      "circuit",
      "gas",
      "resonance",
    ].includes(config.key);
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
        series.map((s) => resultNames[s[0]] || s[0]).join(", "),
      );
      wrap.append(canvas);
      container.append(wrap);
      let ch;
      try {
        ch = new Chart(canvas, {
        type: "line",
        data: {
          datasets: series.map(([key, unit, scale = 1], i) => ({
            label: `${resultNames[key] || key} (${unit})`,
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
          plugins: {
            legend: {
              display: series.length > 1,
              labels: { boxWidth: 12, usePointStyle: true },
            },
            tooltip: { mode: "nearest", intersect: false },
          },
          scales: {
            x: {
              type: "linear",
              title: { display: true, text: uz.unitTime },
              grid: { color: "#eef1f4" },
              ticks: { maxTicksLimit: 6 },
            },
            y: {
              title: {
                display: true,
                text:
                  series.length > 1
                    ? series[0][1]
                    : `${resultNames[series[0][0]] || series[0][0]} (${series[0][1]})`,
              },
              grid: { color: "#eef1f4" },
              ticks: { maxTicksLimit: 5 },
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
      this.updateChart(chart);
    } catch (error) {
      console.warn("Graph update failed:", error);
    }
  }
  curve(p) {
    if (this.destroyed) return;
    const key = this.config.key;
    let param, min, max, label;
    if (key === "coulomb") {
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
      chart.data.datasets = chart.data.datasets.filter(
        (ds) => !ds.currentMarker && !ds.focusGuide,
      );
      for (const ds of chart.data.datasets) {
        ds.data = Array.from({ length: 181 }, (_, i) => {
          const x = min + ((max - min) * i) / 180,
            q = { ...p, [param]: x },
            r = this.safeCalculate(q);
          if (!r) return { x, y: null };
          let y = (key === "resonance" ? r.amplitude : r[ds.key]) * ds.scale;
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
      const ds = chart.data.datasets[0],
        r = this.safeCalculate(p),
        value = r ? (key === "resonance" ? r.amplitude : r[ds.key]) * ds.scale : NaN;
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
  add(t, state, force = false) {
    if (this.static || this.destroyed || !state) return;
    if (!force && t - this.last < 0.09) return;
    this.last = t;
    for (const ch of this.charts) {
      for (const ds of ch.data.datasets) {
        const raw = state[ds.key],
          y = typeof raw === "number" ? raw * ds.scale : NaN;
        ds.data.push({ x: t, y: Number.isFinite(y) ? y : null });
        if (ds.data.length > 1200) ds.data.shift();
      }
      this.updateChart(ch);
    }
  }
  reset(p) {
    if (this.destroyed) return;
    this.last = -1;
    if (this.static) {
      this.curve(p);
      return;
    }
    for (const ch of this.charts) {
      for (const ds of ch.data.datasets) ds.data = [];
      this.updateChart(ch);
    }
  }
  destroy() {
    this.destroyed = true;
    this.charts.forEach((ch) => ch.destroy());
    this.charts = [];
  }
}
