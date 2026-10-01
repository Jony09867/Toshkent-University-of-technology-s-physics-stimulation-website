import { clamp, projectile, resonance } from "../physics/engine.js";
import { uz } from "../i18n/uz.js";
import { format } from "../components/ResultCard.js";

/**
 * Canvas palette loaded from CSS custom properties to maintain dark/light
 * theme harmony across all simulations.
 */
const theme = {
  surface: "#080c12",
  grid: "#16202c",
  ink: "#f0f3f7",
  muted: "#8b9aa8",
  line: "#2a3642",
  floor: "#121a24",
  hatch: "#1e2a38",
};

let ink = theme.ink;
let muted = theme.muted;

export function readCanvasTheme(root = document.documentElement) {
  if (typeof getComputedStyle === "function" && root) {
    const styles = getComputedStyle(root);
    const read = (name, fallback) => {
      const value = styles.getPropertyValue(name).trim();
      return value || fallback;
    };
    theme.surface = read("--canvas-surface", theme.surface);
    theme.grid = read("--canvas-grid", theme.grid);
    theme.line = read("--canvas-line", theme.line);
    theme.floor = read("--canvas-floor", theme.floor);
    theme.hatch = read("--canvas-hatch", theme.hatch);
    ink = read("--canvas-ink", theme.ink);
    muted = read("--canvas-muted", theme.muted);
    theme.ink = ink;
    theme.muted = muted;
  }
  return theme;
}

// Curated high-contrast physics palette
const orange = "#f15b2b",
  blue = "#38bdf8",
  green = "#2dd4a3",
  red = "#f43f5e",
  amber = "#fbbf24",
  purple = "#a78bfa";

/* -------------------------------------------------------------------------- */
/*                               Drawing Primitives                           */
/* -------------------------------------------------------------------------- */

function line(c, x1, y1, x2, y2, color = ink, width = 2, dash = []) {
  c.beginPath();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.setLineDash(dash);
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.setLineDash([]);
}

