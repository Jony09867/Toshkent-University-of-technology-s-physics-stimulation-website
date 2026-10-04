import { renderSimulation } from "../simulations/render.js";

/** Logical drawing space; mirrors `aspect-ratio: 800 / 460` in styles.css. */
const BASE_WIDTH = 800;
const BASE_HEIGHT = 460;
/** Cap the backing store so huge DPR screens do not blow up the buffer. */
const MAX_DPR = 2;
/** Below this CSS width renderers switch to their compact layout. */
const COMPACT_WIDTH = 520;
const LEVELS = ["easy", "medium", "hard"];

const FOCUS_PARAMS = {
  motion: "v0",
  fall: "h",
  newton: "force",
  friction: "mu",
  projectile: "angle",
  energy: "h",
  spring: "m",
  resonance: "frequency",
  buoyancy: "rho",
  gas: "temperature",
  coulomb: "r",
  ohm: "voltage",
  circuit: "resistance",
  induction: "speed",
  lens: "object",
};

export class SimulationCanvas {
  constructor(canvas, onDrag = null) {
    this.canvas = canvas || null;
    this.ctx = this.canvas?.getContext?.("2d") || null;
    this.onDrag = onDrag;
    this.dragState = null;

    this.resize =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => this.draw())
        : null;
    if (this.resize && this.canvas) this.resize.observe(this.canvas);
    else if (this.canvas) {
      // Fallback for engines without ResizeObserver.
      this.onWindowResize = () => this.draw();
      window.addEventListener("resize", this.onWindowResize);
    }

