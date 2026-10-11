import { projectile } from "../physics/engine.js";

const W = 800;
const H = 460;
const ORIGIN_X = 174;
const GROUND_Y = 382;
const TOP_Y = 79;
const RIGHT_X = 748;
const orange = "#f1592a";
const blue = "#5a9eff";
const green = "#31cfa4";
let cachedPath;

export const fallHeightControl = { x: 74, top: 92, bottom: 375 };

export function fallHeightHandle(value, min, max) {
  const ratio = max > min ? (value - min) / (max - min) : 0;
  return {
    x: fallHeightControl.x,
    y: fallHeightControl.bottom - Math.max(0, Math.min(1, ratio)) *
      (fallHeightControl.bottom - fallHeightControl.top),
  };
}

export function fallHeightAt(y, min, max) {
  const ratio = (fallHeightControl.bottom - y) /
    (fallHeightControl.bottom - fallHeightControl.top);
  return min + Math.max(0, Math.min(1, ratio)) * (max - min);
}

function scaleFor(state, p) {
  const range = Math.max(1, state.range);
  const height = Math.max(1, p.h, state.height);
  return Math.min((RIGHT_X - ORIGIN_X) / (range * 1.08),
    (GROUND_Y - TOP_Y) / (height * 1.1));
}

function pathFor(p, duration) {
  const key = [p.h, p.v0, p.g, p.m, p.drag, duration].join("|");
  if (cachedPath?.key === key) return cachedPath.points;
  const points = Array.from({ length: 121 }, (_, index) => {
    const time = duration * index / 120;
    const state = projectile(p, time);
    return { x: state.x, y: state.y, time };
  });
  cachedPath = { key, points };
  return points;
}

