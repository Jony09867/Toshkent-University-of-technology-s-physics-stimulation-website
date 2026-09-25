import { clamp, projectile, resonance } from "../physics/engine.js";
import { uz } from "../i18n/uz.js";
import { format } from "../components/ResultCard.js";
const orange = "#F1592A",
  ink = "#233444",
  muted = "#7b8b9c",
  blue = "#3883d9",
  green = "#19a378",
  red = "#e05757";
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
function text(c, s, x, y, color = muted, size = 13, align = "left") {
  const readableSize = c.compactMode ? Math.min(size * 1.16, size + 3) : size;
  c.fillStyle = color;
  c.font = `${readableSize >= 20 ? "600" : "500"} ${readableSize}px Inter, Segoe UI, sans-serif`;
  c.textAlign = align;
  c.fillText(s, x, y);
}
function rect(c, x, y, w, h, color, r = 8) {
  c.fillStyle = color;
  c.beginPath();
  if (typeof c.roundRect === "function") c.roundRect(x, y, w, h, r);
  else {
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
function arrow(c, x, y, dx, dy, color = red, label = "") {
  if (Math.hypot(dx, dy) < 1) return;
  line(c, x, y, x + dx, y + dy, color, 3);
  const a = Math.atan2(dy, dx);
  c.beginPath();
  c.fillStyle = color;
  c.moveTo(x + dx, y + dy);
  c.lineTo(x + dx - 10 * Math.cos(a - 0.45), y + dy - 10 * Math.sin(a - 0.45));
  c.lineTo(x + dx - 10 * Math.cos(a + 0.45), y + dy - 10 * Math.sin(a + 0.45));
  c.fill();
  if (label)
    text(
      c,
      label,
      x + dx + (dx < 0 ? -8 : 8),
      y + dy - 10,
      color,
      14,
      dx < 0 ? "right" : "left",
    );
}
function ball(c, x, y, r = 17) {
  c.save();
  c.shadowBlur = 16;
  c.shadowColor = "#F1592A35";
  c.shadowOffsetY = 6;
  const g = c.createRadialGradient(x - r / 3, y - r / 3, 1, x, y, r);
  g.addColorStop(0, "#ffad72");
  g.addColorStop(0.55, orange);
  g.addColorStop(1, "#c83a1b");
  circle(c, x, y, r, g);
  c.restore();
  circle(c, x - r / 3, y - r / 3, r / 5, "#ffffff75");
}
function block(c, x, y, size, label) {
  c.save();
  c.shadowBlur = 16;
  c.shadowOffsetY = 8;
  c.shadowColor = "#26344417";
  rect(c, x - size / 2, y - size, size, size, orange, 6);
  c.restore();
  rect(c, x - size / 2 + 4, y - size + 4, size - 8, 7, "#ffac8055", 3);
  text(c, label, x, y - size / 2 + 5, "white", 15, "center");
}
function grid(c) {
  c.clearRect(0, 0, 800, 460);
  c.fillStyle = "#f8fafb";
  c.fillRect(0, 0, 800, 460);
  for (let x = 20; x < 800; x += 24)
    for (let y = 18; y < 460; y += 24) circle(c, x, y, 0.7, "#dce3e9");
}
function floor(c, y = 342) {
  rect(c, 34, y, 732, 36, "#eef1f4", 0);
  line(c, 34, y, 766, y, "#abb8c3", 2);
  for (let x = 40; x < 760; x += 24)
    line(c, x, y + 5, x - 10, y + 16, "#ccd5dd", 1);
}
function measure(c, x1, y1, x2, y2, label) {
  line(c, x1, y1, x2, y2, "#9caebb", 1, [4, 4]);
  text(c, label, (x1 + x2) / 2, (y1 + y2) / 2 - 8, muted, 12, "center");
}
function cart(c, p, s, key, hero = false) {
  const heroMode = hero && key === "newton";
  const end =
    key === "newton"
      ? Math.max(10, Math.abs(s.a) * 18)
      : key === "friction"
        ? Math.max(30, Number.isFinite(s.distance) ? s.distance : 80)
        : Math.max(80, Math.abs(p.v0 * 8 + p.a * 32));
  const scale = 550 / end;
  const rawX = 130 + s.x * scale,
    x = clamp(rawX, 65, 725),
    size = key === "newton" ? 36 + p.m * 2 : 62;
  if (key === "newton" && p.slope) {
    const q = clamp(s.x * scale * 0.35, -155, 155);
    c.save();
    c.translate(400, 275);
    c.rotate((-p.slope * Math.PI) / 180);
    rect(c, -300, 0, 600, 22, "#e4ebf0", 0);
    line(c, -300, 0, 300, 0, "#9bb0bf", 3);
    for (let i = -290; i < 300; i += 25)
      line(c, i, 4, i - 10, 16, "#c3d1db", 1);
    block(c, q, 0, size, `${p.m} kg`);
    arrow(c, q + size / 2, -size / 2, p.force, 0, red, "F");
    if (s.friction)
      arrow(
        c,
        q - size / 2,
        -size / 2,
        -Math.sign(s.driving) * Math.min(90, s.friction),
        0,
        red,
        "Fᶠ",
      );
    arrow(c, q, -size - 30, clamp(s.v * 4, -100, 100), 0, blue, "v");
    arrow(c, q, -size - 70, clamp(s.a * 10, -100, 100), 0, green, "a");
    c.restore();
  } else {
    floor(c);
    if (heroMode) {
      const trailLength = clamp(14 + s.v * 2.2, 14, 82);
      c.save();
      for (let i = 4; i >= 1; i--) {
        const progress = i / 4;
        c.globalAlpha = 0.08 + (1 - progress) * 0.1;
        circle(
          c,
          x - trailLength * progress,
          331,
          4 - progress * 0.55,
          orange,
        );
      }
      c.restore();
    }
    block(
      c,
      x,
      342,
      size,
      key === "newton" ? `${p.m} kg` : key === "friction" ? `${p.m} kg` : "TT",
    );
    if (key === "newton") {
      const pulse = heroMode ? 1 + Math.sin(s.t * 7) * 0.08 : 1;
      arrow(
        c,
        x + size / 2,
        342 - size / 2,
        p.force * 1.2 * pulse,
        0,
        red,
        "F",
      );
      if (s.friction)
        arrow(
          c,
          x - size / 2,
          342 - size / 2,
          -Math.min(100, s.friction * 3),
          0,
          red,
          "Fᶠ",
        );
    }
    if (key === "friction") {
      for (let i = 0; i < 70; i++)
        circle(c, 40 + i * 10, 350 + (i % 3) * 6, 1 + p.mu * 2, "#a5aeb7");
      arrow(c, x - size / 2, 320, -Math.min(100, s.f * 2), 0, red, "Fᶠ");
    }
    const velocityPulse = heroMode
      ? 1 + Math.sin(s.t * 7 + 0.8) * 0.08
      : 1;
    arrow(c, x, 235, clamp(s.v * 4 * velocityPulse, -120, 120), 0, blue, "v");
    arrow(c, x, 185, clamp(s.a * 10, -100, 100), 0, green, "a");
    if (rawX < 65 || rawX > 725)
      text(
        c,
        `Jism sahnadan ${rawX > 725 ? "o‘ngda" : "chapda"}`,
        rawX > 725 ? 745 : 55,
        120,
        orange,
        13,
        rawX > 725 ? "right" : "left",
      );
  }
  text(c, `x = ${format(s.x)} m`, 60, 420, ink, 17);
  text(c, `v = ${format(s.v)} m/s`, 320, 420, blue, 17);
  text(c, `a = ${format(s.a)} m/s²`, 590, 420, green, 17);
}
function flight(c, p, s, key, trails = []) {
  let maxX = Math.max(12, s.range * 1.1),
    maxY = Math.max(8, s.height * 1.2);
  for (const tr of trails) {
    const v = projectile(tr);
    maxX = Math.max(maxX, v.range * 1.1);
    maxY = Math.max(maxY, v.height * 1.2);
  }
  const scale = Math.min(640 / maxX, 280 / maxY),
    ox = 65,
    oy = 365;
  floor(c, oy);
  line(c, ox, oy, ox, 50, "#a3b2bf");
  text(c, "y (m)", ox, 35);
  text(c, "x (m)", 740, oy + 24);
  for (let i = 1; i < 5; i++) {
    const y = oy - ((i * maxY) / 4) * scale;
    text(c, format((i * maxY) / 4), ox - 10, y + 4, muted, 11, "right");
  }
  const trace = (params, color, dash = []) => {
    const r = projectile(params);
    c.beginPath();
    c.setLineDash(dash);
    c.strokeStyle = color;
    c.lineWidth = 2.4;
    for (let i = 0; i <= 100; i++) {
      const v = projectile(params, (r.duration * i) / 100),
        x = ox + v.x * scale,
        y = oy - v.y * scale;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
    c.setLineDash([]);
  };
  trails.forEach((tr, i) =>
    trace(tr, ["#a0b5cc", "#b0bb9a", "#b5a1c6"][i % 3], [5, 5]),
  );
  trace(p, "#f3b09a", [5, 5]);
  if (p.h) rect(c, 38, oy - p.h * scale, 25, p.h * scale, "#d7e0e6", 2);
  const x = ox + s.x * scale,
    y = oy - s.y * scale;
  ball(c, x, y);
  arrow(c, x, y, s.vx * 2, -s.vy * 2, blue);
  circle(c, ox + s.range * scale, oy, 6, orange);
  text(
    c,
    `${format(s.range)} m`,
    ox + s.range * scale,
    oy + 48,
    orange,
    15,
    "center",
  );
  text(c, `H = ${format(s.height)} m`, 740, 55, ink, 15, "right");
}
function track(c, p, s) {
  const ox = 400,
    oy = 345,
    scale = 40;
  const path = () => {
    c.beginPath();
    for (let q = -10; q <= 10; q += 0.1) {
      const x = ox + q * scale,
        y = oy - ((q * q) / 24) * scale;
      q === -10 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
  };
  path();
  c.lineWidth = 8;
  c.strokeStyle = "#dbe3e9";
  c.stroke();
  path();
  c.lineWidth = 2;
  c.strokeStyle = "#7e94a3";
  c.stroke();
  for (let q = -8; q <= 8; q += 2) {
    let x = ox + q * scale,
      y = oy - ((q * q) / 24) * scale;
    line(c, x, y + 8, x, 395, "#d2dce3", 3);
  }
  ball(c, ox + s.q * scale, oy - s.height * scale - 18, 18);
  const values = [s.kinetic, s.potential, s.heat];
  values.forEach((v, i) => {
    const x = 55 + i * 245;
    rect(c, x, 45, 205, 8, "#e3e9ee", 4);
    rect(c, x, 45, (205 * v) / s.initial, 8, [orange, blue, "#c79745"][i], 4);
    text(c, `${uz.energyLabels[i]}  ${format(v)} J`, x, 30, ink, 13);
  });
  text(
    c,
    `${uz.energySum}: ${format(s.initial)} J`,
    400,
    435,
    ink,
    16,
    "center",
  );
}
function springDraw(c, p, s) {
  const x = 285,
    top = 60,
    bottom = 240 + s.x * 105;
  line(c, 195, top, 375, top, ink, 7);
  line(c, x, top, x, top + 20, muted, 2);
  c.beginPath();
  c.strokeStyle = "#748b9d";
  c.lineWidth = 3;
  c.moveTo(x, top + 20);
  for (let i = 0; i < 22; i++)
    c.lineTo(x + (i % 2 ? 17 : -17), top + 25 + ((bottom - top - 30) * i) / 21);
  c.lineTo(x, bottom);
  c.stroke();
  block(c, x, bottom + 55, 55, `${p.m} kg`);
  line(c, 370, 265, 570, 265, "#bbc8d3", 1, [4, 4]);
  text(c, "x = 0", 590, 269);
  arrow(c, 435, 265, 0, s.x * 105, blue, "x");
  text(c, `T = ${format(s.period)} s`, 610, 130, ink, 25, "center");
  text(c, `x = ${format(s.x)} m`, 610, 170, blue, 18, "center");
}
function bridge(c, p, s, t) {
  const rawDisp = s.x * 55,
    disp = clamp(rawDisp, -95, 95);
  line(c, 110, 390, 110, 150, "#7890a1", 15);
  line(c, 690, 390, 690, 150, "#7890a1", 15);
  c.beginPath();
  c.moveTo(75, 245);
  c.quadraticCurveTo(400, 245 + disp * 2, 725, 245);
  c.lineWidth = 9;
  c.strokeStyle = orange;
  c.stroke();
  for (let i = 0; i < 13; i++) {
    const x = 110 + i * 48.3,
      q = (x - 75) / 650,
      y = 245 + disp * 4 * q * (1 - q);
    line(
      c,
      x,
      y,
      x,
      150 + 100 * Math.sin(((x - 110) / 580) * Math.PI),
      "#9eb1bd",
      1.5,
    );
  }
  c.beginPath();
  c.moveTo(110, 150);
  c.quadraticCurveTo(400, 365, 690, 150);
  c.lineWidth = 3;
  c.strokeStyle = "#7f97a7";
  c.stroke();
  line(c, 40, 395, 760, 395, "#b4c9d6", 3);
  text(
    c,
    `ω / ω₀ = ${format(p.frequency / p.natural)}`,
    400,
    60,
    ink,
    22,
    "center",
  );
  text(c, `A = ${format(s.amplitude)} m`, 400, 95, orange, 18, "center");
  if (Math.abs(rawDisp) > 95)
    text(c, "Vizual chegara: ±95 px", 400, 120, red, 12, "center");
  arrow(c, 750, 270, 0, Math.cos(p.frequency * t) * 50, red, "F");
}
function water(c, p, s) {
  const x = 320,
    waterY = 175,
    pixels = 120 / s.side;
  rect(
    c,
    150,
    waterY,
    350,
    205,
    p.fluid > 2000 ? "#a6b4c666" : p.fluid < 950 ? "#e4be6745" : "#90c8e34d",
    0,
  );
  line(c, 150, waterY, 500, waterY, blue, 2);
  line(c, 150, 110, 150, 385, "#879cae", 5);
  line(c, 150, 385, 500, 385, "#879cae", 5);
  line(c, 500, 110, 500, 385, "#879cae", 5);
  const size = 60,
    y = waterY + (s.depth / s.side) * 60;
  block(c, x, y + size / 2, size, "");
  text(c, `${p.rho}`, x, y + 5, "white", 14, "center");
  arrow(c, x + 50, y, 0, -Math.min(105, (s.force / s.weight) * 65), blue, "Fₐ");
  arrow(c, x - 50, y, 0, 65, red, "mg");
  if (s.normal > 0) arrow(c, x, y + 36, 0, -55, green, "N");
  text(c, uz.floating[s.status], 630, 210, ink, 24, "center");
  text(c, `Fₐ = ${format(s.force)} N`, 630, 250, blue, 17, "center");
  text(c, uz.waterline, 170, waterY - 14);
  if (s.onBottom) text(c, "Jism tubda", 630, 285, green, 15, "center");
}
const particleSeeds = Array.from({ length: 100 }, (_, i) => ({
  x: ((i * 37 + 13) % 101) / 101,
  y: ((i * 61 + 7) % 103) / 103,
  angle: i * 2.39996,
  speed: 0.6 + ((i * 17) % 13) / 13,
}));
function gasDraw(c, p, s, t) {
  const w = 230 + (270 * (p.volume - 5)) / 45,
    x = (800 - w) / 2,
    y = 100,
    h = 245;
  rect(c, x, y, w, h, "#edf3f6", 5);
  c.strokeStyle = "#7f96a8";
  c.lineWidth = 3;
  c.strokeRect(x, y, w, h);
  rect(c, x + w - 8, y - 8, 16, h + 16, "#9eafbd", 3);
  const count = Math.round(30 + Math.min(3, p.moles) * 20),
    vel = 38 * Math.sqrt(p.temperature / 300) * Math.sqrt(0.028 / p.molarMass);
  const bounce = (v, max) => {
    let z = ((v % (2 * max)) + 2 * max) % (2 * max);
    return z > max ? 2 * max - z : z;
  };
  for (let i = 0; i < count; i++) {
    const seed = particleSeeds[i];
    const px =
        x +
        7 +
        bounce(
          seed.x * (w - 14) + Math.cos(seed.angle) * vel * seed.speed * t,
          w - 14,
        ),
      py =
        y +
        7 +
        bounce(
          seed.y * (h - 14) + Math.sin(seed.angle) * vel * seed.speed * t,
          h - 14,
        );
    circle(c, px, py, 3.5, i % 4 === 0 ? orange : "#588caf");
  }
  text(c, `${p.temperature} K`, x, 70, orange, 19);
  text(c, `${p.volume} L`, x + w, 70, ink, 19, "right");
  text(c, `p = ${format(s.pressure / 1000)} kPa`, 400, 400, ink, 22, "center");
}
function charges(c, p, s) {
  const d = 80 + p.r * 135,
    x1 = 400 - d / 2,
    x2 = 400 + d / 2,
    y = 235;
  const charge = (x, q) => {
    circle(c, x, y, 45, q > 0 ? "#f1592a14" : q < 0 ? "#3883d915" : "#d9e1e8");
    circle(c, x, y, 30, q > 0 ? orange : q < 0 ? blue : muted);
    text(c, q > 0 ? "+" : q < 0 ? "−" : "0", x, y + 9, "white", 30, "center");
    text(c, `${q} μC`, x, y + 80, ink, 17, "center");
  };
  charge(x1, p.q1);
  charge(x2, p.q2);
  let len = Math.min(95, 40 + Math.log1p(s.force) * 65);
  if (s.force > 0) {
    const sign = Math.sign(s.signed);
    if (sign < 0) len = Math.min(len, (d - 70) / 2 - 4);
    arrow(c, x1 - 35 * sign, y, -len * sign, 0, red, "F");
    arrow(c, x2 + 35 * sign, y, len * sign, 0, red, "F");
  }
  measure(c, x1, 140, x2, 140, `r = ${p.r} m`);
  text(c, "Strelka: logarifmik masshtab", 400, 420, muted, 12, "center");
  text(
    c,
    s.force === 0 ? uz.zeroForce : s.signed > 0 ? uz.repel : uz.attract,
    400,
    380,
    ink,
    22,
    "center",
  );
}
function electrical(c, p, s, key, t) {
  const x = 190,
    y = 150,
    w = 410,
    h = 190;
  line(c, x, y, x + w, y, "#647f90", 4);
  line(c, x + w, y, x + w, y + h, "#647f90", 4);
  line(c, x, y + h, x + w, y + h, "#647f90", 4);
  line(c, x, y, x, y + h / 2 - 20, "#647f90", 4);
  line(c, x, y + h / 2 + 20, x, y + h, "#647f90", 4);
  line(c, x - 25, 235, x + 25, 235, orange, 4);
  line(c, x - 15, 255, x + 15, 255, orange, 4);
  text(c, "+", x - 40, 231, orange, 17);
  text(
    c,
    `${key === "ohm" ? p.voltage : p.emf} V`,
    x - 45,
    282,
    ink,
    17,
    "right",
  );
  rect(c, 335, y - 15, 110, 30, "#f8fafb", 0);
  line(c, 335, y, 345, y, ink, 2);
  for (let i = 0; i < 8; i++)
    line(
      c,
      345 + i * 11,
      y + (i % 2 ? -12 : 12),
      356 + i * 11,
      y + (i % 2 ? 12 : -12),
      ink,
      2,
    );
  text(c, `${p.resistance} Ω`, 390, 115, ink, 17, "center");
  const glow = clamp(Math.log1p(s.power) / 5, 0, 1);
  c.save();
  c.shadowBlur = glow * 65;
  c.shadowColor = "#ffc55b";
  circle(c, x + w, 250, 31, `rgba(255,192,70,${0.1 + glow * 0.9})`);
  c.restore();
  c.beginPath();
  c.arc(x + w, 250, 31, 0, Math.PI * 2);
  c.strokeStyle = "#ba995e";
  c.lineWidth = 2;
  c.stroke();
  line(c, x + w - 15, 235, x + w + 15, 265, "#ba995e", 2);
  line(c, x + w + 15, 235, x + w - 15, 265, "#ba995e", 2);
  if (s.current > 0)
    for (let i = 0; i < 14; i++) {
      const travel = (i / 14 + t * Math.min(2, s.current) * 0.08) % 1,
        dist = travel * 1200;
      let px, py;
      if (dist < 410) {
        px = x + dist;
        py = y;
      } else if (dist < 600) {
        px = x + w;
        py = y + dist - 410;
      } else if (dist < 1010) {
        px = x + w - (dist - 600);
        py = y + h;
      } else {
        px = x;
        py = y + h - (dist - 1010);
      }
      circle(c, px, py, 3.5, orange);
    }
  if (key === "circuit") {
    rect(c, 240, 322, 60, 35, "#fbe7df", 3);
    text(c, `r=${p.internal} Ω`, 270, 345, orange, 13, "center");
  }
  text(c, `I = ${format(s.current)} A`, 400, 410, ink, 22, "center");
}
function magnet(c, p, s, t) {
  const coilX = 405;
  for (let i = 0; i < 9; i++) {
    c.beginPath();
    c.ellipse(coilX + i * 10, 215, 13, 60, 0, 0, Math.PI * 2);
    c.strokeStyle = i % 2 ? "#bb713f" : "#dba772";
    c.lineWidth = 4;
    c.stroke();
  }
  const mx = 410 + s.x * 120;
  rect(c, mx - 60, 194, 60, 42, red, 3);
  rect(c, mx, 194, 60, 42, blue, 3);
  text(c, "N", mx - 30, 221, "white", 19, "center");
  text(c, "S", mx + 30, 221, "white", 19, "center");
  line(c, 405, 274, 405, 345, muted, 2);
  line(c, 485, 274, 485, 345, muted, 2);
  circle(c, 445, 345, 36, "#fff");
  c.beginPath();
  c.arc(445, 345, 36, 0, Math.PI * 2);
  c.strokeStyle = muted;
  c.stroke();
  const a = -Math.PI / 2 + clamp(Math.atan(s.current * 15), -1.1, 1.1);
  arrow(c, 445, 355, 27 * Math.cos(a), 27 * Math.sin(a), red);
  text(c, "−", 417, 337);
  text(c, "+", 473, 337);
  text(c, "0", 445, 323, muted, 10, "center");
  arrow(c, mx, 145, s.velocity * 28, 0, blue, "v");
  text(c, `ε = ${format(s.emf)} V`, 100, 85, ink, 22);
}
function optics(c, p, s) {
  const ox = 400,
    oy = 250,
    extent = Math.max(
      3,
      p.object,
      Number.isFinite(s.image) ? Math.min(10, Math.abs(s.image)) : 3,
    ),
    scale = 330 / extent,
    dx = -p.object * scale,
    h = p.height * scale * 2,
    ix = s.image * scale,
    ih = -s.magnification * h;
  line(c, 35, oy, 765, oy, "#91a3b0", 1);
  c.beginPath();
  c.ellipse(ox, oy, 15, 155, 0, 0, Math.PI * 2);
  c.fillStyle = "#87b9e326";
  c.fill();
  c.strokeStyle = blue;
  c.lineWidth = 2;
  c.stroke();
  for (const sign of [-1, 1]) {
    circle(c, ox + sign * p.focal * scale, oy, 4, blue);
    text(
      c,
      sign < 0 ? "−F" : "F",
      ox + sign * p.focal * scale,
      oy + 26,
      blue,
      13,
      "center",
    );
  }
  arrow(c, ox + dx, oy, 0, -h, orange, uz.object);
  line(c, ox + dx, oy - h, ox, oy - h, orange, 2);
  const rightY = oy - h + (365 / (p.focal * scale)) * h;
  line(c, ox, oy - h, 765, rightY, orange, 2);
  const centralSlope = -h / dx;
  line(c, ox + dx, oy - h, 765, oy + centralSlope * 365, green, 2);
  if (!s.atFocus) {
    if (s.image < 0) {
      line(c, ox, oy - h, ox + ix, oy + ih, orange, 1.5, [5, 5]);
      line(c, ox, oy, ox + ix, oy + ih, green, 1.5, [5, 5]);
    }
    if (Math.abs(ix) < 365 && Math.abs(ih) < 190)
      arrow(c, ox + ix, oy, 0, ih, blue, uz.image);
    else
      text(c, `${uz.image}: ${format(s.image)} m`, 600, 75, blue, 16, "center");
  }
  text(
    c,
    s.atFocus ? uz.focus : s.real ? uz.real : uz.virtual,
    400,
    430,
    ink,
    s.atFocus ? 14 : 19,
    "center",
  );
}
export function renderSimulation(ctx, state) {
  const { config, p, s, t, trails = [], hero = false } = state;
  grid(ctx);
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
      springDraw(ctx, p, s);
      break;
    case "resonance":
      bridge(ctx, p, s, t);
      break;
    case "buoyancy":
      water(ctx, p, s);
      break;
    case "gas":
      gasDraw(ctx, p, s, t);
      break;
    case "coulomb":
      charges(ctx, p, s);
      break;
    case "ohm":
    case "circuit":
      electrical(ctx, p, s, config.key, t);
      break;
    case "induction":
      magnet(ctx, p, s, t);
      break;
    case "lens":
      optics(ctx, p, s);
      break;
  }
  ctx.restore();
}