    this.setupInteractivity();
  }

  setupInteractivity() {
    if (!this.canvas) return;

    this.canvas.style.cursor = "grab";

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const cx = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
      const cy = e.touches && e.touches.length ? e.touches[0].clientY : e.clientY;
      return {
        x: Math.max(0, Math.min(rect.width, cx - rect.left)),
        y: Math.max(0, Math.min(rect.height, cy - rect.top)),
        width: rect.width || 1,
        height: rect.height || 1,
      };
    };

    const findTargetParam = (pos) => {
      if (!this.state?.config?.params?.length) return null;
      const key = this.state.config.key;
      const x = pos.x * BASE_WIDTH / pos.width;
      const y = pos.y * BASE_HEIGHT / pos.height;
      const near = (cx, cy, radius = 38) => Math.hypot(x - cx, y - cy) < radius;
      const named = (name, vertical, valueAt) => {
        const param = this.state.config.params.find((item) => item.key === name);
        return param ? { param, isVertical: vertical, valueAt } : null;
      };
      const p = this.state.p;
      const s = this.state.s;
      if (key === "pendulum") {
        const length = Math.max(70, Math.min(180, p.length * 100));
        if (!near(400 + length * Math.sin(s.theta), 100 + length * Math.cos(s.theta), 44)) return null;
        return named("amplitude", false, (px, py) => Math.abs(Math.atan2(px - 400, py - 100) * 180 / Math.PI));
      }
      if (key === "spring") {
        if (!near(285, 295 + s.x * 105, 48)) return null;
        return named("amplitude", true, (_px, py) => Math.abs((py - 295) / 105));
      }
      if (key === "lever") {
        const scale = 220 / Math.max(p.arm1, p.arm2);
        if (near(400 - p.arm1 * scale, 265, 48)) return named("arm1", false, (px) => (400 - px) / scale);
        if (near(400 + p.arm2 * scale, 265, 48)) return named("arm2", false, (px) => (px - 400) / scale);
        return null;
      }
      if (key === "lens") {
        const extent = Math.max(3, p.object, Number.isFinite(s.image) ? Math.min(10, Math.abs(s.image)) : 3);
        const scale = 330 / extent;
        if (near(400 - p.object * scale, 250 - p.height * scale * 2, 45))
          return named("object", false, (px) => (400 - px) / scale);
        if (near(400 + p.focal * scale, 250, 36))
          return named("focal", false, (px) => (px - 400) / scale);
        return null;
      }
      const focusKey = FOCUS_PARAMS[key] || this.state.config.params[0].key;
      const param = (
        this.state.config.params.find((p) => p.key === focusKey) ||
        this.state.config.params[0]
      );
      return { param, isVertical: ["fall", "energy", "buoyancy"].includes(key) };
    };

    const onPointerDown = (e) => {
      if (!this.onDrag || !this.state) return;
      const pos = getPos(e);
      const target = findTargetParam(pos);
      if (!target) return;
      if (e.cancelable) e.preventDefault();
      const { param: targetParam, isVertical, valueAt } = target;
      const startVal = Number(this.state.p?.[targetParam.key] ?? targetParam.value);

      this.dragState = {
        param: targetParam,
        isVertical,
        startX: pos.x,
        startY: pos.y,
        startVal,
        valueAt,
        currentX: pos.x,
        currentY: pos.y,
        val: startVal,
      };

      this.canvas.style.cursor = "grabbing";
      window.addEventListener("mousemove", onPointerMove);
      window.addEventListener("mouseup", onPointerUp);
      window.addEventListener("touchmove", onPointerMove, { passive: false });
      window.addEventListener("touchend", onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!this.dragState) return;
      if (e.cancelable) e.preventDefault();

      const pos = getPos(e);
      const { param, isVertical, startX, startY, startVal, valueAt } = this.dragState;
      const span = param.max - param.min;
      let nextVal;

      if (valueAt) {
        nextVal = valueAt(pos.x * BASE_WIDTH / pos.width, pos.y * BASE_HEIGHT / pos.height);
      } else if (isVertical) {
        // Dragging upward increases value
        const dy = (startY - pos.y) / pos.height;
        nextVal = startVal + dy * span * 1.4;
      } else {
        // Dragging rightward increases value
        const dx = (pos.x - startX) / pos.width;
        nextVal = startVal + dx * span * 1.4;
      }

      nextVal = Math.max(param.min, Math.min(param.max, nextVal));
      this.dragState.currentX = pos.x;
      this.dragState.currentY = pos.y;
      this.dragState.val = nextVal;

      this.onDrag(param.key, nextVal);
      this.draw();
    };

    const onPointerUp = () => {
      if (!this.dragState) return;
      this.dragState = null;
      if (this.canvas) this.canvas.style.cursor = "grab";
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
      this.draw();
    };

    this.canvas.addEventListener("mousedown", onPointerDown);
    this.canvas.addEventListener("touchstart", onPointerDown, { passive: false });

    this._cleanupInteractivity = () => {
      this.canvas?.removeEventListener("mousedown", onPointerDown);
      this.canvas?.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };
  }

  update(state) {
    if (!this.canvas?.isConnected) return;
    this.state = state;
    this.draw();
  }

  size() {
    if (!this.canvas) return null;
    const cssWidth = this.canvas.clientWidth;
    if (!cssWidth) return null;
    const measured = this.canvas.clientHeight;
    const cssHeight = measured || (cssWidth * BASE_HEIGHT) / BASE_WIDTH;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    return {
      cssWidth,
      dpr,
      compact: cssWidth < COMPACT_WIDTH,
      width: Math.max(1, Math.round(cssWidth * dpr)),
      height: Math.max(1, Math.round(cssHeight * dpr)),
    };
  }

  draw() {
    if (!this.state || !this.ctx || !this.canvas?.isConnected) return;
    const size = this.size();
    if (!size) return;

    if (this.canvas.width !== size.width) this.canvas.width = size.width;
    if (this.canvas.height !== size.height) this.canvas.height = size.height;
    this.ctx.setTransform(
      size.width / BASE_WIDTH,
      0,
      0,
      size.height / BASE_HEIGHT,
      0,
      0,
    );
    this.state.compact = size.compact;
    const level = LEVELS[this.state.level ?? 0];
    const render = this.state.config?.levels?.[level]?.render || renderSimulation;
    try {
      render(this.ctx, this.state);
    } catch (error) {
      console.error("Simulation render failed:", error);
    }

    // Direct Drag Interactive HUD Overlay
    if (this.dragState) {
      const { param, val, currentX, currentY } = this.dragState;
      const scaleX = BASE_WIDTH / (this.canvas.clientWidth || 1);
      const scaleY = BASE_HEIGHT / (this.canvas.clientHeight || 1);
      const bx = currentX * scaleX;
      const by = currentY * scaleY;

      this.ctx.save();
      // Outer targeting ring
      this.ctx.beginPath();
      this.ctx.arc(bx, by, 18, 0, Math.PI * 2);
      this.ctx.strokeStyle = "rgba(241, 89, 42, 0.85)";
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();

      // Inner dot
      this.ctx.beginPath();
      this.ctx.arc(bx, by, 5, 0, Math.PI * 2);
      this.ctx.fillStyle = "#F1592A";
      this.ctx.fill();

      // Tooltip pill
      const formattedVal = val.toFixed(param.step < 0.1 ? 2 : 1);
      const label = `${param.label || param.key}: ${formattedVal} ${param.unit || ""}`.trim();
      this.ctx.font = "bold 13px system-ui, sans-serif";
      const textWidth = this.ctx.measureText(label).width;
      const pillW = textWidth + 24;
      const pillH = 28;
      const pillX = Math.max(10, Math.min(BASE_WIDTH - pillW - 10, bx - pillW / 2));
      const pillY = Math.max(10, by - 44);

      this.ctx.fillStyle = "rgba(14, 22, 32, 0.92)";
      this.ctx.strokeStyle = "rgba(241, 89, 42, 0.7)";
      this.ctx.lineWidth = 1.2;
      this.ctx.beginPath();
      if (typeof this.ctx.roundRect === "function") {
        this.ctx.roundRect(pillX, pillY, pillW, pillH, 8);
      } else {
        this.ctx.rect(pillX, pillY, pillW, pillH);
      }
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = "#ffffff";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(label, pillX + pillW / 2, pillY + pillH / 2);
      this.ctx.restore();
    }
  }

  destroy() {
    this._cleanupInteractivity?.();
    this.resize?.disconnect();
    if (this.onWindowResize) window.removeEventListener("resize", this.onWindowResize);
    this.state = null;
    this.canvas = null;
    this.ctx = null;
  }
}
