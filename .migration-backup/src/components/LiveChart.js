import { uz, resultNames } from "../i18n/uz.js";
const colors = ["#F1592A", "#3883d9", "#b18b4d", "#53697a"];
export class LiveChart {
  constructor(container, config, p) {
    this.config = config;
    this.charts = [];
    this.last = -1;
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
      const ch = new Chart(canvas, {
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
            tooltip: { mode: "index", intersect: false },
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
      this.charts.push(ch);
    }
    if (this.static) this.curve(p);
  }
  curve(p) {
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
    for (const chart of this.charts) {
      chart.options.scales.x.title.text = label;
      chart.data.datasets = chart.data.datasets.filter(
        (ds) => !ds.currentMarker,
      );
      for (const ds of chart.data.datasets) {
        ds.data = Array.from({ length: 181 }, (_, i) => {
          const x = min + ((max - min) * i) / 180,
            q = { ...p, [param]: x },
            r = this.config.calculate(q, 0);
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
      const ds = chart.data.datasets[0],
        r = this.config.calculate(p, 0),
        value = (key === "resonance" ? r.amplitude : r[ds.key]) * ds.scale;
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
      chart.update("none");
    }
  }
  add(t, state, force = false) {
    if (this.static) return;
    if (!force && t - this.last < 0.09) return;
    this.last = t;
    for (const ch of this.charts) {
      for (const ds of ch.data.datasets) {
        const y = state[ds.key] * ds.scale;
        ds.data.push({ x: t, y: Number.isFinite(y) ? y : null });
        if (ds.data.length > 220) ds.data.shift();
      }
      ch.update("none");
    }
  }
  reset(p) {
    this.last = -1;
    if (this.static) {
      this.curve(p);
      return;
    }
    for (const ch of this.charts) {
      for (const ds of ch.data.datasets) ds.data = [];
      ch.update("none");
    }
  }
  destroy() {
    this.charts.forEach((ch) => ch.destroy());
  }
}
