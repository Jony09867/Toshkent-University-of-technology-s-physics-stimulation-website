import { clamp } from "../physics/engine.js";

const W = 800;
const H = 460;
const left = 58;
const right = 748;
const ground = 336;
const orange = "#f1592a";
const blue = "#5a9eff";
const green = "#31cfa4";
const ink = "#e6edf2";
const muted = "#9aabba";

function segment(c, x, y, X, Y, color = "#536574", width = 1, dash = []) {
  c.beginPath();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.setLineDash(dash);
  c.moveTo(x, y);
  c.lineTo(X, Y);
  c.stroke();
  c.setLineDash([]);
}

function label(c, value, x, y, color = muted, size = 13, align = "left") {
  c.fillStyle = color;
  c.font = `500 ${size}px Inter, Segoe UI, sans-serif`;
  c.textAlign = align;
  c.fillText(String(value), x, y);
}

function vector(c, x, y, dx, dy, color, name = "") {
  if (Math.hypot(dx, dy) < 3) return;
  segment(c, x, y, x + dx, y + dy, color, 2.5);
  const angle = Math.atan2(dy, dx);
  c.beginPath();
  c.fillStyle = color;
  c.moveTo(x + dx, y + dy);
  c.lineTo(x + dx - 10 * Math.cos(angle - .45), y + dy - 10 * Math.sin(angle - .45));
  c.lineTo(x + dx - 10 * Math.cos(angle + .45), y + dy - 10 * Math.sin(angle + .45));
  c.fill();
  if (name) label(c, name, x + dx + (dx < 0 ? -10 : 10), y + dy - 8,
    color, 12, dx < 0 ? "right" : "left");
}

