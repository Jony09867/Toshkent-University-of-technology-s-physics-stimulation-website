const SPATIAL = new Set(["m", "cm", "mm", "km"]);
const ELECTRIC = new Set(["A", "mA", "μA", "V", "mV", "kV", "Ω", "W", "C", "μC", "nC"]);
const FORCE = new Set(["N", "mN", "μN", "pN"]);
const ICONS = {
  "Chizg‘ich": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 7v4m4-4v3m4-3v4m4-4v3"/></svg>',
  "Sekundomer": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 13l3-3M9 2h6m-3 0v3"/></svg>',
  "Multimetr": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M7 7h10v5H7zm1 10h2m4 0h2"/></svg>',
  "Dinamometr": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3m0 12v3M7 6h10v12H7zM9 11l3-3 3 3m-3-3v6"/></svg>',
};
const number = (value) => Number.isFinite(value)
  ? Number(value.toPrecision(5)).toLocaleString("uz-UZ") : "—";

export function instrumentReadings(config, kind) {
  const units = kind === "space" ? SPATIAL : kind === "electric" ? ELECTRIC : FORCE;
  const results = (config.results || []).filter((r) => units.has(r.unit))
    .map((r) => ({ ...r, source: "result" }));
  if (kind !== "space") return results;
  return [...results, ...(config.params || []).filter((p) => units.has(p.unit))
    .map((p) => ({ ...p, source: "param", scale: 1 }))];
}

const MEASURABLE_SCENES = new Set(["uniform", "lever", "lens", "spring", "pendulum", "fall", "projectile", "energy"]);
export function sceneMetresPerPixel(key, p, state, trailStates = []) {
  if (key === "uniform") return { x: 1 / 4, y: 0 };
  if (key === "lever") return { x: Math.max(p.arm1, p.arm2) / 220, y: 0 };
  if (key === "lens") {
    const extent = Math.max(3, p.object, Number.isFinite(state.image) ? Math.min(10, Math.abs(state.image)) : 3);
    return { x: extent / 330, y: 0 };
  }
  if (key === "spring") return { x: 0, y: 1 / 105 };
  if (key === "pendulum") {
    const scale = p.length / Math.max(70, Math.min(180, p.length * 100));
    return { x: scale, y: scale / 0.92 };
  }
  if (key === "fall" || key === "projectile") {
    const maxRange = Math.max(state.range, ...trailStates.map((item) => item.range));
    const maxHeight = Math.max(state.height, ...trailStates.map((item) => item.height));
    const scale = Math.min(640 / Math.max(12, maxRange * 1.1), 280 / Math.max(8, maxHeight * 1.2));
    return { x: 1 / scale, y: 1 / scale };
  }
  if (key === "energy") return { x: 1 / 40, y: 1 / 40 };
  return null;
}

function card(layer, id, title, icon, x, y, body) {
  const el = document.createElement("div");
  el.className = "vi-instrument vi-hidden";
  el.id = id;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.innerHTML = `<div class="vi-header" tabindex="0" aria-label="${title} asbobini ko‘chirish"><span class="vi-icon" aria-hidden="true">${ICONS[title] || icon}</span><span class="vi-title">${title}</span><button type="button" class="vi-close" aria-label="${title}ni yashirish">×</button></div><div class="vi-body">${body}</div>`;
  layer.append(el);
  const header = el.querySelector(".vi-header");
  let drag = null;
  const move = (left, top) => {
    const bounds = layer.getBoundingClientRect();
    el.style.left = `${Math.max(0, Math.min(left, Math.max(0, bounds.width - el.offsetWidth)))}px`;
    el.style.top = `${Math.max(0, Math.min(top, Math.max(0, bounds.height - el.offsetHeight)))}px`;
  };
  header.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    drag = { x: event.clientX, y: event.clientY, left: el.offsetLeft, top: el.offsetTop };
    header.setPointerCapture(event.pointerId);
  });
  header.addEventListener("pointermove", (event) => {
    if (drag) move(drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y);
  });
  header.addEventListener("pointerup", () => { drag = null; });
  header.addEventListener("pointercancel", () => { drag = null; });
  header.addEventListener("keydown", (event) => {
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? 32 : 8;
    move(el.offsetLeft + step * direction[0], el.offsetTop + step * direction[1]);
  });
  el.querySelector(".vi-close").onclick = () => el.classList.add("vi-hidden");
  return el;
}