function label(ctx, value, x, y, color = "#a9b8c6", size = 13, align = "left") {
  ctx.fillStyle = color;
  ctx.font = `500 ${size}px Inter, Segoe UI, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}

function segment(ctx, x1, y1, x2, y2, color, width = 1, dash = []) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function vector(ctx, x, y, dx, dy, color, name) {
  const length = Math.hypot(dx, dy);
  if (length < 3) return;
  segment(ctx, x, y, x + dx, y + dy, color, 2.4);
  const angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - 9 * Math.cos(angle - 0.48), y + dy - 9 * Math.sin(angle - 0.48));
  ctx.lineTo(x + dx - 9 * Math.cos(angle + 0.48), y + dy - 9 * Math.sin(angle + 0.48));
  ctx.fill();
  if (name) label(ctx, name, x + dx + (dx < 0 ? -9 : 9), y + dy - 8, color, 12,
    dx < 0 ? "right" : "left");
}

function niceStep(raw) {
  const power = 10 ** Math.floor(Math.log10(Math.max(raw, 1e-6)));
  const magnitude = raw / power;
  return (magnitude <= 1 ? 1 : magnitude <= 2 ? 2 : magnitude <= 5 ? 5 : 10) * power;
}

function axes(ctx, p, state, scale, compact) {
  const maxX = (RIGHT_X - ORIGIN_X) / scale;
  const maxY = (GROUND_Y - TOP_Y) / scale;
  const xStep = niceStep(maxX / 6);
  const yStep = niceStep(maxY / 4);
  for (let value = 0; value <= maxX; value += xStep) {
    const x = ORIGIN_X + value * scale;
    segment(ctx, x, TOP_Y, x, GROUND_Y, "rgba(110,137,158,.10)");
    if (!compact) label(ctx, String(Number(value.toFixed(2))), x, 405, "#8193a2", 11, "center");
  }
  for (let value = 0; value <= maxY; value += yStep) {
    const y = GROUND_Y - value * scale;
    segment(ctx, ORIGIN_X, y, RIGHT_X, y, "rgba(110,137,158,.10)");
    if (!compact) label(ctx, String(Number(value.toFixed(2))), ORIGIN_X - 12, y + 4,
      "#8193a2", 11, "right");
  }
  segment(ctx, ORIGIN_X, TOP_Y, ORIGIN_X, GROUND_Y, "#607282", 1.4);
  segment(ctx, ORIGIN_X, GROUND_Y, RIGHT_X, GROUND_Y, "#607282", 1.4);
  label(ctx, "x (m)", RIGHT_X, 405, "#c5d0d9", compact ? 24 : 13, "right");
  label(ctx, "y (m)", ORIGIN_X - 15, TOP_Y - 13, "#c5d0d9", compact ? 24 : 13, "right");
}

function ruler(ctx, p, parameter, compact) {
  const { x, top, bottom } = fallHeightControl;
  const handle = fallHeightHandle(p.h, parameter.min, parameter.max);
  segment(ctx, x, top, x, bottom, "#4b5e6c", 3);
  segment(ctx, x, handle.y, x, bottom, orange, 3);
  for (let index = 0; index <= 5; index++) {
    const y = bottom - (bottom - top) * index / 5;
    segment(ctx, x - 7, y, x + 7, y, "#8293a2", 1);
  }
  ctx.beginPath();
  ctx.arc(x, handle.y, compact ? 20 : 10, 0, Math.PI * 2);
  ctx.fillStyle = orange;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
  label(ctx, `h = ${Number(p.h.toFixed(2))} m`, x + 20, handle.y - 14,
    "#f3a384", compact ? 25 : 13);
  if (!compact) label(ctx, "Balandlikni torting", 27, 60, "#a9b8c6", 12);
}

function sphere(ctx, x, y, compact) {
  const radius = compact ? 25 : 13;
  const fill = ctx.createRadialGradient(x - 5, y - 6, 2, x, y, radius);
  fill.addColorStop(0, "#f1f4f6");
  fill.addColorStop(0.5, "#b7c2c9");
  fill.addColorStop(1, "#647684");
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "#f1592a";
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** Fizik holat va sahna chizmasi bitta koordinata masshtabidan foydalanadi. */
export function renderFallScene(ctx, { p, s, t, config, level, compact }) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0b1118";
  ctx.fillRect(0, 0, W, H);
  const scale = scaleFor(s, p);
  axes(ctx, p, s, scale, compact);
  const heightParam = config.params.find((item) => item.key === "h");
  ruler(ctx, p, heightParam, compact);

  const launchY = GROUND_Y - p.h * scale;
  segment(ctx, ORIGIN_X, launchY, RIGHT_X, launchY, "rgba(241,89,42,.13)", 1, [4, 7]);
  const points = pathFor(p, s.duration);
  const currentIndex = Math.min(120, Math.max(0, Math.round(t / Math.max(s.duration, 1e-9) * 120)));
  const drawPath = (from, to, color, dashed) => {
    if (to <= from) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = dashed ? 1.5 : 2.5;
    ctx.setLineDash(dashed ? [5, 7] : []);
    for (let index = from; index <= to; index++) {
      const point = points[index];
      const x = ORIGIN_X + point.x * scale;
      const y = GROUND_Y - point.y * scale;
      if (index === from) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };
  drawPath(0, currentIndex, orange, false);
  drawPath(currentIndex, 120, "#647889", true);

  const x = ORIGIN_X + s.x * scale;
  const y = GROUND_Y - s.y * scale;
  sphere(ctx, x, y, compact);
  ctx.beginPath();
  ctx.arc(ORIGIN_X + s.range * scale, GROUND_Y, 4, 0, Math.PI * 2);
  ctx.fillStyle = orange;
  ctx.fill();
  if (!compact) {
    label(ctx, s.landed ? "Yerga tegdi" : "Gorizontal otilgan jism", ORIGIN_X, 47,
      s.landed ? green : "#d8e1e8", 14);
    label(ctx, `Uchish masofasi ${Number(s.range.toFixed(2))} m`, RIGHT_X, 438,
      "#d8e1e8", 13, "right");
  }

  if (!s.landed) {
    const velocityScale = Math.min(3.4, 66 / Math.max(1, Math.hypot(s.vx, s.vy)));
    vector(ctx, x, y, s.vx * velocityScale, -s.vy * velocityScale, blue,
      compact ? "" : `v = ${Math.hypot(s.vx, s.vy).toFixed(1)} m/s`);
    const gravityForce = (p.m ?? 0.2) * (p.g ?? 9.81);
    const dragForce = (p.drag ?? 0) * Math.hypot(s.vx, s.vy);
    const forceScale = 62 / Math.max(1, gravityForce, dragForce);
    const gravityLength = level === 2 ? gravityForce * forceScale : (p.g ?? 9.81) * 5.5;
    vector(ctx, x - 17, y, 0, gravityLength, orange,
      compact ? "" : level === 2 ? `Fg = ${gravityForce.toFixed(2)} N` : `g = ${(p.g ?? 9.81).toFixed(1)} m/s²`);
    if (level === 2 && dragForce > 0.03) {
      const magnitude = Math.hypot(s.vx, s.vy) || 1;
      vector(ctx, x, y - 17, -s.vx / magnitude * dragForce * forceScale,
        s.vy / magnitude * dragForce * forceScale, green,
        compact ? "" : `Fh = ${dragForce.toFixed(2)} N`);
    }
  }
}
