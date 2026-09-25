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
  constructor(canvas) {
    this.canvas = canvas || null;
    this.ctx = this.canvas?.getContext?.("2d") || null;
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
  }
  update(state) {
    if (!this.canvas?.isConnected) return;
    this.state = state;
    this.draw();
  }
  /**
   * Backing store size for the current box. Prefers the measured box so CSS
   * clamps (max-height, hidden parents) stay in sync, and falls back to the
   * 800/460 aspect ratio when the box has no height yet. Returns null while
   * the canvas is not laid out, so nothing is painted into a 0x0 buffer.
   */
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
    // Assigning width/height resets the context, so always resize first and
    // re-apply the transform afterwards. Height is checked too, otherwise a
    // devicePixelRatio change (zoom, second monitor) leaves a stretched buffer.
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
  }
  destroy() {
    this.resize?.disconnect();
    if (this.onWindowResize) window.removeEventListener("resize", this.onWindowResize);
    this.state = null;
    this.canvas = null;
    this.ctx = null;
  }
}