function quantityProbe(layer, id, title, icon, readings, x, y, differential = false) {
  const options = readings.map((item, index) =>
    `<option value="${index}">${item.label || item.key} (${item.unit})</option>`).join("");
  const el = card(layer, id, title, icon, x, y,
    `<label class="vi-probe-label">Kattalik<select class="vi-probe-select">${options}</select></label><div class="vi-sw-display vi-probe-reading" aria-live="polite">—</div>${differential ? '<div class="vi-probe-actions"><button type="button" class="vi-btn" data-point="a">A ni belgilash</button><button type="button" class="vi-btn" data-point="b">B ni belgilash</button></div><p class="vi-probe-delta">Δ = —</p>' : '<p class="vi-probe-note">Natija fizik modeldan olinadi.</p>'}`);
  const select = el.querySelector(".vi-probe-select");
  const display = el.querySelector(".vi-probe-reading");
  const delta = el.querySelector(".vi-probe-delta");
  let current = null;
  let a = null;
  let b = null;
  if (differential) el.querySelectorAll("[data-point]").forEach((button) => {
    button.onclick = () => {
      if (button.dataset.point === "a") a = current;
      else b = current;
      const unit = readings[Number(select.value)].unit;
      delta.textContent = a === null || b === null ? "Δ = —" : `Δ = ${number(Math.abs(b - a))} ${unit}`;
    };
  });
  select.onchange = () => { a = null; b = null; if (delta) delta.textContent = "Δ = —"; };
  return {
    el,
    update(state, _t, params) {
      const reading = readings[Number(select.value)];
      const raw = reading.source === "param" ? params?.[reading.key] : state?.[reading.key];
      current = typeof raw === "number" && Number.isFinite(raw) ? raw * (reading.scale ?? 1) : null;
      display.textContent = `${number(current)} ${reading.unit}`;
    },
  };
}

function stopwatch(layer, getState) {
  const el = card(layer, "vi-stopwatch", "Sekundomer", "⏱", 20, 160,
    '<div class="vi-sw-display" aria-live="polite">0.000 s</div><div class="vi-sw-laps"></div><div class="vi-sw-buttons"><button type="button" class="vi-btn" data-watch="start">▶ Boshlash</button><button type="button" class="vi-btn" data-watch="lap">Belgi</button><button type="button" class="vi-btn" data-watch="reset">Nolga</button></div>');
  const display = el.querySelector(".vi-sw-display");
  const laps = el.querySelector(".vi-sw-laps");
  const start = el.querySelector('[data-watch="start"]');
  let running = false;
  let origin = 0;
  let elapsed = 0;
  let lastTime = 0;
  const time = () => Number(getState()?.t || 0);
  start.onclick = () => {
    running = !running;
    if (running) origin = time() - elapsed;
    start.textContent = running ? "⏸ Pauza" : "▶ Davom";
  };
  el.querySelector('[data-watch="lap"]').onclick = () => {
    const item = document.createElement("span");
    item.className = "vi-lap";
    item.textContent = `#${laps.children.length + 1} ${elapsed.toFixed(3)} s`;
    laps.append(item);
  };
  el.querySelector('[data-watch="reset"]').onclick = () => {
    running = false;
    origin = time();
    elapsed = 0;
    laps.replaceChildren();
    display.textContent = "0.000 s";
    start.textContent = "▶ Boshlash";
  };
  return { el, update(_state, t) {
    if (t < lastTime && running) { origin = t; elapsed = 0; }
    lastTime = t;
    if (running) elapsed = Math.max(0, t - origin);
    display.textContent = `${elapsed.toFixed(3)} s`;
  } };
}