function text(c, s, x, y, color = muted, size = 13, align = "left", weight = "500") {
  const readableSize = c.compactMode ? Math.min(size * 1.15, size + 3) : size;
  c.fillStyle = color;
  c.font = `${weight} ${readableSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  c.textAlign = align;
  c.fillText(s, x, y);
}

function badge(c, s, x, y, bgColor = "rgba(18,26,36,0.85)", textColor = ink, size = 12) {
  c.font = `600 ${size}px Inter, sans-serif`;
  const m = c.measureText(s);
  const padX = 7, padY = 4;
  const w = m.width + padX * 2;
  const h = size + padY * 2;
  rect(c, x - w / 2, y - h / 2, w, h, bgColor, 4);
  c.strokeStyle = "rgba(255,255,255,0.12)";
  c.lineWidth = 1;
  c.strokeRect(x - w / 2, y - h / 2, w, h);
  c.fillStyle = textColor;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(s, x, y + 1);
  c.textBaseline = "alphabetic";
}

function rect(c, x, y, w, h, color, r = 8) {
  c.fillStyle = color;
  c.beginPath();
  if (typeof c.roundRect === "function") {
    c.roundRect(x, y, w, h, r);
  } else {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    c.moveTo(x + radius, y);
    c.arcTo(x + w, y, x + w, y + h, radius);
    c.arcTo(x + w, y + h, x, y + h, radius);
    c.arcTo(x, y + h, x, y, radius);
    c.arcTo(x, y, x + w, y, radius);
    c.closePath();
  }
  c.fill();
}

function circle(c, x, y, r, color) {
  c.beginPath();
  c.fillStyle = color;
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

function arrow(c, x, y, dx, dy, color = red, label = "", width = 2.5) {
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  line(c, x, y, x + dx, y + dy, color, width);
  const a = Math.atan2(dy, dx);
  const headLen = Math.min(13, Math.max(7, len * 0.35));
  c.beginPath();
  c.fillStyle = color;
  c.moveTo(x + dx, y + dy);
  c.lineTo(x + dx - headLen * Math.cos(a - 0.42), y + dy - headLen * Math.sin(a - 0.42));
  c.lineTo(x + dx - headLen * Math.cos(a + 0.42), y + dy - headLen * Math.sin(a + 0.42));
  c.closePath();
  c.fill();

  if (label) {
    const offsetX = dx >= 0 ? 10 : -10;
    const offsetY = dy >= 0 ? 14 : -14;
    text(c, label, x + dx + offsetX, y + dy + (Math.abs(dy) < 5 ? -8 : offsetY), color, 13, dx >= 0 ? "left" : "right", "600");
  }
}

function measure(c, x1, y1, x2, y2, label, palette = theme) {
  line(c, x1, y1, x2, y2, palette.muted, 1.2, [4, 4]);
  // End ticks
  const isHoriz = Math.abs(y2 - y1) < Math.abs(x2 - x1);
  if (isHoriz) {
    line(c, x1, y1 - 5, x1, y1 + 5, palette.muted, 1.2);
    line(c, x2, y2 - 5, x2, y2 + 5, palette.muted, 1.2);
    text(c, label, (x1 + x2) / 2, (y1 + y2) / 2 - 7, palette.ink, 12, "center", "600");
  } else {
    line(c, x1 - 5, y1, x1 + 5, y1, palette.muted, 1.2);
    line(c, x2 - 5, y2, x2 + 5, y2, palette.muted, 1.2);
    text(c, label, (x1 + x2) / 2 + 10, (y1 + y2) / 2 + 4, palette.ink, 12, "left", "600");
  }
}

function grid(c, palette = theme) {
  c.clearRect(0, 0, 800, 460);
  c.fillStyle = palette.surface;
  c.fillRect(0, 0, 800, 460);
  // Grid lines and dots
  c.strokeStyle = palette.grid;
  c.lineWidth = 0.5;
  for (let x = 40; x < 800; x += 40) {
    line(c, x, 0, x, 460, palette.grid, 0.5);
  }
  for (let y = 40; y < 460; y += 40) {
    line(c, 0, y, 800, y, palette.grid, 0.5);
  }
  for (let x = 40; x < 800; x += 40) {
    for (let y = 40; y < 460; y += 40) {
      circle(c, x, y, 1.2, palette.line);
    }
  }
}

function floor(c, y = 342, palette = theme) {
  rect(c, 30, y, 740, 38, palette.floor, 0);
  line(c, 30, y, 770, y, palette.line, 2.5);
  for (let x = 40; x < 765; x += 22) {
    line(c, x, y + 4, x - 12, y + 18, palette.hatch, 1.2);
  }
}

function drawRuler(c, x1, y, x2, minVal, maxVal, step, unit) {
  line(c, x1, y, x2, y, theme.line, 1.5);
  const count = Math.round((maxVal - minVal) / step);
  const pxStep = (x2 - x1) / Math.max(1, count);
  for (let i = 0; i <= count; i++) {
    const px = x1 + i * pxStep;
    const isMajor = i % 5 === 0;
    line(c, px, y, px, y + (isMajor ? 8 : 4), isMajor ? theme.ink : theme.muted, 1);
    if (isMajor) {
      const val = minVal + i * step;
      text(c, `${val}`, px, y + 20, theme.muted, 10, "center");
    }
  }
}

function drawHandleGlow(c, x, y, radius = 22, color = orange) {
  c.save();
  c.beginPath();
  c.arc(x, y, radius + 4, 0, Math.PI * 2);
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.setLineDash([4, 4]);
  c.stroke();
  c.restore();
}

/* -------------------------------------------------------------------------- */
/*                            1. Cart & Friction                              */
/* -------------------------------------------------------------------------- */

function drawWheel(c, x, y, radius, rotation = 0) {
  // Outer tire
  circle(c, x, y, radius, "#1a2430");
  c.strokeStyle = "#3a4a5a";
  c.lineWidth = 2;
  c.stroke();
  // Rim
  circle(c, x, y, radius * 0.65, "#2a3644");
  // Hub
  circle(c, x, y, radius * 0.28, orange);
  // Spokes
  for (let i = 0; i < 4; i++) {
    const a = rotation + (i * Math.PI) / 2;
    line(c, x, y, x + Math.cos(a) * (radius - 2), y + Math.sin(a) * (radius - 2), "#5a6b7c", 1.5);
  }
}

function cart(c, p, s, key, hero = false) {
  const isSlope = key === "newton" && p.slope > 0;
  const isFriction = key === "friction";
  const end =
    key === "newton"
      ? Math.max(10, Math.abs(s.a) * 18)
      : isFriction
        ? Math.max(30, Number.isFinite(s.distance) ? s.distance : 80)
        : Math.max(80, Math.abs((p.v0 ?? 0) * 8 + (p.a ?? 0) * 32));
  const scale = 550 / end;
  const rawX = 130 + s.x * scale;
  const x = clamp(rawX, 75, 715);
  const cartWidth = 84;
  const cartHeight = 44;
  const wheelR = 12;

  if (isSlope) {
    const angleRad = (p.slope * Math.PI) / 180;
    const q = clamp(s.x * scale * 0.35, -170, 170);
    c.save();
    c.translate(400, 275);
    c.rotate(-angleRad);

    // Incline track
    rect(c, -320, 0, 640, 26, theme.floor, 0);
    line(c, -320, 0, 320, 0, theme.line, 3);
    for (let i = -310; i < 320; i += 24) {
      line(c, i, 4, i - 12, 18, theme.hatch, 1.2);
    }

    // Cart body
    rect(c, q - cartWidth / 2, -cartHeight - wheelR + 2, cartWidth, cartHeight, "#1e2c3a", 6);
    c.strokeStyle = orange;
    c.lineWidth = 1.5;
    c.strokeRect(q - cartWidth / 2, -cartHeight - wheelR + 2, cartWidth, cartHeight);

    // Stacked mass blocks on cart
    const blockCount = Math.min(4, Math.max(1, Math.round(p.m / 4)));
    for (let i = 0; i < blockCount; i++) {
      const bw = cartWidth - 20;
      const bh = 9;
      rect(c, q - bw / 2, -cartHeight - wheelR + 2 - (i + 1) * (bh + 2), bw, bh, "#33475b", 2);
    }

    // Wheels
    const rot = (s.x * scale) / wheelR;
    drawWheel(c, q - cartWidth / 2 + 18, -wheelR + 2, wheelR, rot);
    drawWheel(c, q + cartWidth / 2 - 18, -wheelR + 2, wheelR, rot);
    text(c, `${p.m} kg`, q, -cartHeight / 2 - wheelR + 5, ink, 13, "center", "600");

    // Force vectors on incline
    const fCenterY = -cartHeight / 2 - wheelR;
    // Applied Force F
    if (p.force > 0) {
      arrow(c, q + cartWidth / 2, fCenterY, p.force * 1.3, 0, orange, `F = ${format(p.force)} N`, 3);
    }
    // Friction
    if (s.friction > 0) {
      arrow(c, q - cartWidth / 2, fCenterY, -Math.min(90, s.friction * 2), 0, red, `F_ishq`, 2.5);
    }
    // Normal Force N (perpendicular upward)
    arrow(c, q, -cartHeight - wheelR, 0, -s.normal * 1.1, green, `N = ${format(s.normal)} N`, 2.5);
    // Gravity mg (straight down in world coords -> rotate opposite)
    const gLen = Math.min(100, p.m * 9.8 * 1.1);
    arrow(c, q, fCenterY, gLen * Math.sin(angleRad), gLen * Math.cos(angleRad), amber, `mg`, 2.5);

    // Velocity & Acceleration
    if (Math.abs(s.v) > 0.05) {
      arrow(c, q, -cartHeight - wheelR - 35, clamp(s.v * 6, -110, 110), 0, blue, `v = ${format(s.v)} m/s`, 2.5);
    }
    if (Math.abs(s.a) > 0.05) {
      arrow(c, q, -cartHeight - wheelR - 65, clamp(s.a * 14, -110, 110), 0, green, `a = ${format(s.a)} m/s²`, 2.5);
    }

    c.restore();

    // Slope angle arc at base
    c.save();
    c.translate(400 - 320 * Math.cos(angleRad), 275 + 320 * Math.sin(angleRad));
    c.beginPath();
    c.arc(0, 0, 48, 0, -angleRad, true);
    c.strokeStyle = orange;
    c.lineWidth = 2;
    c.stroke();
    text(c, `α = ${p.slope}°`, 56, -12, orange, 13, "left", "600");
    c.restore();
  } else {
    // Flat track
    floor(c, 342);
    drawRuler(c, 60, 375, 740, 0, Math.round(end), Math.max(1, Math.round(end / 10)), "m");

    const rot = (s.x * scale) / wheelR;
    const cartY = 342 - wheelR + 2;

    // Friction surface heat / contact roughness
    if (isFriction && p.mu > 0) {
      for (let i = 0; i < 68; i++) {
        circle(c, 45 + i * 10.5, 345 + (i % 3) * 4, 1 + p.mu * 1.5, "rgba(241,91,43,0.35)");
      }
      if (s.v > 0.2) {
        // Friction skid particles
        for (let i = 0; i < 4; i++) {
          circle(c, x - cartWidth / 2 - i * 8, 340, 2 - i * 0.4, orange);
        }
      }
    }

    // Cart body
    rect(c, x - cartWidth / 2, cartY - cartHeight, cartWidth, cartHeight, "#1a2532", 6);
    c.strokeStyle = orange;
    c.lineWidth = 1.8;
    c.strokeRect(x - cartWidth / 2, cartY - cartHeight, cartWidth, cartHeight);

    // Stacked mass blocks
    const massCount = Math.min(4, Math.max(1, Math.round((p.m ?? 5) / 4)));
    for (let i = 0; i < massCount; i++) {
      const bw = cartWidth - 20;
      const bh = 9;
      rect(c, x - bw / 2, cartY - cartHeight - (i + 1) * (bh + 2), bw, bh, "#2f4254", 2);
    }

    // Wheels with rotation
    drawWheel(c, x - cartWidth / 2 + 18, cartY, wheelR, rot);
    drawWheel(c, x + cartWidth / 2 - 18, cartY, wheelR, rot);

    text(c, `${p.m ?? 5} kg`, x, cartY - cartHeight / 2 + 4, ink, 14, "center", "600");

    // Force vectors
    const fY = cartY - cartHeight / 2;
    if (key === "newton" && p.force > 0) {
      arrow(c, x + cartWidth / 2, fY, p.force * 1.3, 0, orange, `F = ${format(p.force)} N`, 3);
      if (s.friction > 0) {
        arrow(c, x - cartWidth / 2, fY, -Math.min(100, s.friction * 2.5), 0, red, `F_ishq = ${format(s.friction)} N`, 2.5);
      }
    }

    if (isFriction) {
      if (s.f > 0) {
        arrow(c, x - cartWidth / 2, fY, -Math.min(110, s.f * 2.4), 0, red, `F_ishq = ${format(s.f)} N`, 2.5);
      }
      arrow(c, x, cartY - cartHeight, 0, -s.normal * 0.8, green, `N = ${format(p.normal)} N`, 2.5);
      arrow(c, x, cartY, 0, p.m * 9.8 * 0.8, amber, `mg`, 2.5);
    }

    // Kinematics vectors (Velocity & Acceleration)
    if (Math.abs(s.v) > 0.05) {
      arrow(c, x, 220, clamp(s.v * 5, -120, 120), 0, blue, `v = ${format(s.v)} m/s`, 2.8);
    }
    if (Math.abs(s.a) > 0.05) {
      arrow(c, x, 175, clamp(s.a * 12, -110, 110), 0, green, `a = ${format(s.a)} m/s²`, 2.8);
    }

    if (rawX < 75 || rawX > 715) {
      badge(c, `Jism sahnadan ${rawX > 715 ? "o‘ngda" : "chapda"}`, rawX > 715 ? 710 : 90, 120, "rgba(241,91,43,0.2)", orange);
    }
  }

  // Live telemetry summary along the bottom
  rect(c, 50, 410, 700, 36, "rgba(18,26,36,0.75)", 6);
  text(c, `x = ${format(s.x)} m`, 90, 432, ink, 15, "left", "600");
  text(c, `v = ${format(s.v)} m/s`, 360, 432, blue, 15, "center", "600");
  text(c, `a = ${format(s.a)} m/s²`, 640, 432, green, 15, "right", "600");
}

/* -------------------------------------------------------------------------- */
/*                            2. Projectile & Fall                            */
/* -------------------------------------------------------------------------- */

function flight(c, p, s, key, trails = []) {
  let maxX = Math.max(12, s.range * 1.15);
  let maxY = Math.max(8, s.height * 1.25);
  for (const tr of trails) {
    const v = projectile(tr);
    maxX = Math.max(maxX, v.range * 1.15);
    maxY = Math.max(maxY, v.height * 1.25);
  }
  const scale = Math.min(620 / maxX, 270 / maxY);
  const ox = 70;
  const oy = 360;

  floor(c, oy);

  // Axes
  line(c, ox, oy, ox, 45, theme.line, 2);
  line(c, ox, oy, 755, oy, theme.line, 2);
  text(c, "y (m)", ox - 10, 35, theme.muted, 12, "right", "600");
  text(c, "x (m)", 760, oy + 22, theme.muted, 12, "right", "600");

  // Y-axis tick marks
  for (let i = 1; i <= 4; i++) {
    const val = (i * maxY) / 4;
    const py = oy - val * scale;
    line(c, ox - 4, py, ox + 4, py, theme.muted, 1);
    line(c, ox, py, 750, py, theme.grid, 0.5, [3, 4]);
    text(c, format(val), ox - 10, py + 4, theme.muted, 11, "right");
  }

  // Trajectory tracing function
  const trace = (params, color, dash = [], label = "") => {
    const r = projectile(params);
    c.beginPath();
    c.setLineDash(dash);
    c.strokeStyle = color;
    c.lineWidth = 2.4;
    for (let i = 0; i <= 100; i++) {
      const v = projectile(params, (r.duration * i) / 100);
      const px = ox + v.x * scale;
      const py = oy - v.y * scale;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.stroke();
    c.setLineDash([]);
    if (label) {
      const mid = projectile(params, r.duration * 0.45);
      text(c, label, ox + mid.x * scale + 10, oy - mid.y * scale - 12, color, 11, "left", "600");
    }
  };

  // Saved trails
  trails.forEach((tr, i) => {
    trace(tr, ["#60a5fa", "#a3e635", "#c084fc"][i % 3], [5, 4]);
  });

  // Ideal vacuum trajectory comparison if drag > 0
  if (p.drag > 0) {
    trace({ ...p, drag: 0 }, "rgba(148,163,184,0.45)", [4, 4], "Vakuum (Qarshiliksiz)");
  }

  // Active path
  trace(p, orange, [], p.drag > 0 ? "Havo qarshiligi bilan" : "");

  // Launch platform if height > 0
  if (p.h > 0) {
    rect(c, 42, oy - p.h * scale, 28, p.h * scale, theme.floor, 3);
    line(c, 42, oy - p.h * scale, 70, oy - p.h * scale, theme.line, 2);
    text(c, `h = ${p.h}m`, 38, oy - (p.h * scale) / 2 + 4, theme.muted, 11, "right");
  }

  // Launcher cannon barrel
  const angleRad = ((p.angle ?? 45) * Math.PI) / 180;
  const launchY = oy - (p.h ?? 0) * scale;
  c.save();
  c.translate(ox, launchY);
  c.rotate(-angleRad);
  rect(c, -8, -6, 32, 12, "#334155", 3);
  c.strokeStyle = orange;
  c.lineWidth = 1.5;
  c.strokeRect(-8, -6, 32, 12);
  c.restore();

  // Angle arc
  c.beginPath();
  c.arc(ox, launchY, 26, 0, -angleRad, true);
  c.strokeStyle = amber;
  c.lineWidth = 1.8;
  c.stroke();
  text(c, `${p.angle ?? 45}°`, ox + 32, launchY - 8, amber, 11, "left", "600");

  // Apex (H_max) marker
  const apexX = ox + (s.range * 0.5) * scale;
  const apexY = oy - s.height * scale;
  line(c, apexX, oy, apexX, apexY, "rgba(241,91,43,0.4)", 1, [3, 3]);
  circle(c, apexX, apexY, 4, orange);
  text(c, `H_max = ${format(s.height)} m`, apexX, apexY - 12, orange, 13, "center", "600");

  // Moving projectile body
  const currentX = ox + s.x * scale;
  const currentY = oy - s.y * scale;

  // Ball glow
  circle(c, currentX, currentY, 14, "rgba(241,91,43,0.25)");
  circle(c, currentX, currentY, 9, orange);
  circle(c, currentX - 3, currentY - 3, 3, "rgba(255,255,255,0.7)");

  // Complete velocity vector triangle decomposition
  if (!s.landed && s.speed > 0.1) {
    const vScale = 2.2;
    // Component Vx
    arrow(c, currentX, currentY, s.vx * vScale, 0, "#60a5fa", "vx", 1.8);
    // Component Vy
    arrow(c, currentX + s.vx * vScale, currentY, 0, -s.vy * vScale, "#a78bfa", "vy", 1.8);
    // Resultant V
    arrow(c, currentX, currentY, s.vx * vScale, -s.vy * vScale, blue, `v = ${format(s.speed)} m/s`, 2.5);
  }

  // Target bullseye marker (Challenge target at 35m)
  const targetMeters = 35.0;
  if (key === "projectile") {
    const tgtX = ox + targetMeters * scale;
    if (tgtX < 755) {
      circle(c, tgtX, oy, 14, "rgba(244,63,94,0.25)");
      circle(c, tgtX, oy, 8, "rgba(244,63,94,0.6)");
      circle(c, tgtX, oy, 3, red);
      line(c, tgtX, oy, tgtX, oy - 24, red, 2);
      c.beginPath();
      c.moveTo(tgtX, oy - 24);
      c.lineTo(tgtX + 15, oy - 18);
      c.lineTo(tgtX, oy - 12);
      c.closePath();
      c.fillStyle = red;
      c.fill();
      text(c, "Nishon: 35m", tgtX + 4, oy - 28, red, 11, "left", "600");
    }
  }

  // Landing range target marker
  const landX = ox + s.range * scale;
  circle(c, landX, oy, 6, green);
  badge(c, `L = ${format(s.range)} m`, landX, oy + 26, "rgba(45,212,163,0.18)", green, 13);
}

/* -------------------------------------------------------------------------- */
/*                         3. Energy Conservation                             */
/* -------------------------------------------------------------------------- */

function track(c, p, s) {
  const ox = 400,
    oy = 345,
    scale = 40;

  // Smooth roller coaster parabolic track
  const trackPath = () => {
    c.beginPath();
    for (let q = -10; q <= 10; q += 0.1) {
      const px = ox + q * scale;
      const py = oy - ((q * q) / 24) * scale;
      q === -10 ? c.moveTo(px, py) : c.lineTo(px, py);
    }
  };

  // Support pillars
  for (let q = -8; q <= 8; q += 2) {
    const px = ox + q * scale;
    const py = oy - ((q * q) / 24) * scale;
    line(c, px, py + 4, px, 385, theme.hatch, 2);
  }

  // Base bed & Rails
  trackPath();
  c.lineWidth = 10;
  c.strokeStyle = theme.floor;
  c.stroke();

  trackPath();
  c.lineWidth = 2.5;
  c.strokeStyle = orange;
  c.stroke();

  // Datum ground line
  line(c, 50, oy, 750, oy, theme.line, 1, [4, 4]);
  text(c, "h = 0 (Sath)", 70, oy - 8, theme.muted, 11);

  // Moving particle / car
  const ballX = ox + s.q * scale;
  const ballY = oy - s.height * scale - 14;

  // Height measurement
  line(c, ballX, oy, ballX, ballY + 14, amber, 1.2, [3, 3]);
  text(c, `h = ${format(s.height)} m`, ballX + 12, (oy + ballY) / 2, amber, 12, "left", "600");

  // Sphere with gradient
  circle(c, ballX, ballY, 15, "rgba(56,189,248,0.2)");
  circle(c, ballX, ballY, 11, blue);
  circle(c, ballX - 3, ballY - 3, 3.5, "rgba(255,255,255,0.75)");

  // Velocity tangent vector
  if (Math.abs(s.v) > 0.05) {
    const slope = -s.q / 12;
    const angle = Math.atan(slope);
    const sign = s.v >= 0 ? 1 : -1;
    const arrowLen = Math.min(80, Math.abs(s.v) * 8);
    arrow(c, ballX, ballY, sign * arrowLen * Math.cos(angle), -sign * arrowLen * Math.sin(angle), green, `v = ${format(s.v)} m/s`, 2.5);
  }

  // Real-time Energy Conservation Bar Breakdown
  const total = Math.max(0.01, s.initial);
  const barX = 70, barY = 50, barW = 660, barH = 22;

  const kFrac = clamp(s.kinetic / total, 0, 1);
  const pFrac = clamp(s.potential / total, 0, 1);
  const qFrac = clamp(s.heat / total, 0, 1);

  rect(c, barX, barY, barW, barH, theme.floor, 4);

  // Kinetic
  rect(c, barX, barY, barW * kFrac, barH, blue, 4);
  // Potential
  rect(c, barX + barW * kFrac, barY, barW * pFrac, barH, green, 0);
  // Heat
  rect(c, barX + barW * (kFrac + pFrac), barY, barW * qFrac, barH, red, 4);

  c.strokeStyle = theme.line;
  c.lineWidth = 1.5;
  c.strokeRect(barX, barY, barW, barH);

  // Energy category badges
  text(c, `● Kinetik (Ek): ${format(s.kinetic)} J`, barX, barY - 14, blue, 13, "left", "600");
  text(c, `● Potensial (Ep): ${format(s.potential)} J`, barX + barW / 2, barY - 14, green, 13, "center", "600");
  text(c, `● Issiqlik (Q): ${format(s.heat)} J`, barX + barW, barY - 14, red, 13, "right", "600");

  badge(c, `E_jami = Ek + Ep + Q = ${format(s.initial)} J (Doimiy)`, 400, 430, "rgba(18,26,36,0.9)", ink, 14);
}

/* -------------------------------------------------------------------------- */
/*                        4. Harmonic Spring Pendulum                         */
/* -------------------------------------------------------------------------- */

function springDraw(c, p, s) {
  const x = 300;
  const top = 65;
  const bottom = 240 + s.x * 110;

  // Ceiling fixture with bolts
  line(c, 210, top, 390, top, ink, 6);
  for (let i = 220; i < 390; i += 22) {
    line(c, i, top - 12, i - 10, top, theme.hatch, 2);
  }
  line(c, x, top, x, top + 15, muted, 2.5);

  // Helical 3D coiled spring
  const coilCount = 20;
  const coilHeight = (bottom - top - 30) / coilCount;
  const springRadius = 18;
  const isTension = s.x > 0;
  const springColor = isTension ? blue : orange;

  c.lineWidth = 3.5;
  c.strokeStyle = springColor;
  c.beginPath();
  c.moveTo(x, top + 15);
  for (let i = 0; i < coilCount; i++) {
    const cy = top + 15 + (i + 0.5) * coilHeight;
    const isOdd = i % 2 === 1;
    c.lineTo(x + (isOdd ? springRadius : -springRadius), cy);
  }
  c.lineTo(x, bottom);
  c.stroke();

  // Mass block
  const blockW = 60, blockH = 46;
  rect(c, x - blockW / 2, bottom, blockW, blockH, "#1e293b", 6);
  c.strokeStyle = orange;
  c.lineWidth = 2;
  c.strokeRect(x - blockW / 2, bottom, blockW, blockH);
  text(c, `${p.m} kg`, x, bottom + blockH / 2 + 5, ink, 15, "center", "600");

  // Equilibrium Line x = 0
  const eqY = 240;
  line(c, 180, eqY, 620, eqY, "rgba(148,163,184,0.4)", 1.2, [5, 4]);
  text(c, "x = 0 (Muvozanat)", 630, eqY + 4, theme.muted, 12, "left");

  // Amplitude Limit Envelope (+A and -A)
  const ampPix = (p.amplitude ?? 0.4) * 110;
  line(c, 220, eqY - ampPix, 560, eqY - ampPix, "rgba(241,91,43,0.3)", 1, [3, 3]);
  line(c, 220, eqY + ampPix, 560, eqY + ampPix, "rgba(241,91,43,0.3)", 1, [3, 3]);
  text(c, "+A", 570, eqY + ampPix + 4, orange, 11, "left");
  text(c, "−A", 570, eqY - ampPix + 4, orange, 11, "left");

  // Vectors
  // Hooke's Restoring Force F = -kx
  const fHooke = -p.k * s.x;
  arrow(c, x, bottom + blockH / 2, 0, -clamp(s.x * 90, -110, 110), orange, `F_qaytaruvchi`, 2.5);

  // Velocity v
  if (Math.abs(s.v) > 0.02) {
    arrow(c, x + blockW / 2 + 15, bottom + blockH / 2, 0, clamp(s.v * 35, -100, 100), blue, `v = ${format(s.v)} m/s`, 2.5);
  }

  // Telemetry Dashboard Card on the right
  rect(c, 520, 70, 240, 200, "rgba(18,26,36,0.85)", 8);
  c.strokeStyle = theme.line;
  c.lineWidth = 1.2;
  c.strokeRect(520, 70, 240, 200);

  text(c, "HARMONIK TEBRANISH", 640, 95, theme.muted, 11, "center", "600");
  text(c, `T = ${format(s.period)} s`, 640, 135, ink, 24, "center", "700");
  text(c, `Siljish: x = ${format(s.x)} m`, 640, 170, blue, 14, "center", "600");
  text(c, `Chastotalik: ω = ${format(s.omega)} rad/s`, 640, 195, theme.muted, 13, "center");
  text(c, `Energiya: E = ${format(s.energy)} J`, 640, 220, green, 14, "center", "600");
}

/* -------------------------------------------------------------------------- */
/*                        5. Forced Resonance & Bridge                        */
/* -------------------------------------------------------------------------- */

function bridge(c, p, s, t) {
  const rawDisp = s.x * 60;
  const disp = clamp(rawDisp, -110, 110);

  // River and piers
  rect(c, 30, 360, 740, 50, "rgba(56,189,248,0.12)", 0);
  line(c, 30, 360, 770, 360, blue, 1.5);

  // Suspension bridge towers
  const t1x = 130, t2x = 670;
  line(c, t1x, 380, t1x, 140, "#475569", 14);
  line(c, t2x, 380, t2x, 140, "#475569", 14);
  // Cross bracing
  line(c, t1x - 7, 180, t1x + 7, 240, "#64748b", 3);
  line(c, t2x - 7, 180, t2x + 7, 240, "#64748b", 3);

  // Main suspension cable (parabola)
  c.beginPath();
  c.moveTo(60, 230);
  c.quadraticCurveTo(400, 310, 740, 230);
  c.strokeStyle = "#94a3b8";
  c.lineWidth = 3.5;
  c.stroke();

  // Dynamic Roadway Deck (with wave harmonic deformation)
  c.beginPath();
  c.moveTo(60, 245);
  c.quadraticCurveTo(400, 245 + disp * 1.8, 740, 245);
  c.lineWidth = 10;
  c.strokeStyle = Math.abs(disp) > 75 ? red : orange;
  c.stroke();

  // Vertical Hanger Suspenders
  for (let i = 0; i <= 16; i++) {
    const hx = 110 + i * 36.2;
    const q = (hx - 60) / 680;
    // Deck Y at hx
    const deckY = 245 + disp * 3.6 * q * (1 - q);
    // Cable Y at hx
    const cableY = 230 + 80 * Math.sin(((hx - 110) / 560) * Math.PI);
    line(c, hx, deckY, hx, cableY, theme.line, 1.5);
  }

  // Periodic Driving Force
  const fY = 245 + Math.cos(p.frequency * t) * 45;
  arrow(c, 745, 245, 0, Math.cos(p.frequency * t) * 45, amber, "F_majb", 2.5);

  // Inset Resonance Curve
  const rcX = 540, rcY = 50, rcW = 210, rcH = 100;
  rect(c, rcX, rcY, rcW, rcH, "rgba(18,26,36,0.9)", 6);
  c.strokeStyle = theme.line;
  c.lineWidth = 1;
  c.strokeRect(rcX, rcY, rcW, rcH);

  text(c, "REZONANS EGRI CHIZIG‘I", rcX + rcW / 2, rcY + 16, theme.muted, 10, "center", "600");
  line(c, rcX + 15, rcY + rcH - 15, rcX + rcW - 10, rcY + rcH - 15, theme.line, 1);
  line(c, rcX + 15, rcY + rcH - 15, rcX + 15, rcY + 25, theme.line, 1);

  // Draw theoretical resonance curve A(w)
  c.beginPath();
  c.strokeStyle = blue;
  c.lineWidth = 1.8;
  for (let px = 0; px <= rcW - 35; px += 2) {
    const curW = 0.1 + (px / (rcW - 35)) * 3;
    const rDenom = Math.sqrt((p.natural * p.natural - curW * curW) ** 2 + (2 * p.damping * curW) ** 2);
    const ampVal = (p.drive ?? 0.25) / Math.max(0.01, rDenom);
    const plotY = rcY + rcH - 15 - Math.min(rcH - 35, ampVal * 16);
    px === 0 ? c.moveTo(rcX + 15 + px, plotY) : c.lineTo(rcX + 15 + px, plotY);
  }
  c.stroke();

  // Current operating point on curve
  const currentPx = ((p.frequency - 0.1) / 3) * (rcW - 35);
  const currentPlotY = rcY + rcH - 15 - Math.min(rcH - 35, s.amplitude * 16);
  circle(c, rcX + 15 + currentPx, currentPlotY, 4, orange);

  // Frequency ratio & Amplitude banner
  const ratio = p.frequency / p.natural;
  const isNearResonance = Math.abs(ratio - 1) < 0.12;

  text(c, `Chastotalar nisbati: ω / ω₀ = ${format(ratio)}`, 400, 70, ink, 20, "center", "700");
  text(c, `Amplituda: A = ${format(s.amplitude)} m`, 400, 100, isNearResonance ? red : orange, 16, "center", "600");

  if (isNearResonance) {
    badge(c, "⚠️ REZONANS: MAKSIMAL AMBER TEBRANISH", 400, 130, "rgba(244,63,94,0.25)", red, 13);
  }
}

/* -------------------------------------------------------------------------- */
/*                       6. Archimedes Law & Buoyancy                         */
/* -------------------------------------------------------------------------- */

function water(c, p, s, t = 0) {
  const beakerX = 170;
  const beakerW = 340;
  const beakerTop = 110;
  const beakerBottom = 385;
  const baseWaterY = 185;

  // Liquid color based on density
  const fluidColor =
    p.fluid > 2000
      ? "rgba(148,163,184,0.4)" // Mercury
      : p.fluid < 950
        ? "rgba(251,191,36,0.3)" // Oil
        : "rgba(56,189,248,0.3)"; // Water

  // Water level rises slightly when submerged
  const displacedRise = clamp((s.immersed / (p.volume / 1000)) * 14, 0, 18);
  const waterY = baseWaterY - displacedRise;

  // Fluid body
  rect(c, beakerX, waterY, beakerW, beakerBottom - waterY, fluidColor, 0);

  // Beaker glass outline
  line(c, beakerX, beakerTop, beakerX, beakerBottom, "#64748b", 4);
  line(c, beakerX, beakerBottom, beakerX + beakerW, beakerBottom, "#64748b", 4);
  line(c, beakerX + beakerW, beakerTop, beakerX + beakerW, beakerBottom, "#64748b", 4);

  // Measurement graduations on beaker wall
  for (let y = beakerBottom - 30; y >= beakerTop + 20; y -= 35) {
    line(c, beakerX + 4, y, beakerX + 18, y, theme.muted, 1.5);
    text(c, `${Math.round((beakerBottom - y) * 8)} mL`, beakerX + 22, y + 4, theme.muted, 10);
  }

  // Waterline surface gentle sine ripples
  c.beginPath();
  c.moveTo(beakerX, waterY);
  for (let wx = beakerX; wx <= beakerX + beakerW; wx += 10) {
    const wave = Math.sin(t * 3.5 + wx * 0.05) * 1.5;
    c.lineTo(wx, waterY + wave);
  }
  c.strokeStyle = blue;
  c.lineWidth = 2.5;
  c.stroke();
  text(c, `Suyuqlik sathi (V_botgan: ${format(s.immersed * 1000)} L)`, beakerX + beakerW / 2, waterY - 8, blue, 12, "center", "600");

  // Floating body with gentle natural bobbing
  const blockW = 65, blockH = 65;
  const blockCenterX = beakerX + beakerW / 2;
  const bob = Math.sin(t * 3) * Math.min(2.5, Math.abs(s.depth - s.side));
  const blockY = waterY + (s.depth / s.side) * 60 + bob;

  rect(c, blockCenterX - blockW / 2, blockY - blockH / 2, blockW, blockH, "#334155", 6);
  c.strokeStyle = orange;
  c.lineWidth = 1.8;
  c.strokeRect(blockCenterX - blockW / 2, blockY - blockH / 2, blockW, blockH);
  text(c, `${p.rho} kg/m³`, blockCenterX, blockY + 5, ink, 12, "center", "600");

  // Force Vectors
  // Buoyant force Fa
  arrow(c, blockCenterX + 48, blockY, 0, -Math.min(110, (s.force / s.weight) * 70), blue, `F_A = ${format(s.force)} N`, 3);
  // Gravity mg
  arrow(c, blockCenterX - 48, blockY, 0, 70, red, `mg = ${format(s.weight)} N`, 3);
  // Normal force N if on bottom
  if (s.normal > 0) {
    arrow(c, blockCenterX, blockY + blockH / 2, 0, -55, green, `N = ${format(s.normal)} N`, 2.5);
  }

  // State Card on the right
  const cardX = 540, cardY = 140;
  rect(c, cardX, cardY, 220, 180, "rgba(18,26,36,0.85)", 8);
  c.strokeStyle = theme.line;
  c.lineWidth = 1.2;
  c.strokeRect(cardX, cardY, 220, 180);

  const statusMap = {
    float: "SUZMOQDA (ρ_jism < ρ_suyuqlik)",
    neutral: "MUVOZANATDA (ρ_jism = ρ_suyuqlik)",
    sink: "CHO‘KMOQDA (ρ_jism > ρ_suyuqlik)",
  };
  text(c, "SUZISH HOLATI", cardX + 110, cardY + 28, theme.muted, 11, "center", "600");
  text(c, uz.floating[s.status] || statusMap[s.status], cardX + 110, cardY + 65, s.status === "float" ? green : s.status === "neutral" ? blue : red, 17, "center", "700");
  text(c, `F_A = ${format(s.force)} N`, cardX + 110, cardY + 105, blue, 15, "center", "600");
  text(c, `Og‘irlik = ${format(s.weight)} N`, cardX + 110, cardY + 130, red, 14, "center");
  if (s.onBottom) {
    badge(c, "Jism idish tubida yotibdi", cardX + 110, cardY + 160, "rgba(45,212,163,0.18)", green, 11);
  }
}

/* -------------------------------------------------------------------------- */
/*                         7. Gas Laws (P*V = n*R*T)                          */
/* -------------------------------------------------------------------------- */

const gasParticles = Array.from({ length: 90 }, (_, i) => ({
  x: ((i * 37 + 13) % 97) / 97,
  y: ((i * 61 + 7) % 99) / 99,
  angle: i * 2.39996,
  speedFactor: 0.5 + ((i * 19) % 13) / 13,
}));

function gasDraw(c, p, s, t) {
  const w = 230 + (270 * (p.volume - 5)) / 45;
  const x = (800 - w) / 2;
  const y = 95;
  const h = 245;

  // Cylinder body
  rect(c, x, y, w, h, theme.floor, 6);
  c.strokeStyle = theme.line;
  c.lineWidth = 3;
  c.strokeRect(x, y, w, h);

  // Volume graduation ruler on top of cylinder
  line(c, x, y - 10, x + w, y - 10, theme.line, 1.5);
  text(c, `V = ${p.volume} L`, x + w / 2, y - 20, blue, 15, "center", "600");

  // Bunsen Burner Flame underneath cylinder
  const burnerX = 400;
  const burnerY = y + h + 15;
  const flameH = Math.min(50, 15 + (p.temperature / 800) * 35);
  const flameW = 45;
  const flameFlicker = Math.sin(t * 18) * 3;

  c.save();
  const flameGrad = c.createLinearGradient(burnerX, burnerY + flameH, burnerX, burnerY);
  flameGrad.addColorStop(0, "rgba(56,189,248,0.2)");
  flameGrad.addColorStop(0.5, p.temperature > 400 ? orange : blue);
  flameGrad.addColorStop(1, p.temperature > 500 ? amber : "#e0f2fe");

  c.beginPath();
  c.moveTo(burnerX - flameW / 2, burnerY + flameH);
  c.quadraticCurveTo(burnerX - flameW / 4, burnerY + 5, burnerX + flameFlicker, burnerY);
  c.quadraticCurveTo(burnerX + flameW / 4, burnerY + 5, burnerX + flameW / 2, burnerY + flameH);
  c.closePath();
  c.fillStyle = flameGrad;
  c.fill();
  c.restore();

  text(c, `T = ${p.temperature} K`, burnerX, burnerY + flameH + 18, orange, 14, "center", "600");

  // Moving Piston Head
  const pistonW = 18;
  const pistonX = x + w - pistonW;
  rect(c, pistonX, y - 8, pistonW, h + 16, "#475569", 3);
  c.strokeStyle = orange;
  c.lineWidth = 1.5;
  c.strokeRect(pistonX, y - 8, pistonW, h + 16);
  // Piston Rod
  rect(c, pistonX + pistonW, y + h / 2 - 8, 140, 16, "#64748b", 2);

  // Pressure gauge dial on top
  const gaugeX = x + 40, gaugeY = y - 40, gaugeR = 26;
  circle(c, gaugeX, gaugeY, gaugeR, "rgba(18,26,36,0.9)");
  c.strokeStyle = theme.line;
  c.lineWidth = 2;
  c.stroke();
  const pressKPa = s.pressure / 1000;
  const needleAngle = -Math.PI * 0.8 + Math.min(1, pressKPa / 800) * Math.PI * 1.6;
  line(c, gaugeX, gaugeY, gaugeX + Math.cos(needleAngle) * (gaugeR - 6), gaugeY + Math.sin(needleAngle) * (gaugeR - 6), red, 2);
  circle(c, gaugeX, gaugeY, 3, ink);
  text(c, "MANOMETR", gaugeX, gaugeY - gaugeR - 6, theme.muted, 10, "center");

  // Gas particles bouncing inside
  const count = Math.round(30 + Math.min(3, p.moles) * 20);
  const vel = 42 * Math.sqrt(p.temperature / 300) * Math.sqrt(0.028 / (p.molarMass ?? 0.028));
  const bounce = (v, max) => {
    const period = 2 * max;
    const z = ((v % period) + period) % period;
    return z > max ? period - z : z;
  };

  const insideW = w - pistonW - 14;
  const insideH = h - 14;
  for (let i = 0; i < count; i++) {
    const seed = gasParticles[i];
    const px = x + 7 + bounce(seed.x * insideW + Math.cos(seed.angle) * vel * seed.speedFactor * t, insideW);
    const py = y + 7 + bounce(seed.y * insideH + Math.sin(seed.angle) * vel * seed.speedFactor * t, insideH);
    const isHot = seed.speedFactor > 0.95;
    circle(c, px, py, 3.8, isHot ? orange : blue);
  }

  // Telemetry banner
  badge(c, `p = ${format(s.pressure / 1000)} kPa | V = ${p.volume} L | T = ${p.temperature} K`, 400, 430, "rgba(18,26,36,0.9)", ink, 14);
}

/* -------------------------------------------------------------------------- */
/*                           8. Coulomb's Law                                 */
/* -------------------------------------------------------------------------- */

function charges(c, p, s, t = 0) {
  const d = 80 + p.r * 135;
  const x1 = 400 - d / 2;
  const x2 = 400 + d / 2;
  const y = 230;

  // Electric field lines (numerical dipole approximation)
  const lineCount = 14;
  const sign1 = Math.sign(p.q1) || 1;
  const sign2 = Math.sign(p.q2) || 1;
  const isOpposite = sign1 !== sign2;

  c.lineWidth = 1.2;
  for (let i = 0; i < lineCount; i++) {
    const startAngle = (i / lineCount) * Math.PI * 2;
    c.beginPath();
    c.strokeStyle = isOpposite ? "rgba(56,189,248,0.22)" : "rgba(241,91,43,0.18)";
    let cx = x1 + Math.cos(startAngle) * 32;
    let cy = y + Math.sin(startAngle) * 32;
    c.moveTo(cx, cy);

    const beadStep = Math.floor((t * 20 + i * 2.5) % 36);

    for (let step = 0; step < 36; step++) {
      const r1sq = Math.max(200, (cx - x1) ** 2 + (cy - y) ** 2);
      const r2sq = Math.max(200, (cx - x2) ** 2 + (cy - y) ** 2);
      const ex = (p.q1 * (cx - x1)) / (r1sq * Math.sqrt(r1sq)) + (p.q2 * (cx - x2)) / (r2sq * Math.sqrt(r2sq));
      const ey = (p.q1 * (cy - y)) / (r1sq * Math.sqrt(r1sq)) + (p.q2 * (cy - y)) / (r2sq * Math.sqrt(r2sq));
      const eMag = Math.hypot(ex, ey) || 1;
      cx += (ex / eMag) * 9 * sign1;
      cy += (ey / eMag) * 9 * sign1;
      if (Math.hypot(cx - x2, cy - y) < 28 || cx < 20 || cx > 780 || cy < 20 || cy > 440) break;
      c.lineTo(cx, cy);

      if (step === beadStep && (p.q1 !== 0 || p.q2 !== 0)) {
        circle(c, cx, cy, 2.5, isOpposite ? "#38bdf8" : "#f97316");
      }
    }
    c.stroke();
  }

  // Draw Spherical Charges with halos and live quantum breathing pulse
  const drawCharge = (cx, q, name) => {
    const isPos = q > 0;
    const isNeg = q < 0;
    const qColor = isPos ? orange : isNeg ? blue : muted;
    const pulse = Math.sin(t * 4) * 2;
    // Glow halo
    circle(c, cx, y, 48 + pulse, isPos ? "rgba(241,91,43,0.15)" : isNeg ? "rgba(56,189,248,0.15)" : "transparent");
    circle(c, cx, y, 32 + pulse * 0.5, qColor);
    circle(c, cx - 8, y - 8, 8, "rgba(255,255,255,0.45)");
    text(c, isPos ? "+" : isNeg ? "−" : "0", cx, y + 10, "#ffffff", 32, "center", "700");
    text(c, `${name}: ${q} μC`, cx, y + 54, ink, 14, "center", "600");
  };

  drawCharge(x1, p.q1, "q1");
  drawCharge(x2, p.q2, "q2");

  // Mutual Coulomb Force Vectors
  let forceLen = Math.min(105, 30 + Math.log1p(s.force) * 65);
  if (s.force > 0) {
    const sign = Math.sign(s.signed);
    if (sign < 0) forceLen = Math.min(forceLen, (d - 75) / 2);
    // Left charge force
    arrow(c, x1 - 35 * sign, y, -forceLen * sign, 0, red, `F_12 = ${format(s.force)} N`, 3);
    // Right charge force
    arrow(c, x2 + 35 * sign, y, forceLen * sign, 0, red, `F_21 = ${format(s.force)} N`, 3);
  }

  // Distance ruler
  measure(c, x1, 135, x2, 135, `r = ${p.r} m`);

  // Force nature label
  const natureText = s.force === 0 ? uz.zeroForce : s.signed > 0 ? "ITIRIShISH KUCHI (Bir xil ishorali)" : "TORTISHISH KUCHI (Qarama-qarshi)";
  badge(c, natureText, 400, 390, "rgba(18,26,36,0.9)", s.signed > 0 ? orange : blue, 14);
}

/* -------------------------------------------------------------------------- */
/*                        9. Ohm's Law & Circuit                              */
/* -------------------------------------------------------------------------- */

function electrical(c, p, s, key, t) {
  const x = 180, y = 135, w = 440, h = 195;

  // PCB Circuit Board Wire Loop
  c.strokeStyle = "#475569";
  c.lineWidth = 5;
  c.strokeRect(x, y, w, h);

  // DC Power Source on Left Wire
  rect(c, x - 12, y + h / 2 - 32, 24, 64, theme.surface, 0);
  line(c, x - 26, y + h / 2 - 14, x + 26, y + h / 2 - 14, orange, 4);
  line(c, x - 14, y + h / 2 + 14, x + 14, y + h / 2 + 14, blue, 4);
  text(c, "+", x - 34, y + h / 2 - 10, orange, 18, "right", "700");
  text(c, "−", x - 34, y + h / 2 + 18, blue, 18, "right", "700");
  text(c, `${key === "ohm" ? p.voltage : p.emf} V`, x - 35, y + h / 2 + 45, ink, 15, "right", "600");

  // Internal resistance box if circuit mode
  if (key === "circuit" && p.internal > 0) {
    rect(c, x - 35, y + h / 2 - 75, 70, 26, "rgba(241,91,43,0.18)", 4);
    text(c, `r = ${p.internal} Ω`, x, y + h / 2 - 58, orange, 11, "center", "600");
  }

  // Resistor on Top Wire
  rect(c, 340, y - 18, 120, 36, "#334155", 4);
  c.strokeStyle = amber;
  c.lineWidth = 1.5;
  c.strokeRect(340, y - 18, 120, 36);
  // Resistor Color Bands
  line(c, 360, y - 18, 360, y + 18, orange, 3);
  line(c, 375, y - 18, 375, y + 18, blue, 3);
  line(c, 390, y - 18, 390, y + 18, amber, 3);
  text(c, `R = ${p.resistance} Ω`, 400, y - 26, ink, 14, "center", "600");

  // Incandescent Light Bulb on Right Wire
  const bulbX = x + w;
  const bulbY = y + h / 2;
  const glowIntensity = clamp(s.power / 25, 0, 1);

  // Radial bulb glow
  if (glowIntensity > 0.05) {
    const glowGrad = c.createRadialGradient(bulbX, bulbY, 10, bulbX, bulbY, 70 * glowIntensity);
    glowGrad.addColorStop(0, "rgba(251,191,36,0.75)");
    glowGrad.addColorStop(0.5, "rgba(251,191,36,0.2)");
    glowGrad.addColorStop(1, "transparent");
    circle(c, bulbX, bulbY, 70 * glowIntensity, glowGrad);
  }

  // Glass envelope
  circle(c, bulbX, bulbY, 32, "rgba(251,191,36,0.15)");
  c.strokeStyle = "#fbbf24";
  c.lineWidth = 2;
  c.stroke();
  // Filament inside
  line(c, bulbX - 12, bulbY - 14, bulbX + 12, bulbY + 14, glowIntensity > 0.2 ? amber : "#64748b", 2.2);
  line(c, bulbX + 12, bulbY - 14, bulbX - 12, bulbY + 14, glowIntensity > 0.2 ? amber : "#64748b", 2.2);
  text(c, `${format(s.power)} W`, bulbX + 44, bulbY + 5, amber, 13, "left", "600");

  // Animated Electrons Flowing around the circuit
  if (s.current > 0.01) {
    const loopPerimeter = 2 * (w + h);
    const speed = clamp(s.current * 70, 15, 300);
    const electronCount = 18;

    for (let i = 0; i < electronCount; i++) {
      const dist = ((i / electronCount) * loopPerimeter + t * speed) % loopPerimeter;
      let px, py;
      if (dist < w) {
        px = x + dist;
        py = y;
      } else if (dist < w + h) {
        px = x + w;
        py = y + (dist - w);
      } else if (dist < 2 * w + h) {
        px = x + w - (dist - (w + h));
        py = y + h;
      } else {
        px = x;
        py = y + h - (dist - (2 * w + h));
      }
      circle(c, px, py, 3.5, blue);
    }
  }

  // Telemetry footer
  badge(c, `Tok kuchi: I = ${format(s.current)} A  |  Kuchlanish: U = ${format(s.voltage ?? p.voltage)} V  |  Quvvat: P = ${format(s.power)} W`, 400, 425, "rgba(18,26,36,0.9)", ink, 14);
}

/* -------------------------------------------------------------------------- */
/*                       10. Electromagnetic Induction                        */
/* -------------------------------------------------------------------------- */

function magnet(c, p, s, t) {
  const coilX = 420;
  const coilY = 210;

  // 3D Copper Solenoid Coil Windings
  const turnCount = 8;
  for (let i = 0; i < turnCount; i++) {
    c.beginPath();
    c.ellipse(coilX + i * 14, coilY, 14, 62, 0, 0, Math.PI * 2);
    c.strokeStyle = i % 2 === 0 ? "#ea580c" : "#b45309";
    c.lineWidth = 4;
    c.stroke();
  }

  // Moving Permanent Bar Magnet
  const mx = 410 + s.x * 130;
  const my = 210;
  const barW = 65, barH = 44;

  // North pole (Red)
  rect(c, mx - barW, my - barH / 2, barW, barH, red, 4);
  text(c, "N", mx - barW / 2, my + 6, "#ffffff", 20, "center", "700");

  // South pole (Blue)
  rect(c, mx, my - barH / 2, barW, barH, blue, 4);
  text(c, "S", mx + barW / 2, my + 6, "#ffffff", 20, "center", "700");

  // Magnetic field lines loops around magnet
  c.strokeStyle = "rgba(244,63,94,0.25)";
  c.lineWidth = 1.2;
  for (let r = 30; r <= 60; r += 15) {
    c.beginPath();
    c.ellipse(mx, my, barW + r, r, 0, 0, Math.PI * 2);
    c.stroke();
  }

  // Velocity vector of magnet
  if (Math.abs(s.velocity) > 0.05) {
    arrow(c, mx, my - 45, s.velocity * 32, 0, blue, `v = ${format(s.velocity)} m/s`, 2.5);
  }

  // Connecting wires to Galvanometer
  line(c, coilX, coilY + 62, coilX, 335, theme.muted, 2);
  line(c, coilX + (turnCount - 1) * 14, coilY + 62, coilX + (turnCount - 1) * 14, 335, theme.muted, 2);

  // Center-Zero Galvanometer Instrument
  const gX = 470, gY = 345, gR = 40;
  circle(c, gX, gY, gR, "rgba(18,26,36,0.95)");
  c.strokeStyle = theme.line;
  c.lineWidth = 2;
  c.stroke();

  // Dial scale (-G ... 0 ... +G)
  const needleAngle = -Math.PI / 2 + clamp(s.current * 18, -1.1, 1.1);
  line(c, gX, gY, gX + Math.cos(needleAngle) * (gR - 8), gY + Math.sin(needleAngle) * (gR - 8), orange, 2.5);
  circle(c, gX, gY, 4, ink);

  text(c, "−", gX - 25, gY - 6, blue, 13, "center", "700");
  text(c, "0", gX, gY - 24, theme.muted, 11, "center");
  text(c, "+", gX + 25, gY - 6, red, 13, "center", "700");
  text(c, "GALVANOMETR", gX, gY + gR + 16, theme.muted, 11, "center", "600");

  // Telemetry badge
  badge(c, `Induksiya EYK: ε = ${format(s.emf)} V  |  Induksion tok: I = ${format(s.current)} A`, 400, 75, "rgba(18,26,36,0.9)", ink, 14);
}

/* -------------------------------------------------------------------------- */
/*                            11. Thin Lens Optics                            */
/* -------------------------------------------------------------------------- */

function optics(c, p, s, t = 0) {
  const ox = 400,
    oy = 245;
  const extent = Math.max(
    3,
    p.object,
    Number.isFinite(s.image) ? Math.min(10, Math.abs(s.image)) : 3,
  );
  const scale = 320 / extent;
  const dx = -p.object * scale;
  const h = p.height * scale * 2.2;
  const ix = s.image * scale;
  const ih = -s.magnification * h;

  // Optical bench axis
  line(c, 40, oy, 760, oy, theme.line, 1.8);
  text(c, "Bosh optik o‘q", 760, oy + 18, theme.muted, 11, "right");

  // Glass Biconvex Lens Body
  c.beginPath();
  c.ellipse(ox, oy, 16, 155, 0, 0, Math.PI * 2);
  c.fillStyle = "rgba(56,189,248,0.18)";
  c.fill();
  c.strokeStyle = blue;
  c.lineWidth = 2.2;
  c.stroke();
  // Lens center vertical reference
  line(c, ox, oy - 165, ox, oy + 165, "rgba(56,189,248,0.4)", 1, [4, 4]);
  text(c, "O (Markaz)", ox, oy - 170, blue, 11, "center");

  // Focal points on both sides (F, 2F, F', 2F')
  const fPix = p.focal * scale;
  const drawFocalPoint = (sign, label) => {
    const fx = ox + sign * fPix;
    circle(c, fx, oy, 4, blue);
    text(c, label, fx, oy + 22, blue, 12, "center", "600");

    const f2x = ox + sign * 2 * fPix;
    if (Math.abs(f2x - ox) < 350) {
      circle(c, f2x, oy, 3.5, theme.muted);
      text(c, `2${label}`, f2x, oy + 22, theme.muted, 11, "center");
    }
  };

  drawFocalPoint(-1, "F");
  drawFocalPoint(1, "F'");

  // Object Arrow (Orange)
  const objX = ox + dx;
  const objTopY = oy - h;
  arrow(c, objX, oy, 0, -h, orange, `Predmet (h = ${format(p.height)}m)`, 3);

  // Subtle pulsing emission rings from object tip
  const pulseR = (t * 35) % 40;
  circle(c, objX, objTopY, pulseR, "rgba(241,91,43,0.12)");

  // 1. Principal Ray 1: Parallel to axis -> through rear focus F'
  line(c, objX, objTopY, ox, objTopY, orange, 1.8);
  const slope1 = h / fPix;
  line(c, ox, objTopY, 760, objTopY + slope1 * (760 - ox), orange, 1.8);

  // 2. Principal Ray 2: Through optical center O undeflected
  const slope2 = (oy - objTopY) / (ox - objX);
  line(c, objX, objTopY, 760, oy + slope2 * (760 - ox), green, 1.8);

  // Animated photon pulses along Ray 1 and Ray 2
  const raySpeed = 160;
  for (let k = 0; k < 3; k++) {
    const pDist = (t * raySpeed + k * 120) % (ox - objX + (760 - ox));
    let r1x, r1y, r2x, r2y;
    if (pDist < (ox - objX)) {
      r1x = objX + pDist;
      r1y = objTopY;
      r2x = objX + pDist;
      r2y = objTopY + slope2 * pDist;
    } else {
      const extra = pDist - (ox - objX);
      r1x = ox + extra;
      r1y = objTopY + slope1 * extra;
      r2x = ox + extra;
      r2y = oy + slope2 * extra;
    }
    if (r1x < 755) circle(c, r1x, r1y, 3, "#facc15");
    if (r2x < 755) circle(c, r2x, r2y, 3, "#4ade80");
  }

  // Image Arrow & Virtual ray extensions
  if (!s.atFocus) {
    if (s.real) {
      // Real inverted image
      if (Math.abs(ix) < 350 && Math.abs(ih) < 180) {
        arrow(c, ox + ix, oy, 0, ih, blue, `Tasvir (f = ${format(s.image)}m)`, 3);
        const imgPulse = (t * 35 + 20) % 40;
        circle(c, ox + ix, oy + ih, imgPulse, "rgba(56,189,248,0.12)");
      }
    } else {
      // Virtual erect image: draw dashed backwards extensions
      line(c, ox, objTopY, ox + ix, oy + ih, orange, 1.5, [4, 4]);
      line(c, ox, oy, ox + ix, oy + ih, green, 1.5, [4, 4]);
      if (Math.abs(ix) < 350 && Math.abs(ih) < 180) {
        arrow(c, ox + ix, oy, 0, ih, "#a78bfa", `Mavhum tasvir`, 2.5);
      }
    }
  }

  // Optical nature classification banner
  const nature = s.atFocus
    ? "Fokusda: Tasvir cheksizlikda hosil bo‘ladi"
    : `${s.real ? "Haqiqiy" : "Mavhum"} · ${s.magnification < 0 ? "To‘ntarilgan" : "To‘g‘ri"} · ${Math.abs(s.magnification) > 1 ? "Kattalashtirilgan" : "Kichraytirilgan"} (k = ${format(Math.abs(s.magnification))}×)`;

  badge(c, nature, 400, 425, "rgba(18,26,36,0.9)", s.real ? green : purple, 14);
}

/* -------------------------------------------------------------------------- */
/*                            12. Statics & Lever                             */
/* -------------------------------------------------------------------------- */

function leverDraw(c, p, s, t = 0) {
  const ox = 400, oy = 280;
  const fulcrumW = 44, fulcrumH = 50;

  // Triangular fulcrum pivot stand
  c.beginPath();
  c.moveTo(ox, oy);
  c.lineTo(ox - fulcrumW / 2, oy + fulcrumH);
  c.lineTo(ox + fulcrumW / 2, oy + fulcrumH);
  c.closePath();
  c.fillStyle = "#334155";
  c.fill();
  c.strokeStyle = orange;
  c.lineWidth = 2;
  c.stroke();
  circle(c, ox, oy, 5, ink);

  // Ground base
  floor(c, oy + fulcrumH);

  // Lever beam rotated by dynamic damped tilt angle
  const wobble = Math.sin(t * 3.5) * Math.exp(-Math.min(t, 5) * 0.5) * 3.5;
  const dynTilt = (s.tilt ?? 0) + wobble;
  const tiltRad = (dynTilt * Math.PI) / 180;
  const maxL = Math.max(p.l1, p.l2, 2);
  const pxScale = 260 / maxL;
  const beamLeft = p.l1 * pxScale;
  const beamRight = p.l2 * pxScale;

  c.save();
  c.translate(ox, oy);
  c.rotate(tiltRad);

  // Beam bar with steel gradient
  rect(c, -beamLeft - 10, -8, beamLeft + beamRight + 20, 16, "#1e293b", 4);
  c.strokeStyle = "#64748b";
  c.lineWidth = 1.8;
  c.strokeRect(-beamLeft - 10, -8, beamLeft + beamRight + 20, 16);

  // Graduation tick marks on beam
  for (let d = 0.2; d <= maxL; d += 0.2) {
    if (d <= p.l1) {
      const tx = -d * pxScale;
      line(c, tx, -6, tx, 6, theme.muted, 1);
    }
    if (d <= p.l2) {
      const tx = d * pxScale;
      line(c, tx, -6, tx, 6, theme.muted, 1);
    }
  }

  // Left load (hanging)
  const leftX = -beamLeft;
  const block1W = 38 + Math.min(26, p.m1 * 1.3);
  const block1H = 34 + Math.min(20, p.m1);
  line(c, leftX, 8, leftX, 40, theme.line, 2);
  rect(c, leftX - block1W / 2, 40, block1W, block1H, "#1e293b", 4);
  c.strokeStyle = orange;
  c.lineWidth = 1.8;
  c.strokeRect(leftX - block1W / 2, 40, block1W, block1H);
  text(c, `${p.m1} kg`, leftX, 40 + block1H / 2 + 5, ink, 12, "center", "600");

  // Right load (hanging)
  const rightX = beamRight;
  const block2W = 38 + Math.min(26, p.m2 * 1.3);
  const block2H = 34 + Math.min(20, p.m2);
  line(c, rightX, 8, rightX, 40, theme.line, 2);
  rect(c, rightX - block2W / 2, 40, block2W, block2H, "#1e293b", 4);
  c.strokeStyle = blue;
  c.lineWidth = 1.8;
  c.strokeRect(rightX - block2W / 2, 40, block2W, block2H);
  text(c, `${p.m2} kg`, rightX, 40 + block2H / 2 + 5, ink, 12, "center", "600");

  // Force vectors
  arrow(c, leftX, 40 + block1H, 0, Math.min(80, p.m1 * 3.8), orange, `F₁ = ${format(p.m1 * 9.8)} N`, 2.5);
  arrow(c, rightX, 40 + block2H, 0, Math.min(80, p.m2 * 3.8), blue, `F₂ = ${format(p.m2 * 9.8)} N`, 2.5);

  c.restore();

  // Arm dimension markers
  measure(c, ox - beamLeft, oy - 45, ox, oy - 45, `l₁ = ${p.l1} m`);
  measure(c, ox, oy - 45, ox + beamRight, oy - 45, `l₂ = ${p.l2} m`);

  // Torque moment curved arrows
  c.save();
  c.beginPath();
  c.arc(ox - 35, oy - 15, 22, Math.PI * 0.4, Math.PI * 1.3);
  c.strokeStyle = orange;
  c.lineWidth = 2.5;
  c.stroke();
  text(c, `M₁ = ${format(s.mLeft)} N·m`, ox - 95, oy - 25, orange, 12, "center", "600");

  c.beginPath();
  c.arc(ox + 35, oy - 15, 22, -Math.PI * 0.3, Math.PI * 0.6);
  c.strokeStyle = blue;
  c.lineWidth = 2.5;
  c.stroke();
  text(c, `M₂ = ${format(s.mRight)} N·m`, ox + 95, oy - 25, blue, 12, "center", "600");
  c.restore();

  // Status banner
  const isBal = s.balanced;
  const statusMsg = isBal
    ? "⚖️ MUVOZANATDA: M₁ = M₂ (Richag gorizontal)"
    : s.netTorque > 0
      ? `Chap tomon og‘gan (ΔM = +${format(s.netTorque)} N·m)`
      : `O‘ng tomon og‘gan (ΔM = ${format(s.netTorque)} N·m)`;
  badge(c, statusMsg, ox, 65, "rgba(18,26,36,0.9)", isBal ? green : orange, 14);
}

/* -------------------------------------------------------------------------- */
/*                         13. Momentum & Collision                           */
/* -------------------------------------------------------------------------- */

function collisionDraw(c, p, s, t) {
  floor(c, 320);
  drawRuler(c, 60, 355, 740, -10, 10, 2, "m");

  const scale = 36;
  const ox = 400;
  const x1 = clamp(ox + s.x1 * scale, 85, 715);
  const x2 = clamp(ox + s.x2 * scale, 85, 715);

  const cartH = 46;
  const w1 = 44 + Math.min(28, p.m1 * 3);
  const w2 = 44 + Math.min(28, p.m2 * 3);

  // Cart 1 (Orange)
  rect(c, x1 - w1 / 2, 320 - cartH, w1, cartH, "#1e293b", 6);
  c.strokeStyle = orange;
  c.lineWidth = 2;
  c.strokeRect(x1 - w1 / 2, 320 - cartH, w1, cartH);
  drawWheel(c, x1 - w1 / 2 + 12, 320, 10, (s.x1 * scale) / 10);
  drawWheel(c, x1 + w1 / 2 - 12, 320, 10, (s.x1 * scale) / 10);
  text(c, `${p.m1} kg`, x1, 320 - cartH / 2 + 5, ink, 13, "center", "600");

  // Cart 2 (Blue)
  rect(c, x2 - w2 / 2, 320 - cartH, w2, cartH, "#1e293b", 6);
  c.strokeStyle = blue;
  c.lineWidth = 2;
  c.strokeRect(x2 - w2 / 2, 320 - cartH, w2, cartH);
  drawWheel(c, x2 - w2 / 2 + 12, 320, 10, (s.x2 * scale) / 10);
  drawWheel(c, x2 + w2 / 2 - 12, 320, 10, (s.x2 * scale) / 10);
  text(c, `${p.m2} kg`, x2, 320 - cartH / 2 + 5, ink, 13, "center", "600");

  // Velocity vectors
  if (Math.abs(s.currentV1) > 0.1) {
    arrow(c, x1, 320 - cartH - 24, clamp(s.currentV1 * 12, -90, 90), 0, orange, `v₁ = ${format(s.currentV1)} m/s`, 2.5);
  }
  if (Math.abs(s.currentV2) > 0.1) {
    arrow(c, x2, 320 - cartH - 24, clamp(s.currentV2 * 12, -90, 90), 0, blue, `v₂ = ${format(s.currentV2)} m/s`, 2.5);
  }

  // Collision impact flash at collision moment
  if (s.hasCollided && Math.abs(x1 - x2) < w1 + 10) {
    circle(c, (x1 + x2) / 2, 320 - cartH / 2, 28, "rgba(251,191,36,0.35)");
    circle(c, (x1 + x2) / 2, 320 - cartH / 2, 14, amber);
  }

  // Momentum preservation telemetry banner
  badge(c, `Jami impuls: p = m₁v₁ + m₂v₂ = ${format(s.pTotal)} kg·m/s (Doimiy)`, 400, 65, "rgba(18,26,36,0.9)", green, 14);
  if (s.energyLoss > 0.1) {
    badge(c, `Issiqlikka aylangan energiya: ΔE = ${format(s.energyLoss)} J`, 400, 105, "rgba(244,63,94,0.2)", red, 13);
  }
}

/* -------------------------------------------------------------------------- */
/*                        14. Thermodynamics & Carnot                         */
/* -------------------------------------------------------------------------- */

function thermoDraw(c, p, s, t = 0) {
  // Hot Reservoir T1 (Top)
  const hotX = 140, hotY = 65, resW = 220, resH = 60;
  rect(c, hotX, hotY, resW, resH, "rgba(241,91,43,0.18)", 6);
  c.strokeStyle = orange;
  c.lineWidth = 2;
  c.strokeRect(hotX, hotY, resW, resH);
  text(c, "ISITKICH (Issiq manba)", hotX + resW / 2, hotY + 24, orange, 12, "center", "600");
  text(c, `T₁ = ${p.t1} K`, hotX + resW / 2, hotY + 48, ink, 18, "center", "700");

  // Cold Reservoir T2 (Bottom)
  const coldX = 140, coldY = 320;
  rect(c, coldX, coldY, resW, resH, "rgba(56,189,248,0.18)", 6);
  c.strokeStyle = blue;
  c.lineWidth = 2;
  c.strokeRect(coldX, coldY, resW, resH);
  text(c, "SOVUTGICH (Sovuq manba)", coldX + resW / 2, coldY + 24, blue, 12, "center", "600");
  text(c, `T₂ = ${p.t2} K`, coldX + resW / 2, coldY + 48, ink, 18, "center", "700");

  // Working Heat Engine (Center)
  const engX = 250, engY = 222, engR = 48;
  const cycleTime = 6;
  const phase = (t % cycleTime) / cycleTime; // 0..1

  // Engine color pulses between hot and cold
  const engHue = phase < 0.5 ? "rgba(241,91,43,0.2)" : "rgba(56,189,248,0.2)";
  circle(c, engX, engY, engR, engHue);
  circle(c, engX, engY, engR, "rgba(18,26,36,0.85)");
  c.strokeStyle = amber;
  c.lineWidth = 2.5;
  c.stroke();
  text(c, "ISHCHI JISM", engX, engY - 6, theme.muted, 10, "center");
  text(c, "Karno sikli", engX, engY + 12, amber, 13, "center", "600");

  // Heat flow arrows
  const q1Flow = (t * 50) % 50;
  arrow(c, 250, hotY + resH, 0, 50, orange, `Q₁ = ${p.q1} J`, 3);
  circle(c, 250, hotY + resH + q1Flow, 4, orange);

  const q2Flow = (t * 50) % 50;
  arrow(c, 250, engY + engR, 0, 50, blue, `Q₂ = ${format(s.q2)} J`, 3);
  circle(c, 250, engY + engR + q2Flow, 4, blue);

  const aFlow = (t * 60) % 65;
  arrow(c, engX + engR, engY, 65, 0, green, `A = ${format(s.work)} J`, 3.5);
  circle(c, engX + engR + aFlow, engY, 4, green);

  // Inset p-V Carnot cycle diagram on the right
  const pvX = 480, pvY = 80, pvW = 260, pvH = 240;
  rect(c, pvX, pvY, pvW, pvH, "rgba(18,26,36,0.85)", 8);
  c.strokeStyle = theme.line;
  c.lineWidth = 1.2;
  c.strokeRect(pvX, pvY, pvW, pvH);

  text(c, "KARNO SIKLI (p - V)", pvX + pvW / 2, pvY + 25, theme.muted, 11, "center", "600");
  line(c, pvX + 30, pvY + pvH - 25, pvX + pvW - 20, pvY + pvH - 25, theme.line, 1.5);
  line(c, pvX + 30, pvY + pvH - 25, pvX + 30, pvY + 35, theme.line, 1.5);
  text(c, "V", pvX + pvW - 12, pvY + pvH - 20, theme.muted, 11);
  text(c, "p", pvX + 18, pvY + 45, theme.muted, 11);

  // Draw 4 stages of Carnot cycle: 1->2 (iso T1), 2->3 (adiabat), 3->4 (iso T2), 4->1 (adiabat)
  c.beginPath();
  c.moveTo(pvX + 60, pvY + 65);
  c.quadraticCurveTo(pvX + 110, pvY + 75, pvX + 150, pvY + 105);
  c.quadraticCurveTo(pvX + 185, pvY + 155, pvX + 215, pvY + 195);
  c.quadraticCurveTo(pvX + 155, pvY + 190, pvX + 105, pvY + 175);
  c.quadraticCurveTo(pvX + 75, pvY + 115, pvX + 60, pvY + 65);
  c.fillStyle = "rgba(45,212,163,0.14)";
  c.fill();
  c.strokeStyle = green;
  c.lineWidth = 2;
  c.stroke();

  text(c, "1", pvX + 54, pvY + 60, orange, 11, "center", "600");
  text(c, "2", pvX + 156, pvY + 100, orange, 11, "center", "600");
  text(c, "3", pvX + 224, pvY + 195, blue, 11, "center", "600");
  text(c, "4", pvX + 96, pvY + 180, blue, 11, "center", "600");

  // Dynamic live tracer bead navigating the cycle 1 -> 2 -> 3 -> 4 -> 1
  let tracerX, tracerY;
  if (phase < 0.25) {
    const u = phase / 0.25;
    tracerX = (1 - u) * (pvX + 60) + u * (pvX + 150);
    tracerY = (1 - u) * (pvY + 65) + u * (pvY + 105);
  } else if (phase < 0.5) {
    const u = (phase - 0.25) / 0.25;
    tracerX = (1 - u) * (pvX + 150) + u * (pvX + 215);
    tracerY = (1 - u) * (pvY + 105) + u * (pvY + 195);
  } else if (phase < 0.75) {
    const u = (phase - 0.5) / 0.25;
    tracerX = (1 - u) * (pvX + 215) + u * (pvX + 105);
    tracerY = (1 - u) * (pvY + 195) + u * (pvY + 175);
  } else {
    const u = (phase - 0.75) / 0.25;
    tracerX = (1 - u) * (pvX + 105) + u * (pvX + 60);
    tracerY = (1 - u) * (pvY + 175) + u * (pvY + 65);
  }
  circle(c, tracerX, tracerY, 5, "#2dd4bf");
  circle(c, tracerX, tracerY, 9, "rgba(45,212,163,0.35)");

  // Live stage indicator
  const stageName = phase < 0.25 ? "1: Izotermik kengayish (T₁)" : phase < 0.5 ? "2: Adiabatik kengayish" : phase < 0.75 ? "3: Izotermik siqilish (T₂)" : "4: Adiabatik siqilish";
  text(c, stageName, pvX + pvW / 2, pvY + pvH - 8, "#2dd4bf", 11, "center", "600");

  // FIK Banner with Second Law check
  if (s.isLawViolated) {
    badge(c, "⚠️ Termodinamika II qonuni (Karno): T₁ > T₂ bo‘lishi shart! Isitkich sovutgichdan issiqroq bo‘lishi kerak.", 400, 420, "rgba(220,38,38,0.25)", "#f87171", 13);
  } else {
    badge(c, `Maksimal FIK: η = 1 - T₂/T₁ = ${format(s.efficiency)}%  |  Foydali ish: A = ${format(s.work)} J`, 400, 420, "rgba(18,26,36,0.9)", green, 14);
  }
}

/* -------------------------------------------------------------------------- */
/*                        15. Faraday's Electrolysis                          */
/* -------------------------------------------------------------------------- */

function electrolysisDraw(c, p, s, t) {
  const tankX = 220, tankY = 130, tankW = 360, tankH = 240;
  const bathFluidY = tankY + 40;

  // Electrolyte bath fluid
  rect(c, tankX, bathFluidY, tankW, tankH - 40, "rgba(56,189,248,0.22)", 0);
  line(c, tankX, bathFluidY, tankX + tankW, bathFluidY, blue, 2);

  // Glass Tank wall
  line(c, tankX, tankY, tankX, tankY + tankH, "#64748b", 3.5);
  line(c, tankX, tankY + tankH, tankX + tankW, tankY + tankH, "#64748b", 3.5);
  line(c, tankX + tankW, tankY, tankX + tankW, tankY + tankH, "#64748b", 3.5);

  // Anode (+) Plate on Left
  const anX = tankX + 60, anY = tankY + 20, anW = 20, anH = 180;
  rect(c, anX, anY, anW, anH, "#475569", 2);
  text(c, "ANOD (+)", anX + anW / 2, anY - 8, orange, 11, "center", "600");

  // Cathode (-) Plate on Right
  const catX = tankX + tankW - 80, catY = tankY + 20, catW = 20, catH = 180;
  rect(c, catX, catY, catW, catH, "#475569", 2);

  // Deposited metal coating layer growing on cathode
  const coatW = Math.min(14, 2 + s.layer * 0.8);
  rect(c, catX - coatW, catY + 15, coatW, catH - 30, orange, 0);
  text(c, "KATOD (−)", catX + catW / 2, catY - 8, blue, 11, "center", "600");

  // External Circuit wires & Battery
  line(c, anX + anW / 2, anY, anX + anW / 2, 70, orange, 2.5);
  line(c, anX + anW / 2, 70, 360, 70, orange, 2.5);

  line(c, catX + catW / 2, catY, catX + catW / 2, 70, blue, 2.5);
  line(c, catX + catW / 2, 70, 440, 70, blue, 2.5);

  // DC Power supply symbol
  rect(c, 360, 50, 80, 40, "rgba(18,26,36,0.9)", 4);
  c.strokeStyle = theme.line;
  c.strokeRect(360, 50, 80, 40);
  text(c, `${p.voltage} V`, 400, 75, ink, 14, "center", "600");

  // Migrating metal ions Cu2+ / Ag+ moving toward cathode
  for (let i = 0; i < 8; i++) {
    const progress = ((i / 8) + t * 0.25) % 1;
    const ionX = anX + anW + progress * (catX - anX - anW - 10);
    const ionY = bathFluidY + 25 + (i * 22);
    circle(c, ionX, ionY, 5, orange);
    text(c, "+", ionX, ionY + 3.5, "#ffffff", 9, "center", "700");
  }

  // Telemetry badge
  badge(c, `${s.metalName} | Ajralgan massa: m = ${format(s.mass)} g | O‘tgan zaryad: q = ${format(s.charge)} C`, 400, 420, "rgba(18,26,36,0.9)", ink, 14);
}

/* -------------------------------------------------------------------------- */
/*                       16. LC Oscillator & Thomson                          */
/* -------------------------------------------------------------------------- */

function circuitOscDraw(c, p, s, t) {
  const x = 160, y = 140, w = 480, h = 180;

  // Circuit wires
  c.strokeStyle = "#475569";
  c.lineWidth = 4;
  c.strokeRect(x, y, w, h);

  // Capacitor (Left branch)
  const capX = x, capY = y + h / 2;
  rect(c, capX - 16, capY - 30, 32, 60, theme.surface, 0);
  line(c, capX - 25, capY - 14, capX + 25, capY - 14, ink, 4);
  line(c, capX - 25, capY + 14, capX + 25, capY + 14, ink, 4);

  // Charge signs on capacitor plates
  const isPosTop = s.charge >= 0;
  for (let i = -2; i <= 2; i++) {
    text(c, isPosTop ? "+" : "−", capX + i * 10, capY - 20, isPosTop ? orange : blue, 12, "center", "700");
    text(c, isPosTop ? "−" : "+", capX + i * 10, capY + 26, isPosTop ? blue : orange, 12, "center", "700");
  }
  text(c, `C = ${p.capacitance} μF`, capX - 35, capY + 5, ink, 13, "right", "600");

  // Inductor Coil (Right branch)
  const indX = x + w, indY = y + h / 2;
  rect(c, indX - 16, indY - 45, 32, 90, theme.surface, 0);
  for (let i = 0; i < 6; i++) {
    c.beginPath();
    c.ellipse(indX, indY - 36 + i * 14, 18, 8, 0, 0, Math.PI * 2);
    c.strokeStyle = amber;
    c.lineWidth = 3;
    c.stroke();
  }
  text(c, `L = ${p.inductance} mH`, indX + 32, indY + 5, ink, 13, "left", "600");

  // Dynamic B-field lines in inductor when current flows
  if (Math.abs(s.current) > 0.05) {
    const bColor = "rgba(251,191,36,0.3)";
    line(c, indX - 26, indY - 40, indX - 26, indY + 40, bColor, 1.5, [3, 3]);
    line(c, indX + 26, indY - 40, indX + 26, indY + 40, bColor, 1.5, [3, 3]);
  }

  // Energy distribution bar at top
  const barX = 140, barY = 55, barW = 520, barH = 20;
  const totE = Math.max(0.001, s.totalEnergy);
  const capFrac = clamp(s.energyCap / totE, 0, 1);
  const indFrac = clamp(s.energyInd / totE, 0, 1);

  rect(c, barX, barY, barW, barH, theme.floor, 4);
  rect(c, barX, barY, barW * capFrac, barH, orange, 4);
  rect(c, barX + barW * capFrac, barY, barW * indFrac, barH, amber, 4);
  c.strokeStyle = theme.line;
  c.strokeRect(barX, barY, barW, barH);

  text(c, `Elektr maydon (W_e): ${format(s.energyCap)} mJ`, barX, barY - 10, orange, 12, "left", "600");
  text(c, `Magnit maydon (W_m): ${format(s.energyInd)} mJ`, barX + barW, barY - 10, amber, 12, "right", "600");

  // Thomson period badge
  badge(c, `Tomson davri: T = 2π√(LC) = ${format(s.period)} ms  |  Chastota: ν = ${format(s.frequency)} kHz`, 400, 420, "rgba(18,26,36,0.9)", ink, 14);
}

/* -------------------------------------------------------------------------- */
/*                       17. Photoelectric Effect                             */
/* -------------------------------------------------------------------------- */

function photoelectricDraw(c, p, s, t = 0) {
  const ox = 400, oy = 230;
  const tubeW = 420, tubeH = 200;

  // Vacuum phototube envelope
  rect(c, ox - tubeW / 2, oy - tubeH / 2, tubeW, tubeH, "rgba(18,26,36,0.75)", 18);
  c.strokeStyle = theme.line;
  c.lineWidth = 2.5;
  c.strokeRect(ox - tubeW / 2, oy - tubeH / 2, tubeW, tubeH);

  // Photocathode plate (Left)
  const catX = ox - 140, catY = oy - 65, catW = 16, catH = 130;
  rect(c, catX, catY, catW, catH, "#475569", 2);
  c.strokeStyle = orange;
  c.strokeRect(catX, catY, catW, catH);
  text(c, `Katod (${s.metalName})`, catX - 10, catY - 12, orange, 11, "right", "600");
  text(c, `A = ${s.workFunc} eV`, catX - 10, catY + 12, theme.muted, 11, "right");

  // Anode grid (Right)
  const anX = ox + 140, anY = oy - 65, anW = 12, anH = 130;
  for (let i = 0; i <= 6; i++) {
    line(c, anX, anY + i * 21, anX + anW, anY + i * 21, blue, 2);
  }
  line(c, anX, anY, anX, anY + anH, blue, 2);
  text(c, "Anod to‘ri", anX + 20, anY - 12, blue, 11, "left", "600");

  // Incoming photon light beam (color mapped from wavelength)
  const beamColor =
    p.wavelength < 380
      ? "#a855f7" // UV / violet
      : p.wavelength < 490
        ? blue
        : p.wavelength < 570
          ? green
          : p.wavelength < 620
            ? amber
            : red;

  c.strokeStyle = beamColor;
  c.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const startY = oy - 80 + i * 25;
    line(c, catX - 110, startY - 45, catX, startY, beamColor, 2.5, [6, 4]);

    // Live animated photon packets flying from lamp to cathode
    const pTravel = (t * 180 + i * 38) % 150;
    const px = catX - 110 + (pTravel / 150) * 110;
    const py = startY - 45 + (pTravel / 150) * 45;
    circle(c, px, py, 4, beamColor);
  }
  text(c, `Yorug‘lik: λ = ${p.wavelength} nm (E = ${format(s.photonEnergy)} eV)`, ox - 130, 85, beamColor, 13, "center", "600");

  // Emitted photoelectrons flying from cathode to anode
  if (s.canEmit && s.kineticMax > 0) {
    const electronCount = Math.round(14 * (p.intensity / 100));
    const eSpeed = Math.min(280, 80 + Math.sqrt(s.kineticMax) * 90);
    const travelSpan = anX - catX - 20;

    for (let i = 0; i < electronCount; i++) {
      const progress = (t * eSpeed + i * 32) % travelSpan;
      const ex = catX + 16 + progress;
      const ey = catY + 15 + ((i * 37) % 100) + Math.sin(t * 8 + i) * 3;
      circle(c, ex, ey, 3.5, blue);
      arrow(c, ex, ey, 14 * Math.sqrt(s.kineticMax), 0, blue, "", 1.5);
    }
  } else {
    // Photons below work function threshold: red limit dissipation
    const heatWave = (Math.sin(t * 10) + 1) * 2;
    circle(c, catX + 8, oy, 10 + heatWave, "rgba(244,63,94,0.2)");
  }

  // Telemetry status banner
  const statusMsg = s.canEmit
    ? `Fotoeffekt bor! E_foton (${format(s.photonEnergy)} eV) > A (${s.workFunc} eV) | E_kmax = ${format(s.kineticMax)} eV | U₀ = ${format(s.stoppingU)} V`
    : `Fotoeffekt yo‘q: E_foton (${format(s.photonEnergy)} eV) < A (${s.workFunc} eV) — Qizil chegara! Elektronlar uchib chiqmaydi`;
  badge(c, statusMsg, ox, 420, "rgba(18,26,36,0.9)", s.canEmit ? green : red, 13);
}

/* -------------------------------------------------------------------------- */
/*                       18. Radioactive Decay Law                            */
/* -------------------------------------------------------------------------- */

function radioactiveDraw(c, p, s, t) {
  const ox = 260, oy = 230;
  const gridCount = 10;
  const spacing = 22;
  const startX = ox - (gridCount * spacing) / 2;
  const startY = oy - (gridCount * spacing) / 2;

  // 10x10 Matrix of Nuclei
  const decayedRatio = clamp(s.decayed / (p.initialN ?? 500), 0, 1);
  const decayedCount = Math.round(decayedRatio * 100);

  for (let r = 0; r < gridCount; r++) {
    for (let col = 0; col < gridCount; col++) {
      const idx = r * gridCount + col;
      const isDecayed = idx < decayedCount;
      const px = startX + col * spacing;
      const py = startY + r * spacing;

      if (isDecayed) {
        // Stable daughter nucleus
        circle(c, px, py, 5, blue);
      } else {
        // Active unstable radioactive nucleus with pulsating glow
        circle(c, px, py, 7, "rgba(241,91,43,0.3)");
        circle(c, px, py, 5.5, orange);
      }
    }
  }

  // Decay curve preview on the right
  const cvX = 460, cvY = 120, cvW = 280, cvH = 220;
  rect(c, cvX, cvY, cvW, cvH, "rgba(18,26,36,0.85)", 8);
  c.strokeStyle = theme.line;
  c.strokeRect(cvX, cvY, cvW, cvH);

  text(c, "YEMIRILISH EGRI CHIZIG‘I (N - t)", cvX + cvW / 2, cvY + 25, theme.muted, 11, "center", "600");
  line(c, cvX + 35, cvY + cvH - 25, cvX + cvW - 15, cvY + cvH - 25, theme.line, 1.5);
  line(c, cvX + 35, cvY + cvH - 25, cvX + 35, cvY + 35, theme.line, 1.5);

  c.beginPath();
  c.strokeStyle = orange;
  c.lineWidth = 2.5;
  for (let i = 0; i <= cvW - 55; i += 2) {
    const curT = (i / (cvW - 55)) * 20;
    const nFrac = Math.pow(2, -curT / p.halfLife);
    const py = cvY + cvH - 25 - nFrac * (cvH - 65);
    i === 0 ? c.moveTo(cvX + 35 + i, py) : c.lineTo(cvX + 35 + i, py);
  }
  c.stroke();

  // Current operating point on curve
  const curX = cvX + 35 + clamp((t / 20) * (cvW - 55), 0, cvW - 55);
  const curY = cvY + cvH - 25 - (s.remaining / (p.initialN ?? 500)) * (cvH - 65);
  circle(c, curX, curY, 5, green);

  badge(c, `Qolgan yadrolar: N(t) = ${s.remaining} (${format(s.ratio)}%) | Yemirildi: ${s.decayed}`, 400, 420, "rgba(18,26,36,0.9)", ink, 14);
}

/* -------------------------------------------------------------------------- */
/*                       19. Circular Motion (v = wR)                         */
/* -------------------------------------------------------------------------- */

function circularDraw(c, p, s, t) {
  const ox = 400, oy = 230;
  const pxR = p.radius * 45;

  // Circular orbit path
  c.beginPath();
  c.arc(ox, oy, pxR, 0, Math.PI * 2);
  c.strokeStyle = "rgba(148,163,184,0.3)";
  c.lineWidth = 2;
  c.stroke();

  // Center axle
  circle(c, ox, oy, 4, theme.muted);
  text(c, "O", ox - 14, oy - 10, theme.muted, 11);

  // Moving particle
  const rad = ((s.angle ?? 0) * Math.PI) / 180;
  const px = ox + Math.cos(rad) * pxR;
  const py = oy + Math.sin(rad) * pxR;

  // Radius vector
  line(c, ox, oy, px, py, theme.line, 1.8, [4, 4]);

  // Particle sphere
  circle(c, px, py, 14, "rgba(241,91,43,0.25)");
  circle(c, px, py, 10, orange);
  circle(c, px - 3, py - 3, 3, "rgba(255,255,255,0.7)");

  // Centripetal acceleration vector an (points inward to origin)
  const aLen = Math.min(85, s.an * 2.5);
  arrow(c, px, py, -Math.cos(rad) * aLen, -Math.sin(rad) * aLen, green, `a_n = ${format(s.an)} m/s²`, 2.5);

  // Tangential velocity vector v (tangent to circle)
  const vLen = Math.min(90, s.v * 7);
  arrow(c, px, py, -Math.sin(rad) * vLen, Math.cos(rad) * vLen, blue, `v = ${format(s.v)} m/s`, 2.5);

  badge(c, `v = ωR = ${format(s.v)} m/s  |  a_n = v²/R = ${format(s.an)} m/s²  |  T = ${format(s.period)} s`, 400, 420, "rgba(18,26,36,0.9)", ink, 14);
}

/* -------------------------------------------------------------------------- */
/*                       20. Universal Gravitation                            */
/* -------------------------------------------------------------------------- */

function gravitationDraw(c, p, s, t = 0) {
  const ox = 320, oy = 230;
  const planetR = 75;

  // Central Planet sphere with radial shading
  const pColors = [
    { base: "#1e3a8a", glow: "rgba(56,189,248,0.3)", name: "Yer" },
    { base: "#475569", glow: "rgba(148,163,184,0.3)", name: "Oy" },
    { base: "#991b1b", glow: "rgba(241,91,43,0.3)", name: "Mars" },
  ];
  const col = pColors[p.planet ?? 0];

  circle(c, ox, oy, planetR + 12, col.glow);
  circle(c, ox, oy, planetR, col.base);
  circle(c, ox - 20, oy - 20, 25, "rgba(255,255,255,0.1)");
  text(c, s.planetName, ox, oy + 5, "#ffffff", 18, "center", "700");

  // Orbit ring
  const orbitR = planetR + Math.min(130, (p.altitude / 36000) * 120 + 35);
  c.beginPath();
  c.arc(ox, oy, orbitR, 0, Math.PI * 2);
  c.strokeStyle = "rgba(56,189,248,0.4)";
  c.lineWidth = 1.5;
  c.setLineDash([5, 4]);
  c.stroke();
  c.setLineDash([]);

  // Satellite vehicle on continuous dynamic orbit
  const satAngle = (t * (s.omega ?? 0.3) * 6) % (Math.PI * 2);
  const satX = ox + Math.cos(satAngle) * orbitR;
  const satY = oy + Math.sin(satAngle) * orbitR;

  // Orbit luminous wake
  c.beginPath();
  c.arc(ox, oy, orbitR, satAngle - 0.4, satAngle);
  c.strokeStyle = "rgba(56,189,248,0.8)";
  c.lineWidth = 2.5;
  c.stroke();

  // Solar wings
  rect(c, satX - 16, satY - 5, 32, 10, blue, 2);
  // Main pod
  rect(c, satX - 6, satY - 6, 12, 12, "#cbd5e1", 2);

  // Gravity attraction vector F_g
  arrow(c, satX, satY, -Math.cos(satAngle) * 55, -Math.sin(satAngle) * 55, orange, `F_g = ${format(s.gravityForce)} N`, 2.5);

  // Velocity vector v
  arrow(c, satX, satY, -Math.sin(satAngle) * 60, Math.cos(satAngle) * 60, blue, `v₁ = ${format(s.orbitalSpeed)} km/s`, 2.5);

  // Telemetry card on the right
  const cardX = 540, cardY = 120;
  rect(c, cardX, cardY, 220, 200, "rgba(18,26,36,0.85)", 8);
  c.strokeStyle = theme.line;
  c.strokeRect(cardX, cardY, 220, 200);

  text(c, "ORBITAL PARAMETRLAR", cardX + 110, cardY + 25, theme.muted, 11, "center", "600");
  text(c, `v₁ = ${format(s.orbitalSpeed)} km/s`, cardX + 110, cardY + 65, blue, 20, "center", "700");
  text(c, `Aylanish davri: ${format(s.orbitalPeriod)} min`, cardX + 110, cardY + 105, ink, 13, "center");
  text(c, `g(h) = ${format(s.gAtHeight)} m/s²`, cardX + 110, cardY + 135, green, 13, "center", "600");
  text(c, `F_tortishish = ${format(s.gravityForce)} N`, cardX + 110, cardY + 165, orange, 13, "center", "600");
}

/* -------------------------------------------------------------------------- */
/*                       21. Hydraulic Press & Pascal                         */
/* -------------------------------------------------------------------------- */

function hydraulicDraw(c, p, s, t = 0) {
  const ox = 400, oy = 250;
  const fluidY = oy + 20;

  // Narrow cylinder (Left)
  const c1X = ox - 160, c1W = 50, c1H = 140;
  // Wide cylinder (Right)
  const c2X = ox + 40, c2W = 160, c2H = 140;
  // Connecting pipe
  const pipeY = oy + c1H - 30, pipeH = 30;

  // Dynamic pumping movement
  const pump = Math.sin(t * 2.2);
  const disp1 = pump * 18;
  const disp2 = -disp1 / Math.max(1, s.gain * 0.35);

  // Hydraulic fluid body
  c.fillStyle = "rgba(56,189,248,0.25)";
  c.fillRect(c1X, fluidY + disp1, c1W, c1H - 20 - disp1);
  c.fillRect(c2X, fluidY + disp2, c2W, c2H - 20 - disp2);
  c.fillRect(c1X + c1W, pipeY, c2X - (c1X + c1W), pipeH);

  // Cylinder walls
  c.strokeStyle = "#475569";
  c.lineWidth = 3.5;
  // Left wall
  line(c, c1X, oy - 20, c1X, oy + c1H);
  line(c, c1X, oy + c1H, c2X + c2W, oy + c1H);
  line(c, c2X + c2W, oy - 20, c2X + c2W, oy + c1H);
  // Inner corner
  line(c, c1X + c1W, oy - 20, c1X + c1W, pipeY);
  line(c, c1X + c1W, pipeY, c2X, pipeY);
  line(c, c2X, pipeY, c2X, oy - 20);

  // Left Piston
  rect(c, c1X + 2, fluidY - 14 + disp1, c1W - 4, 18, "#334155", 2);
  c.strokeStyle = orange;
  c.strokeRect(c1X + 2, fluidY - 14 + disp1, c1W - 4, 18);
  arrow(c, c1X + c1W / 2, fluidY - 60 + disp1, 0, 45, orange, `F₁ = ${p.f1} N`, 3);
  text(c, `S₁ = ${p.s1} cm²`, c1X + c1W / 2, fluidY + 35 + disp1, theme.muted, 11, "center", "600");

  // Right Piston
  rect(c, c2X + 2, fluidY - 14 + disp2, c2W - 4, 18, "#334155", 2);
  c.strokeStyle = green;
  c.strokeRect(c2X + 2, fluidY - 14 + disp2, c2W - 4, 18);

  // Automobile load being lifted on large piston
  rect(c, c2X + 20, fluidY - 65 + disp2, c2W - 40, 50, "#1e293b", 6);
  c.strokeStyle = blue;
  c.strokeRect(c2X + 20, fluidY - 65 + disp2, c2W - 40, 50);
  text(c, `Yuk: ${Math.round(s.liftMass)} kg`, c2X + c2W / 2, fluidY - 35 + disp2, ink, 14, "center", "700");

  arrow(c, c2X + c2W / 2, fluidY - 14 + disp2, 0, -65, green, `F₂ = ${format(s.f2)} N`, 3.5);
  text(c, `S₂ = ${p.s2} cm²`, c2X + c2W / 2, fluidY + 35 + disp2, theme.muted, 11, "center", "600");

  // Pressure transmission arrows in fluid
  for (let i = 0; i < 5; i++) {
    const px = c1X + c1W + 20 + i * 28;
    const arrowDir = pump >= 0 ? 18 : -18;
    arrow(c, px, pipeY + 15, arrowDir, 0, blue, "", 1.8);
  }

  badge(c, `Paskal bosimi: p = ${format(s.pressure)} kPa  |  Kuchdagi yutuq: k = S₂/S₁ = ${format(s.gain)}×`, 400, 420, "rgba(18,26,36,0.9)", green, 14);
}

/* -------------------------------------------------------------------------- */
/*                       22. Mathematical Pendulum                            */
/* -------------------------------------------------------------------------- */

function pendulumDraw(c, p, s) {
  const ox = 400, oy = 75;
  const pxLen = p.length * 90;

  // Ceiling bracket
  line(c, ox - 40, oy, ox + 40, oy, ink, 4);
  circle(c, ox, oy, 4, orange);

  // Equilibrium reference
  line(c, ox, oy, ox, oy + pxLen + 30, theme.line, 1, [4, 4]);

  const thetaRad = ((s.theta ?? 0) * Math.PI) / 180;
  const bobX = ox + Math.sin(thetaRad) * pxLen;
  const bobY = oy + Math.cos(thetaRad) * pxLen;

  // Suspension cord
  line(c, ox, oy, bobX, bobY, theme.muted, 2);

  // Metallic Bob sphere with reflection
  circle(c, bobX, bobY, 16, "rgba(241,91,43,0.25)");
  circle(c, bobX, bobY, 12, orange);
  circle(c, bobX - 3, bobY - 3, 3.5, "rgba(255,255,255,0.7)");

  // Trajectory arc
  c.beginPath();
  c.arc(ox, oy, pxLen, Math.PI / 2 - 0.45, Math.PI / 2 + 0.45);
  c.strokeStyle = "rgba(148,163,184,0.2)";
  c.lineWidth = 1.5;
  c.stroke();

  // Velocity vector tangent to circular arc
  if (Math.abs(s.v) > 0.05) {
    const vLen = clamp(s.v * 24, -80, 80);
    arrow(c, bobX, bobY, Math.cos(thetaRad) * vLen, -Math.sin(thetaRad) * vLen, blue, `v = ${format(s.v)} m/s`, 2.5);
  }

  // Tension force along cord
  arrow(c, bobX, bobY, -Math.sin(thetaRad) * 45, -Math.cos(thetaRad) * 45, green, `T = ${format(s.tension)} N`, 2.5);

  // Energy preservation bar
  const totalE = Math.max(0.0001, s.energyTotal ?? 1);
  const fracKin = clamp((s.energyKinetic ?? 0) / totalE, 0, 1);
  const barW = 220, barH = 10, barX = 290, barY = 380;
  rect(c, barX, barY, barW, barH, "rgba(255,255,255,0.08)", 3);
  rect(c, barX, barY, barW * fracKin, barH, blue, 3);
  rect(c, barX + barW * fracKin, barY, barW * (1 - fracKin), barH, orange, 3);
  text(c, `E_k: ${format(s.energyKinetic)} J`, barX - 10, barY + 9, blue, 10, "right", "600");
  text(c, `E_p: ${format(s.energyPotential)} J`, barX + barW + 10, barY + 9, orange, 10, "left", "600");

  // Telemetry banner
  badge(c, `T = 2π√(l/g) = ${format(s.period)} s  |  E_jami = ${format(s.energyTotal)} J (Saqlanadi)  |  v_max = ${format(s.maxSpeed)} m/s`, 400, 422, "rgba(18,26,36,0.9)", ink, 14);
}

/* -------------------------------------------------------------------------- */
/*                           Main Dispatcher                                  */
/* -------------------------------------------------------------------------- */

export function renderSimulation(ctx, state) {
  const { config, p, s, t, trails = [], hero = false, hoverHandle = null } = state;
  const palette = readCanvasTheme();
  grid(ctx, palette);
  ctx.compactMode = Boolean(state.compact);
  ctx.save();

  switch (config.key) {
    case "motion":
    case "newton":
    case "friction":
      cart(ctx, p, { ...s, t }, config.key, hero);
      break;
    case "fall":
    case "projectile":
      flight(ctx, p, s, config.key, trails);
      break;
    case "energy":
      track(ctx, p, s);
      break;
    case "spring":
      springDraw(ctx, p, s, t);
      break;
    case "resonance":
      bridge(ctx, p, s, t);
      break;
    case "buoyancy":
      water(ctx, p, s, t);
      break;
    case "gas":
      gasDraw(ctx, p, s, t);
      break;
    case "coulomb":
      charges(ctx, p, s, t);
      break;
    case "ohm":
    case "circuit":
      electrical(ctx, p, s, config.key, t);
      break;
    case "induction":
      magnet(ctx, p, s, t);
      break;
    case "lens":
      optics(ctx, p, s, t);
      break;
    case "lever":
      leverDraw(ctx, p, s, t);
      break;
    case "collision":
      collisionDraw(ctx, p, s, t);
      break;
    case "thermo":
      thermoDraw(ctx, p, s, t);
      break;
    case "electrolysis":
      electrolysisDraw(ctx, p, s, t);
      break;
    case "circuitOsc":
      circuitOscDraw(ctx, p, s, t);
      break;
    case "photoelectric":
      photoelectricDraw(ctx, p, s, t);
      break;
    case "radioactive":
      radioactiveDraw(ctx, p, s, t);
      break;
    case "circular":
      circularDraw(ctx, p, s, t);
      break;
    case "gravitation":
      gravitationDraw(ctx, p, s, t);
      break;
    case "hydraulic":
      hydraulicDraw(ctx, p, s, t);
      break;
    case "pendulum":
      pendulumDraw(ctx, p, s, t);
      break;
  }

  // Draw interactive drag hint ring if hovered
  if (hoverHandle) {
    if (hoverHandle === "coulomb_r") {
      const d = 80 + p.r * 135;
      drawHandleGlow(ctx, 400 + d / 2, 230, 36, orange);
    } else if (hoverHandle === "coulomb_q1") {
      const d = 80 + p.r * 135;
      drawHandleGlow(ctx, 400 - d / 2, 230, 36, blue);
    } else if (hoverHandle === "lens_object") {
      const extent = Math.max(3, p.object, Number.isFinite(s?.image) ? Math.min(10, Math.abs(s.image)) : 3);
      const scale = 320 / extent;
      const ox = 400, oy = 245;
      const dx = -p.object * scale;
      const h = p.height * scale * 2.2;
      drawHandleGlow(ctx, ox + dx, oy - h, 20, orange);
    } else if (hoverHandle === "lens_focal") {
      const extent = Math.max(3, p.object, Number.isFinite(s?.image) ? Math.min(10, Math.abs(s.image)) : 3);
      const scale = 320 / extent;
      drawHandleGlow(ctx, 400 + (p.focal ?? 0.5) * scale, 245, 24, green);
    } else if (hoverHandle === "collision_v1") {
      const scale = 36;
      const x1 = clamp(400 + (s?.x1 ?? -4) * scale, 85, 715);
      drawHandleGlow(ctx, x1, 290, 36, orange);
    } else if (hoverHandle === "collision_v2") {
      const scale = 36;
      const x2 = clamp(400 + (s?.x2 ?? 4) * scale, 85, 715);
      drawHandleGlow(ctx, x2, 290, 36, blue);
    } else if (hoverHandle === "spring_mass") {
      const bottom = 240 + (s?.x ?? 0) * 110;
      drawHandleGlow(ctx, 300, bottom + 23, 38, orange);
    } else if (hoverHandle === "pendulum_bob") {
      const ox = 400, oy = 75;
      const pxLen = (p.length ?? 1.2) * 90;
      const thetaRad = ((s?.theta ?? 0) * Math.PI) / 180;
      const bobX = ox + Math.sin(thetaRad) * pxLen;
      const bobY = oy + Math.cos(thetaRad) * pxLen;
      drawHandleGlow(ctx, bobX, bobY, 30, orange);
    } else if (hoverHandle === "lever_m1") {
      const maxL = Math.max(p.l1, p.l2, 1.8);
      const pxScale = 300 / maxL;
      drawHandleGlow(ctx, 400 - p.l1 * pxScale, 290, 32, orange);
    } else if (hoverHandle === "lever_m2") {
      const maxL = Math.max(p.l1, p.l2, 1.8);
      const pxScale = 300 / maxL;
      drawHandleGlow(ctx, 400 + p.l2 * pxScale, 290, 32, blue);
    } else if (hoverHandle === "hydraulic_piston1") {
      drawHandleGlow(ctx, 400 - 135, 270, 36, orange);
    } else if (hoverHandle === "circular_bob") {
      const rad = ((s?.angle ?? 0) * Math.PI) / 180;
      const pxR = (p.radius ?? 2) * 45;
      drawHandleGlow(ctx, 400 + Math.cos(rad) * pxR, 230 + Math.sin(rad) * pxR, 28, orange);
    } else if (hoverHandle === "satellite_orbit") {
      const orbitR = 75 + Math.min(130, ((p.altitude ?? 1000) / 36000) * 120 + 35);
      const satAngle = s?.angle ?? -Math.PI / 4;
      drawHandleGlow(ctx, 320 + Math.cos(satAngle) * orbitR, 230 + Math.sin(satAngle) * orbitR, 28, blue);
    }
  }

  ctx.restore();
}

