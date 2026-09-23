import { renderSimulation } from "../simulations/render.js";
export class SimulationCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resize = new ResizeObserver(() => this.draw());
    this.resize.observe(canvas);
  }
  update(state) {
    this.state = state;
    this.draw();
  }
  draw() {
    if (!this.state) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2),
      width = Math.max(1, this.canvas.clientWidth),
      height = (width * 460) / 800;
    if (this.canvas.width !== Math.round(width * dpr)) {
      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
    }
    this.ctx.setTransform(
      this.canvas.width / 800,
      0,
      0,
      this.canvas.height / 460,
      0,
      0,
    );
    const level = ["easy", "medium", "hard"][this.state.level ?? 0];
    (this.state.config.levels[level]?.render || renderSimulation)(
      this.ctx,
      this.state,
    );
  }
  destroy() {
    this.resize.disconnect();
  }
}