export function mountVirtualInstruments(stage, config, getState) {
  if (!stage) return { update() {}, destroy() {} };
  const layer = document.createElement("div");
  layer.className = "vi-layer";
  stage.style.position = "relative";
  stage.append(layer);
  const instruments = [];
  const canvas = stage.querySelector("#sim-canvas");
  const spatial = instrumentReadings(config, "space");
  const electrical = instrumentReadings(config, "electric");
  const forces = instrumentReadings(config, "force");
  if (spatial.length) instruments.push(quantityProbe(layer, "vi-ruler", "Chizg‘ich", "📏", spatial, 20, 20, true));
  let measureOverlay = null;
  let measureResize = null;
  if (spatial.length && canvas && MEASURABLE_SCENES.has(config.key)) {
    const ruler = instruments[0].el;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "vi-btn vi-scene-button";
    button.textContent = "Sahnada masofani o‘lchash";
    const result = document.createElement("p");
    result.className = "vi-probe-delta";
    result.setAttribute("aria-live", "polite");
    ruler.querySelector(".vi-body").append(button, result);
    measureOverlay = document.createElement("div");
    measureOverlay.className = "vi-measure-overlay";
    measureOverlay.hidden = true;
    measureOverlay.innerHTML = '<svg viewBox="0 0 800 460" preserveAspectRatio="none" aria-hidden="true"><line/><circle data-mark="a" r="6"/><circle data-mark="b" r="6"/></svg>';
    stage.append(measureOverlay);
    const align = () => {
      measureOverlay.style.left = `${canvas.offsetLeft}px`;
      measureOverlay.style.top = `${canvas.offsetTop}px`;
      measureOverlay.style.width = `${canvas.clientWidth}px`;
      measureOverlay.style.height = `${canvas.clientHeight}px`;
    };
    align();
    if (typeof ResizeObserver === "function") {
      measureResize = new ResizeObserver(align);
      measureResize.observe(canvas);
    }
    let first = null;
    button.onclick = () => {
      if (!measureOverlay.hidden && !measureOverlay.classList.contains("is-finished")) {
        measureOverlay.hidden = true;
        button.textContent = "Sahnada masofani o‘lchash";
        return;
      }
      first = null;
      measureOverlay.classList.remove("is-finished");
      align();
      measureOverlay.hidden = false;
      measureOverlay.dataset.hint = "A nuqtani tanlang";
      button.textContent = "A nuqtani tanlang · Bekor qilish";
      result.textContent = "";
      measureOverlay.querySelector("svg").classList.remove("has-points");
      canvas.scrollIntoView({ block: "center", behavior: "instant" });
    };
    measureOverlay.addEventListener("pointerdown", (event) => {
      const rect = measureOverlay.getBoundingClientRect();
      const point = { x: (event.clientX - rect.left) * 800 / rect.width, y: (event.clientY - rect.top) * 460 / rect.height };
      if (!first) {
        first = point;
        const marker = measureOverlay.querySelector('[data-mark="a"]');
        marker.setAttribute("cx", point.x);
        marker.setAttribute("cy", point.y);
        measureOverlay.querySelector("svg").classList.add("has-points");
        measureOverlay.dataset.hint = "B nuqtani tanlang";
        button.textContent = "B nuqtani tanlang · Bekor qilish";
        return;
      }
      const { p, state, trails = [] } = getState();
      const trailStates = trails.map((trail) => config.calculate(trail, 0));
      const scale = sceneMetresPerPixel(config.key, p, state, trailStates);
      const distance = Math.hypot((point.x - first.x) * scale.x, (point.y - first.y) * scale.y);
      const marker = measureOverlay.querySelector('[data-mark="b"]');
      marker.setAttribute("cx", point.x);
      marker.setAttribute("cy", point.y);
      const line = measureOverlay.querySelector("line");
      for (const [name, value] of Object.entries({ x1: first.x, y1: first.y, x2: point.x, y2: point.y })) line.setAttribute(name, value);
      const axis = ["uniform", "lever", "lens"].includes(config.key) ? "Gorizontal " : config.key === "spring" ? "Vertikal " : "";
      result.textContent = `Sahnadagi ${axis}A–B: ${number(distance)} m`;
      measureOverlay.classList.add("is-finished");
      button.textContent = "Sahnada qayta o‘lchash";
      first = null;
    });
    ruler.querySelector(".vi-close").addEventListener("click", () => { measureOverlay.hidden = true; });
  }
  if (!config.static) instruments.push(stopwatch(layer, getState));
  if (electrical.length && ["tok", "elektrostatika", "elektro-tebranish", "muhit", "elektromagnit"].includes(config.section))
    instruments.push(quantityProbe(layer, "vi-multimeter", "Multimetr", "🔌", electrical, 20, 270));
  if (forces.length) instruments.push(quantityProbe(layer, "vi-dynamometer", "Dinamometr", "↗", forces, 20, 360));
  const toolbar = document.createElement("div");
  toolbar.className = "vi-toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Virtual asboblar paneli");
  const toolbarLabel = document.createElement("span");
  toolbarLabel.className = "vi-toolbar-label";
  toolbarLabel.textContent = "Asboblar";
  toolbar.append(toolbarLabel);
  for (const [index, instrument] of instruments.entries()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "vi-toolbar-btn";
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-controls", instrument.el.id);
    const icon = instrument.el.querySelector(".vi-icon").cloneNode(true);
    icon.className = "vi-tool-icon";
    const label = document.createElement("span");
    label.textContent = instrument.el.querySelector(".vi-title").textContent;
    button.append(icon, label);
    button.onclick = () => {
      instrument.el.classList.toggle("vi-hidden");
      const opened = !instrument.el.classList.contains("vi-hidden");
      button.classList.toggle("active", opened);
      button.setAttribute("aria-pressed", String(opened));
      if (opened) {
        if (window.matchMedia("(max-width: 680px)").matches) {
          instrument.el.scrollIntoView({ block: "nearest", behavior: "instant" });
          return;
        }
        // Bir nechta asbob ochilganda ular bir-birining ustiga tushmasin.
        const nextLeft = 20 + index * (instrument.el.offsetWidth + 12);
        instrument.el.style.left = `${Math.max(8, Math.min(nextLeft, layer.clientWidth - instrument.el.offsetWidth - 8))}px`;
        const stageTop = stage.getBoundingClientRect().top;
        // Asbob vaqt tugmalari va asboblar panelini yopib qo‘ymasligi kerak.
        const controls = stage.querySelector(".transport") || toolbar;
        const aboveControls = controls.getBoundingClientRect().top - stageTop - instrument.el.offsetHeight - 12;
        const belowHeader = 96 - stageTop;
        const maxTop = Math.max(8, layer.clientHeight - instrument.el.offsetHeight - 8);
        instrument.el.style.top = `${Math.max(8, Math.min(belowHeader, aboveControls, maxTop))}px`;
        const visibleTop = instrument.el.getBoundingClientRect().top;
        if (visibleTop < 88) window.scrollBy({ top: visibleTop - 96, behavior: "instant" });
      }
    };
    instrument.el.querySelector(".vi-close").addEventListener("click", () => {
      button.classList.remove("active");
      button.setAttribute("aria-pressed", "false");
    });
    toolbar.append(button);
  }
  if (instruments.length) stage.append(toolbar);
  let lastMeasureParams = null;
  return {
    update(state, t, params) {
      const signature = JSON.stringify(params);
      if (measureOverlay && lastMeasureParams !== null && signature !== lastMeasureParams) measureOverlay.hidden = true;
      lastMeasureParams = signature;
      instruments.forEach((instrument) => instrument.update(state, t, params));
    },
    destroy() { measureResize?.disconnect(); measureOverlay?.remove(); layer.remove(); toolbar.remove(); },
  };
}
