import { renderSimulation } from "../simulations/render.js";

/** Logical drawing space; mirrors `aspect-ratio: 800 / 460` in styles.css. */
const BASE_WIDTH = 800;
const BASE_HEIGHT = 460;
/** Cap the backing store so huge DPR screens do not blow up the buffer. */
const MAX_DPR = 2;
/** Below this CSS width renderers switch to their compact layout. */
const COMPACT_WIDTH = 520;
const LEVELS = ["easy", "medium", "hard"];

export class SimulationCanvas {
  constructor(canvas, onParamChange = null) {
    this.canvas = canvas || null;
    this.ctx = this.canvas?.getContext?.("2d") || null;
    this.onParamChange = onParamChange;
    this.dragging = null;
    this.hoverHandle = null;

    this._cachedSize = null;
    this.resize =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => {
            this._cachedSize = null;
            this.draw();
          })
        : null;
    if (this.resize && this.canvas) this.resize.observe(this.canvas);
    else if (this.canvas) {
      this.onWindowResize = () => {
        this._cachedSize = null;
        this.draw();
      };
      window.addEventListener("resize", this.onWindowResize);
    }

    this.bindPointerEvents();
  }

  toLogical(e) {
    if (!this.canvas) return { x: 0, y: 0 };
    const rect = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * BASE_WIDTH;
    const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * BASE_HEIGHT;
    return { x, y };
  }

  detectHandle(lx, ly) {
    if (!this.state || !this.state.config) return null;
    const { config, p, s } = this.state;
    const key = config.key;

    if (key === "coulomb") {
      const d = 80 + (p.r ?? 1) * 135;
      const x2 = 400 + d / 2;
      const y = 235;
      if (Math.hypot(lx - x2, ly - y) < 42) {
        return { type: "coulomb_r", cursor: "ew-resize" };
      }
      const x1 = 400 - d / 2;
      if (Math.hypot(lx - x1, ly - y) < 42) {
        return { type: "coulomb_q1", cursor: "ew-resize" };
      }
    }

    if (key === "lens") {
      const extent = Math.max(
        3,
        p.object ?? 1.2,
        Number.isFinite(s?.image) ? Math.min(10, Math.abs(s.image)) : 3,
      );
      const scale = 330 / extent;
      const ox = 400, oy = 250;
      const dx = -(p.object ?? 1.2) * scale;
      const h = (p.height ?? 0.2) * scale * 2;
      if (Math.hypot(lx - (ox + dx), ly - (oy - h)) < 36) {
        return { type: "lens_object", cursor: "move" };
      }
      const fx = ox + (p.focal ?? 0.5) * scale;
      if (Math.hypot(lx - fx, ly - oy) < 28) {
        return { type: "lens_focal", cursor: "ew-resize" };
      }
    }

    if (key === "collision") {
      const scale = 36;
      const ox = 400;
      const x1 = ox + (s?.x1 ?? -4) * scale;
      const x2 = ox + (s?.x2 ?? 4) * scale;
      if (Math.hypot(lx - x1, ly - 290) < 40) {
        return { type: "collision_v1", cursor: "ew-resize" };
      }
      if (Math.hypot(lx - x2, ly - 290) < 40) {
        return { type: "collision_v2", cursor: "ew-resize" };
      }
    }

    if (key === "gas") {
      const w = 230 + (270 * ((p.volume ?? 20) - 5)) / 45;
      const x = (800 - w) / 2;
      const pistonX = x + w - 4;
      if (Math.abs(lx - pistonX) < 28 && ly >= 90 && ly <= 355) {
        return { type: "gas_volume", cursor: "ew-resize" };
      }
    }

    if (key === "spring") {
      const x = 285;
      const bottom = 240 + (s?.x ?? 0) * 105;
      if (Math.hypot(lx - x, ly - (bottom + 27)) < 44) {
        return { type: "spring_mass", cursor: "ns-resize" };
      }
    }

    if (key === "projectile") {
      const ox = 65;
      const oy = 365;
      const angleRad = ((p.angle ?? 45) * Math.PI) / 180;
      const tipX = ox + Math.cos(angleRad) * 60;
      const tipY = oy - Math.sin(angleRad) * 60;
      if (Math.hypot(lx - tipX, ly - tipY) < 36 || (Math.hypot(lx - ox, ly - oy) < 70 && ly <= oy + 10)) {
        return { type: "projectile_angle", cursor: "crosshair" };
      }
    }

    if (key === "newton" || key === "friction") {
      const end =
        key === "newton"
          ? Math.max(10, Math.abs(s?.a ?? 1) * 18)
          : Math.max(30, Number.isFinite(s?.distance) ? s.distance : 80);
      const scale = 550 / end;
      const x = Math.max(65, Math.min(725, 130 + (s?.x ?? 0) * scale));
      const size = key === "newton" ? 36 + (p.m ?? 5) * 2 : 62;
      const arrowTipX = x + size / 2 + (p.force ?? 20) * 1.2;
      const arrowY = 342 - size / 2;
      if (Math.hypot(lx - arrowTipX, ly - arrowY) < 32) {
        return { type: "force_pull", cursor: "ew-resize" };
      }
    }

    if (key === "pendulum") {
      const ox = 400, oy = 75;
      const pxLen = (p.length ?? 1.2) * 90;
      const thetaRad = ((s?.theta ?? 0) * Math.PI) / 180;
      const bobX = ox + Math.sin(thetaRad) * pxLen;
      const bobY = oy + Math.cos(thetaRad) * pxLen;
      if (Math.hypot(lx - bobX, ly - bobY) < 40) {
        return { type: "pendulum_bob", cursor: "grab" };
      }
    }

    if (key === "lever") {
      const maxL = Math.max(p.l1 ?? 1.5, p.l2 ?? 1, 1.8);
      const pxScale = 300 / maxL;
      const leftX = 400 - (p.l1 ?? 1.5) * pxScale;
      const rightX = 400 + (p.l2 ?? 1) * pxScale;
      if (Math.hypot(lx - leftX, ly - 290) < 40) {
        return { type: "lever_m1", cursor: "ew-resize" };
      }
      if (Math.hypot(lx - rightX, ly - 290) < 40) {
        return { type: "lever_m2", cursor: "ew-resize" };
      }
    }

    if (key === "circular") {
      const rad = ((s?.angle ?? 0) * Math.PI) / 180;
      const pxR = (p.radius ?? 2) * 45;
      const px = 400 + Math.cos(rad) * pxR;
      const py = 230 + Math.sin(rad) * pxR;
      if (Math.hypot(lx - px, ly - py) < 36) {
        return { type: "circular_bob", cursor: "move" };
      }
    }

    if (key === "gravitation") {
      const orbitR = 75 + Math.min(130, ((p.altitude ?? 1000) / 36000) * 120 + 35);
      const satAngle = s?.angle ?? -Math.PI / 4;
      const satX = 320 + Math.cos(satAngle) * orbitR;
      const satY = 230 + Math.sin(satAngle) * orbitR;
      if (Math.hypot(lx - satX, ly - satY) < 36) {
        return { type: "satellite_orbit", cursor: "ns-resize" };
      }
    }

    if (key === "hydraulic") {
      if (Math.hypot(lx - (400 - 135), ly - 270) < 40) {
        return { type: "hydraulic_piston1", cursor: "ns-resize" };
      }
    }

    return null;
  }

  bindPointerEvents() {
    if (!this.canvas) return;

    this.onPointerDown = (e) => {
      if (!this.onParamChange || !this.state) return;
      const { x, y } = this.toLogical(e);
      const handle = this.detectHandle(x, y);
      if (handle) {
        this.dragging = {
          handle: handle.type,
          startX: x,
          startY: y,
          initialParams: { ...this.state.p },
        };
        try {
          this.canvas.setPointerCapture(e.pointerId);
        } catch {}
        this.canvas.style.cursor = "grabbing";
        this.draw();
      }
    };

    this.onPointerMove = (e) => {
      const { x, y } = this.toLogical(e);
      if (this.dragging) {
        this.handleDrag(x, y);
      } else {
        const handle = this.detectHandle(x, y);
        if (handle) {
          this.hoverHandle = handle.type;
          this.canvas.style.cursor = handle.cursor;
        } else {
          if (this.hoverHandle) {
            this.hoverHandle = null;
            this.canvas.style.cursor = "default";
            this.draw();
          }
        }
      }
    };

    this.onPointerUp = (e) => {
      if (this.dragging) {
        this.dragging = null;
        try {
          this.canvas.releasePointerCapture(e.pointerId);
        } catch {}
        const { x, y } = this.toLogical(e);
        const handle = this.detectHandle(x, y);
        this.canvas.style.cursor = handle ? handle.cursor : "default";
        this.draw();
      }
    };

    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
  }

  handleDrag(lx, ly) {
    if (!this.dragging || !this.onParamChange || !this.state) return;
    const { handle, initialParams } = this.dragging;
    const { p } = this.state;

    if (handle === "coulomb_r") {
      const d = (lx - 400) * 2;
      const newR = Math.max(0.1, Math.min(3, Math.round(((d - 80) / 135) * 10) / 10));
      if (newR !== p.r) this.onParamChange("r", newR);
    } else if (handle === "coulomb_q1") {
      const d = (400 - lx) * 2;
      const newR = Math.max(0.1, Math.min(3, Math.round(((d - 80) / 135) * 10) / 10));
      if (newR !== p.r) this.onParamChange("r", newR);
    } else if (handle === "lens_object") {
      const extent = Math.max(3, p.object ?? 1.2);
      const scale = 330 / extent;
      const ox = 400, oy = 250;
      const newObj = Math.max(0.1, Math.min(3, Math.round(((ox - lx) / scale) * 20) / 20));
      const newH = Math.max(0.05, Math.min(0.4, Math.round(((oy - ly) / (scale * 2)) * 20) / 20));
      if (newObj !== p.object) this.onParamChange("object", newObj);
      if (newH !== p.height) this.onParamChange("height", newH);
    } else if (handle === "lens_focal") {
      const extent = Math.max(3, p.object ?? 1.2);
      const scale = 330 / extent;
      const newF = Math.max(0.2, Math.min(1.5, Math.round(((lx - 400) / scale) * 20) / 20));
      if (newF !== p.focal) this.onParamChange("focal", newF);
    } else if (handle === "collision_v1") {
      const deltaX = lx - this.dragging.startX;
      const newV1 = Math.max(0.5, Math.min(8, Math.round((initialParams.v1 + deltaX / 25) * 10) / 10));
      if (newV1 !== p.v1) this.onParamChange("v1", newV1);
    } else if (handle === "collision_v2") {
      const deltaX = lx - this.dragging.startX;
      const newV2 = Math.max(-8, Math.min(-0.5, Math.round((initialParams.v2 + deltaX / 25) * 10) / 10));
      if (newV2 !== p.v2) this.onParamChange("v2", newV2);
    } else if (handle === "gas_volume") {
      const deltaX = lx - this.dragging.startX;
      const deltaV = (deltaX / 270) * 45;
      const newV = Math.max(5, Math.min(50, Math.round(initialParams.volume + deltaV)));
      if (newV !== p.volume) this.onParamChange("volume", newV);
    } else if (handle === "spring_mass") {
      const deltaY = ly - this.dragging.startY;
      const deltaAmp = deltaY / 105;
      const newAmp = Math.max(0.05, Math.min(0.8, Math.round((initialParams.amplitude + deltaAmp) * 20) / 20));
      if (newAmp !== p.amplitude) this.onParamChange("amplitude", newAmp);
    } else if (handle === "projectile_angle") {
      const ox = 65, oy = 365;
      const rad = Math.atan2(oy - ly, lx - ox);
      const deg = Math.max(5, Math.min(85, Math.round((rad * 180) / Math.PI)));
      if (deg !== p.angle) this.onParamChange("angle", deg);
    } else if (handle === "force_pull") {
      const deltaX = lx - this.dragging.startX;
      const newF = Math.max(0, Math.min(100, Math.round(initialParams.force + deltaX / 1.2)));
      if (newF !== p.force) this.onParamChange("force", newF);
    } else if (handle === "pendulum_bob") {
      const ox = 400, oy = 75;
      const dx = lx - ox;
      const dy = Math.max(10, ly - oy);
      const angleDeg = Math.round(Math.abs(Math.atan2(dx, dy) * (180 / Math.PI)));
      const newAngle = Math.max(5, Math.min(45, angleDeg));
      const dist = Math.hypot(dx, dy);
      const newLength = Math.max(0.2, Math.min(3, Math.round((dist / 90) * 10) / 10));
      if (newAngle !== p.angle) this.onParamChange("angle", newAngle);
      if (newLength !== p.length) this.onParamChange("length", newLength);
    } else if (handle === "lever_m1") {
      const maxL = Math.max(p.l1 ?? 1.5, p.l2 ?? 1, 1.8);
      const pxScale = 300 / maxL;
      const newL1 = Math.max(0.2, Math.min(2.5, Math.round(((400 - lx) / pxScale) * 10) / 10));
      if (newL1 !== p.l1) this.onParamChange("l1", newL1);
    } else if (handle === "lever_m2") {
      const maxL = Math.max(p.l1 ?? 1.5, p.l2 ?? 1, 1.8);
      const pxScale = 300 / maxL;
      const newL2 = Math.max(0.2, Math.min(2.5, Math.round(((lx - 400) / pxScale) * 10) / 10));
      if (newL2 !== p.l2) this.onParamChange("l2", newL2);
    } else if (handle === "circular_bob") {
      const dist = Math.hypot(lx - 400, ly - 230);
      const newR = Math.max(0.5, Math.min(5, Math.round((dist / 45) * 10) / 10));
      if (newR !== p.radius) this.onParamChange("radius", newR);
    } else if (handle === "satellite_orbit") {
      const dist = Math.hypot(lx - 320, ly - 230);
      const frac = Math.max(0, Math.min(1, (dist - 110) / 120));
      const newAlt = Math.max(200, Math.min(36000, Math.round((frac * 36000) / 200) * 200));
      if (newAlt !== p.altitude) this.onParamChange("altitude", newAlt);
    } else if (handle === "hydraulic_piston1") {
      const dy = ly - 270;
      const newF1 = Math.max(10, Math.min(500, Math.round((p.f1 - dy * 2) / 10) * 10));
      if (newF1 !== p.f1) this.onParamChange("f1", newF1);
    }
  }

  update(state) {
    if (!this.canvas?.isConnected) return;
    this.state = state;
    this.draw();
  }

  size() {
    if (!this.canvas) return null;
    if (this._cachedSize) return this._cachedSize;
    const cssWidth = this.canvas.clientWidth;
    if (!cssWidth) return null;
    const measured = this.canvas.clientHeight;
    const cssHeight = measured || (cssWidth * BASE_HEIGHT) / BASE_WIDTH;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    this._cachedSize = {
      cssWidth,
      dpr,
      compact: cssWidth < COMPACT_WIDTH,
      width: Math.max(1, Math.round(cssWidth * dpr)),
      height: Math.max(1, Math.round(cssHeight * dpr)),
    };
    return this._cachedSize;
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
    this.state.hoverHandle = this.dragging ? this.dragging.handle : this.hoverHandle;
    const level = LEVELS[this.state.level ?? 0];
    const render = this.state.config?.levels?.[level]?.render || renderSimulation;
    try {
      render(this.ctx, this.state);
    } catch (error) {
      console.error("Simulation render failed:", error);
    }
  }

  destroy() {
    this.resize?.disconnect();
    if (this.onWindowResize) window.removeEventListener("resize", this.onWindowResize);
    if (this.canvas) {
      this.canvas.removeEventListener("pointerdown", this.onPointerDown);
      this.canvas.removeEventListener("pointermove", this.onPointerMove);
      this.canvas.removeEventListener("pointerup", this.onPointerUp);
      this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    }
    this.state = null;
    this.canvas = null;
    this.ctx = null;
  }
}