function niceStep(raw) {
  const power = 10 ** Math.floor(Math.log10(Math.max(raw, 1e-6)));
  const fraction = raw / power;
  return (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * power;
}

function cart(c, x, y, massLabel) {
  c.save();
  c.translate(x, y);
  c.fillStyle = "#172530";
  c.fillRect(-39, -27, 78, 24);
  const body = c.createLinearGradient?.(-37, -65, 39, -28);
  body?.addColorStop(0, "#9aaab6");
  body?.addColorStop(.55, "#5b7080");
  body?.addColorStop(1, "#354958");
  c.fillStyle = body || "#5b7080";
  c.strokeStyle = "#b5c4cf";
  c.lineWidth = 1.5;
  c.beginPath();
  c.roundRect(-38, -68, 76, 42, 5);
  c.fill();
  c.stroke();
  c.fillStyle = orange;
  c.fillRect(-38, -68, 76, 5);
  for (const wheelX of [-26, 26]) {
    c.beginPath();
    c.arc(wheelX, -7, 11, 0, Math.PI * 2);
    c.fillStyle = "#091119";
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = "#8498a7";
    c.stroke();
    c.beginPath();
    c.arc(wheelX, -7, 3, 0, Math.PI * 2);
    c.fillStyle = "#d8e2e8";
    c.fill();
  }
  if (massLabel) label(c, massLabel, 0, -41, ink, 13, "center");
  c.restore();
}

function visibleCart(c, x, y, massLabel, compact) {
  c.save();
  c.translate(x, y);
  if (compact) c.scale(1.55, 1.55);
  cart(c, 0, 0, massLabel);
  c.restore();
}

function axis(c, camera, pixelsPerMetre, x0, x, compact) {
  segment(c, left, ground, right, ground, "#758896", 2);
  const halfSpan = (right - left) / (2 * pixelsPerMetre);
  const step = niceStep(halfSpan / 4);
  const worldToX = value => 400 + (value - camera) * pixelsPerMetre;
  const firstTick = Math.ceil((camera - halfSpan) / step) * step;
  for (let value = firstTick; value <= camera + halfSpan; value += step) {
    const sx = worldToX(value);
    if (sx < left || sx > right) continue;
    const isZero = Math.abs(value) < step * 1e-6;
    segment(c, sx, ground - 7, sx, ground + 8, isZero ? orange : "#78909e", isZero ? 2 : 1);
    if (!compact) label(c, Number(value.toFixed(2)), sx, ground + 28,
      isZero ? orange : muted, 11, "center");
  }
  label(c, "x (m)", right, ground + (compact ? 30 : 38), ink, compact ? 20 : 13, "right");
  const start = worldToX(x0);
  const current = worldToX(x);
  if (start >= left && start <= right) {
    segment(c, start, 170, start, ground - 10, "#31cfa477", 1, [5, 6]);
    if (!compact) label(c, `Boshlanish ${Number(x0.toFixed(2))} m`, start, 125, green, 12, "center");
  }
  if (Math.abs(x - x0) > 1e-8) {
    segment(c, clamp(start, left, right), ground - 13,
      clamp(current, left, right), ground - 13, orange, 3);
  }
  return current;
}

export function cartSceneGeometry(config, p, s) {
  const key = config.key;
  const x0 = key === "uniform" || key === "motion" ? p.x0 : 0;
  const x = Number.isFinite(s.x) ? s.x : x0;
  const pixelsPerMetre = key === "uniform" ? 4 : key === "newton" ? 9
    : key === "friction" ? 7 : 5;
  const visibleHalf = (right - left) / (2 * pixelsPerMetre);
  const camera = Math.abs(x) > visibleHalf * .68
    ? x - Math.sign(x) * visibleHalf * .68 : 0;
  return { x0, x, pixelsPerMetre, camera,
    position: clamp(400 + (x - camera) * pixelsPerMetre, left + 45, right - 45) };
}

/** Harakat sahnasidagi o'q sonlari hisoblangan koordinata bilan bir masshtabda. */
export function renderCartScene(c, { config, p, s, t, compact }) {
  c.clearRect(0, 0, W, H);
  c.fillStyle = "#0b1118";
  c.fillRect(0, 0, W, H);
  const key = config.key;
  const isUniform = key === "uniform";
  const isNewton = key === "newton";
  const isFriction = key === "friction";
  const { x0, x, pixelsPerMetre, camera, position } = cartSceneGeometry(config, p, s);
  axis(c, camera, pixelsPerMetre, x0, x, compact);

  if (isNewton && p.slope > 0) {
    // Qiyalik chizmasi fizik vektorlarga tegishli: F va ishqalanish sirt bo'ylab.
    const radians = p.slope * Math.PI / 180;
    c.save();
    c.translate(position, ground);
    c.rotate(-radians);
    segment(c, -115, 0, 115, 0, "#8a9ba8", 3);
    visibleCart(c, 0, 0, `${p.m} kg`, compact);
    const forceScale = 75 / Math.max(1, p.force, s.friction, p.m * 9.81);
    vector(c, 42, -53, p.force * forceScale, 0, orange, compact ? "" : `F = ${p.force} N`);
    if (s.friction > 0) vector(c, -42, -44, -Math.sign(s.driving) * s.friction * forceScale,
      0, blue, compact ? "" : `Fᵢ = ${s.friction.toFixed(1)} N`);
    c.restore();
    vector(c, position - 8, ground - 76, 0, Math.min(72, p.m * 9.81 * .9), blue,
      compact ? "" : `mg = ${(p.m * 9.81).toFixed(1)} N`);
    label(c, `Qiyalik ${p.slope}°`, left + 14, 77, muted, compact ? 19 : 13);
  } else {
    segment(c, left, ground + 3, right, ground + 3, "#1d2b36", 13);
    visibleCart(c, position, ground, isNewton || isFriction ? `${p.m} kg` : "", compact);
    if (isNewton) {
      const scale = 75 / Math.max(1, p.force, s.friction, p.m * 9.81);
      vector(c, position + 44, ground - 52, p.force * scale, 0, orange,
        compact ? "" : `F = ${p.force} N`);
      if (s.friction > 0) vector(c, position - 44, ground - 52,
        -Math.sign(s.driving) * s.friction * scale, 0, blue,
        compact ? "" : `Fᵢ = ${s.friction.toFixed(1)} N`);
    }
    if (isFriction && s.f > 0) {
      vector(c, position - 44, ground - 52,
        -Math.min(80, s.f * 1.2), 0, blue,
        compact ? "" : `Fᵢ = ${s.f.toFixed(1)} N`);
    }
  }

  const velocity = Number(s.v) || 0;
  const acceleration = Number(s.a) || 0;
  const vectorY = 197;
  vector(c, position, vectorY, clamp(velocity * 5, -105, 105), 0, blue,
    compact ? "" : `v = ${velocity.toFixed(2)} m/s`);
  if (!isUniform) vector(c, position, vectorY - 42,
    clamp(acceleration * 10, -95, 95), 0, green,
    compact ? "" : `a = ${acceleration.toFixed(2)} m/s²`);

  if (!compact) {
    label(c, config.title, left, 48, ink, 18);
    label(c, `t = ${t.toFixed(2)} s`, right, 48, muted, 13, "right");
    label(c, "Koordinata o'qi fizik masshtabda", left, 76, muted, 12);
  }
  const readoutY = isUniform ? 402 : 421;
  label(c, `x = ${x.toFixed(2)} m`, left + 12, readoutY, ink, compact ? 23 : 16);
  label(c, `v = ${velocity.toFixed(2)} m/s`, 400, readoutY, blue, compact ? 23 : 16, "center");
  label(c, isUniform ? `Yo'l = ${Number(s.distance || 0).toFixed(2)} m`
    : `a = ${acceleration.toFixed(2)} m/s²`, right - 12, readoutY, green,
    compact ? 23 : 16, "right");
}
