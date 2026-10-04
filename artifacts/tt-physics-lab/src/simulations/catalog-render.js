import { format, formatResult } from "../components/ResultCard.js";

// Barcha yangi modellar bir xil laboratoriya palitrasida chiziladi.
export function renderCatalog(c, { config, p, s, t }, theme) {
  c.scale(1, 0.92);
  const O = "#F1592A",
    B = "#3883d9",
    G = "#19a378",
    R = "#e05757";
  const txt = (v, x, y, color = theme.ink, size = 16, align = "center") => {
    if (c.compactMode) size = Math.max(size, 20);
    c.font = `500 ${size}px Inter, Segoe UI, sans-serif`;
    c.fillStyle = color;
    c.textAlign = align;
    c.fillText(String(v), x, y, 710);
  };
  const line = (x, y, X, Y, color = theme.line, width = 2, dash = []) => {
    c.beginPath();
    c.strokeStyle = color;
    c.lineWidth = width;
    c.setLineDash(dash);
    c.moveTo(x, y);
    c.lineTo(X, Y);
    c.stroke();
    c.setLineDash([]);
  };
  const box = (x, y, w, h, color = theme.floor) => {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
    c.strokeStyle = theme.line;
    c.lineWidth = 1;
    c.strokeRect(x, y, w, h);
  };
  const ball = (x, y, r, color = O) => {
    c.beginPath();
    c.arc(x, y, Math.max(1, r), 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
  };
  const circle = (x, y, r, color = theme.line) => {
    c.beginPath();
    c.arc(x, y, Math.max(1, r), 0, Math.PI * 2);
    c.strokeStyle = color;
    c.lineWidth = 2;
    c.stroke();
  };
  const arrow = (x, y, X, Y, color = O, label = "") => {
    line(x, y, X, Y, color, 3);
    const a = Math.atan2(Y - y, X - x);
    line(
      X,
      Y,
      X - 10 * Math.cos(a - 0.45),
      Y - 10 * Math.sin(a - 0.45),
      color,
      3,
    );
    line(
      X,
      Y,
      X - 10 * Math.cos(a + 0.45),
      Y - 10 * Math.sin(a + 0.45),
      color,
      3,
    );
    if (label) txt(label, (x + X) / 2, (y + Y) / 2 - 12, color, 14);
  };
  const plot = (fn, x = 110, y = 280, w = 580, h = 100, color = O) => {
    c.beginPath();
    c.strokeStyle = color;
    c.lineWidth = 2.5;
    for (let i = 0; i <= 240; i++) {
      const X = x + (w * i) / 240,
        Y = y - h * fn(i / 240);
      if (i) c.lineTo(X, Y);
      else c.moveTo(X, Y);
    }
    c.stroke();
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const coil = (x, y, w, h = 25) => {
    line(x, y, x + 15, y);
    let X = x + 15,
      Y = y;
    for (let i = 0; i < 16; i++) {
      const nX = x + 15 + ((w - 30) * (i + 1)) / 16,
        nY = y + (i % 2 ? h : -h);
      line(X, Y, nX, nY);
      X = nX;
      Y = nY;
    }
    line(X, Y, x + w, y);
  };
  const block = (x, y, label = "m", color = O) => {
    box(x, y, 60, 55, color);
    txt(label, x + 30, y + 34, "#fff", 18);
  };
  const energy = (values, total) => {
    txt("Energiya balansi · J", 105, 320, theme.muted, 13, "left");
    values.forEach(([label, value, color], i) => {
      const y = 345 + i * 24;
      txt(`${label}: ${format(value)}`, 105, y + 5, color, 12, "left");
      box(290, y - 7, 370, 12);
      c.fillStyle = color;
      c.fillRect(
        290,
        y - 7,
        370 * clamp(value / Math.max(total, 1e-12), 0, 1),
        12,
      );
    });
  };
  txt(config.title, 400, 43, theme.ink, 19);
  txt(
    config.static
      ? "Parametrni o‘zgartiring — model qayta hisoblanadi"
      : `Vaqt: ${config.timeScale && t > 0 && t < 1 ? t.toExponential(3) : format(t)} s`,
    400,
    69,
    theme.muted,
    12,
  );
  switch (config.visual) {
    case "cart": {
      line(75, 285, 725, 285);
      const scale =
          650 /
          Math.max(1, Math.abs(p.x0) + Math.abs(p.v0) * config.duration * 2),
        x = 400 + s.x * scale;
      block(clamp(x, 80, 660), 230, "x");
      arrow(
        clamp(x, 80, 660) + 30,
        215,
        clamp(x, 80, 660) + 30 + clamp(s.v * 5, -90, 90),
        215,
        B,
        `v=${format(s.v)} m/s`,
      );
      txt(`x=${format(s.x)} m`, 400, 335);
      break;
    }
    case "relative": {
      box(95, 100, 610, 230, B + "18");
      for (let i = 0; i < 5; i++)
        arrow(130 + i * 110, 140, 130 + i * 110, 180, B);
      const x = 150 + s.x * 12,
        y = 260 - s.y * 12;
      ball(clamp(x, 120, 660), clamp(y, 120, 310), 18, O);
      arrow(150, 260, clamp(x, 120, 660), clamp(y, 120, 310), O);
      txt(
        "Qayiq + oqim → qirg‘oqqa nisbatan harakat",
        400,
        365,
        theme.muted,
        15,
      );
      break;
    }
    case "meeting":
    case "collision": {
      const span = Math.max(30, Math.abs(s.x1), Math.abs(s.x2)),
        map = (x) => 100 + (600 * (x + span)) / (3 * span);
      line(70, 265, 730, 265);
      const x = map(s.x1),
        X = map(s.x2);
      block(clamp(x - 65, 75, 660), 210, "1");
      block(clamp(X + 5, 75, 660), 210, "2", B);
      if (config.visual === "collision")
        energy(
          [
            ["Kinetik", s.kinetic, O],
            ["Issiqlik", s.heat, R],
          ],
          s.kineticBefore,
        );
      else
        txt(
          s.meeting === null
            ? "Kelajakda uchrashmaydi"
            : `Uchrashish: ${format(s.meeting)} s`,
          400,
          345,
        );
      break;
    }
    case "orbit": {
      const a = config.key === "lorentz" ? s.phase : (s.angle ?? 0),
        r =
          config.key === "lorentz"
            ? clamp((s.spiralRadius ?? 0) * 3000, 5, 140)
            : config.key === "circular" ? 30 + p.radius * 25 : 125;
      if (config.key === "lorentz") {
        if (p.field > 0) circle(400, 230, r, B);
        ball(400, 230, 6, theme.muted);
        ball(
          p.field > 0
            ? 400 + r * Math.cos(a)
            : clamp(150 + s.x * 200, 150, 700),
          p.field > 0 ? 230 + r * Math.sin(a) : 230,
          12,
          O,
        );
        txt(
          p.field === 0
            ? "B=0: zarracha to‘g‘ri chiziqda harakatlanadi"
            : "Magnit kuch tezlikka perpendikulyar",
          400,
          382,
          theme.muted,
          14,
        );
      } else {
        circle(400, 230, r, B);
        ball(400, 230, config.key === "gravity" ? r * 6371 / (6371 + p.altitude) : 7, B);
        ball(400 + r * Math.cos(a), 230 + r * Math.sin(a), 15, O);
        arrow(
          400 + r * Math.cos(a),
          230 + r * Math.sin(a),
          400 + (r - 45) * Math.cos(a),
          230 + (r - 45) * Math.sin(a),
          G,
          "aₙ",
        );
      }
      break;
    }
    case "gears": {
      const scale = 130 / Math.max(p.r1, p.r2),
        r1 = p.r1 * scale,
        r2 = p.r2 * scale,
        x1 = 400 - r1,
        x2 = 400 + r2;
      for (const [x, r, a, color] of [
        [x1, r1, s.angle, O],
        [x2, r2, s.angle2, B],
      ]) {
        circle(x, 235, r, color);
        for (let i = 0; i < 12; i++) {
          const q = a + (i * Math.PI) / 6;
          line(x, 235, x + r * Math.cos(q), 235 + r * Math.sin(q), color);
        }
      }
      break;
    }
    case "block":
      block(360, 210, "m");
      txt(`V = ${format(p.volume)} L`, 400, 315);
      break;
    case "reaction":
      block(240, 205, "m₁");
      block(510, 205, "m₂", B);
      arrow(300, 230, 390, 230, O, `F=${format(s.force)} N`);
      arrow(510, 275, 420, 275, B, `−F=${format(s.reaction)} N`);
      break;
    case "spring": {
      box(100, 140, 15, 170);
      const extension = s.extension ?? p.extension ?? 0,
        X = clamp(400 + (config.key === "elastic" ? extension / p.length * 3e6 : extension * 180), 160, 650);
      coil(115, 235, X - 115);
      block(X, 210);
      txt("Cho‘zilish ko‘rgazmali masshtabda", 400, 355, theme.muted, 14);
      break;
    }
    case "elevator": {
      // Kamera lift bilan yuradi; shaxta belgilari ko‘chishga mos siljiydi.
      const offset = ((s.y * 24) % 70 + 70) % 70;
      line(240, 70, 240, 390);
      line(560, 70, 560, 390);
      for (let y = 70 + offset; y < 390; y += 70) {
        line(240, y, 280, y, theme.muted, 3);
        line(520, y, 560, y, theme.muted, 3);
      }
      box(285, 100, 230, 240);
      block(370, 270);
      const forceScale = 65 / Math.max(s.weight, s.normal, 1);
      if (s.normal > 1e-8)
        arrow(455, 275, 455, 275 - s.normal * forceScale, G, `N=${format(s.normal)} N`);
      arrow(345, 270, 345, 270 + s.weight * forceScale, O, `mg=${format(s.weight)} N`);
      txt(s.normal < 1e-8 ? "Erkin tushish: tayanch reaksiyasi N=0" : "Kamera lift bilan birga harakatlanadi", 400, 385);
      break;
    }
    case "vectors": {
      const magnitude = Math.max(p.f1 || 0, p.f2 || 0, p.force || 0, 1),
        scale = 130 / magnitude,
        q = ((p.angle || 0) * Math.PI) / 180;
      if (config.key === "work") {
        arrow(280, 260, 530, 260, B, "Ko‘chish");
        arrow(
          280,
          260,
          280 + p.force * scale * Math.cos(q),
          260 - p.force * scale * Math.sin(q),
          O,
          `F=${format(p.force)} N`,
        );
        break;
      }
      // Koordinata masshtabi butun tajriba davomida o‘zgarmaydi.
      const extent = Math.max(Math.abs(s.ax), Math.abs(s.ay), 0.01) * config.duration ** 2 / 2;
      const positionScale = 180 / extent;
      const X = 300 + s.x * positionScale, Y = 310 - s.y * positionScale;
      line(300, 310, X, Y, theme.muted, 2, [4, 5]);
      ball(X, Y, 12);
      txt(`x=${format(s.x)} m · y=${format(s.y)} m`, 400, 390);
      arrow(X, Y, X + p.f1 * scale, Y, O, `F₁=${format(p.f1)} N`);
      arrow(
        X,
        Y,
        X + p.f2 * scale * Math.cos(q),
        Y - p.f2 * scale * Math.sin(q),
        B,
        `F₂=${format(p.f2)} N`,
      );
      if (s.fx !== undefined)
        arrow(X, Y, X + s.fx * scale, Y - s.fy * scale, G, `|F|=${format(s.force)} N`);
      break;
    }
    case "lever": {
      const scale = 220 / Math.max(p.arm1, p.arm2);
      line(100, 200, 700, 200, theme.ink, 5);
      line(400, 202, 355, 300);
      line(400, 202, 445, 300);
      line(355, 300, 445, 300);
      const x = 400 - p.arm1 * scale,
        X = 400 + p.arm2 * scale;
      line(x, 200, x, 235);
      line(X, 200, X, 235);
      block(x - 30, 235, "m₁");
      block(X - 30, 235, "m₂", B);
      const weightScale = 65 / Math.max(p.m1 * 9.8, p.m2 * 9.8, 1);
      arrow(x - 43, 250, x - 43, 250 + p.m1 * 9.8 * weightScale, O, `${format(p.m1 * 9.8)} N`);
      arrow(X + 43, 250, X + 43, 250 + p.m2 * 9.8 * weightScale, B, `${format(p.m2 * 9.8)} N`);
      txt(
        Math.abs(s.net) < 0.01
          ? "Muvozanat: ΣM=0"
          : `Natijaviy moment: ${format(s.net)} N·m`,
        400,
        350,
        Math.abs(s.net) < 0.01 ? G : O,
      );
      break;
    }
    case "fluid":
    case "vessels":
    case "capillary": {
      if (config.visual === "capillary") {
        const level=250, lift=clamp(s.height*4000,-90,150);
        box(180,190,300,155);box(180,level,300,95,B+'55');
        box(365,95,30,240);box(368,level-lift,24,95+lift,B+'85');
        line(150,level,570,level,theme.muted,1,[4,5]);
        txt(`h=${format(s.height*1000)} mm`,530,level-lift,O,18);
        txt('Kapillyardagi sath · balandlik kattalashtirilgan',400,390,theme.muted,14);
        break;
      }
      box(140, 130, 220, 210);
      box(460, 130, 140, 210);
      box(360, 295, 100, 45, B + "45");
      const h1 = p.h ?? 0.8,
        h2 = s.h2 ?? s.height ?? h1,
        scale = 130 / Math.max(1, Math.abs(h1), Math.abs(h2));
      box(140, 340 - h1 * scale, 220, h1 * scale, B + "65");
      box(
        460,
        340 - clamp(h2 * scale, 0, 205),
        140,
        clamp(h2 * scale, 0, 205),
        B + "65",
      );
      if (config.visual === "capillary") {
        line(520, 110, 520, 335, theme.ink, 3);
        line(540, 110, 540, 335, theme.ink, 3);
        txt(s.height < 0 ? "Sath pasayadi" : "Sath ko‘tariladi", 400, 385);
      } else
        txt(
          "Gidrostatik bosim sath va zichlikka bog‘liq",
          400,
          385,
          theme.muted,
          14,
        );
      break;
    }
    case "hydraulic": {
      const width = clamp(Math.sqrt(p.s2 / p.s1) * 65, 70, 230);
      box(160, 150, 90, 180, B + "30");
      box(440, 150, width, 180, B + "30");
      box(250, 285, 190, 45, B + "30");
      line(160, 175, 250, 175, O, 6);
      line(440, 220, 440 + width, 220, O, 6);
      arrow(205, 100, 205, 170, O, `F₁=${format(p.force)} N`);
      arrow(440 + width / 2, 215, 440 + width / 2, 110, G, `F₂=${format(s.bigForce)} N`);
      txt("p₁=p₂ · ideal pressda ish saqlanadi", 400, 380);
      break;
    }
    case "pipe": {
      const h1 = clamp(Math.sqrt(p.area1) * 12, 30, 100),
        h2 = clamp(Math.sqrt(p.area2) * 12, 30, 100);
      line(100, 230 - h1, 300, 230 - h1, B, 3);
      line(300, 230 - h1, 500, 230 - h2, B, 3);
      line(500, 230 - h2, 700, 230 - h2, B, 3);
      line(100, 230 + h1, 300, 230 + h1, B, 3);
      line(300, 230 + h1, 500, 230 + h2, B, 3);
      line(500, 230 + h2, 700, 230 + h2, B, 3);
      // Hajm koordinatasi uzluksizlik qonuniga ko‘ra mahalliy tezlikni beradi.
      const a1 = p.area1, a2 = p.area2;
      const volume = 200 * a1 + 100 * (a1 + a2) + 200 * a2;
      for (let i = 0; i < 24; i++) {
        const u = ((i * volume / 24 + t * p.velocity * a1 * 45) % volume + volume) % volume;
        let dx;
        if (u < 200 * a1) dx = u / a1;
        else if (u < 200 * a1 + 100 * (a1 + a2)) {
          const v = u - 200 * a1, k = (a2 - a1) / 200;
          dx = 200 + 2 * v / (a1 + Math.sqrt(a1 * a1 + 2 * k * v));
        } else dx = 400 + (u - 200 * a1 - 100 * (a1 + a2)) / a2;
        const h = dx < 200 ? h1 : dx > 400 ? h2 : h1 + (h2 - h1) * (dx - 200) / 200;
        ball(100 + dx, 230 + ((i % 3) - 1) * h * 0.55, 4, B);
      }
      arrow(140, 230, 240, 230, O, "v₁");
      arrow(540, 230, 640, 230, G, `v₂=${format(s.v2)}`);
      txt("Q=S₁v₁=S₂v₂", 400, 385);
      break;
    }
    case "pendulum": {
      const L = clamp(p.length * 100, 70, 180),
        x = 400 + L * Math.sin(s.theta),
        y = 100 + L * Math.cos(s.theta);
      ball(400, 100, 5, theme.ink);
      line(400, 100, x, y, theme.ink, 3);
      ball(x, y, 18, O);
      const weight = 9.8;
      const tension = Math.max(0, weight * Math.cos(s.theta) + s.velocity ** 2 / p.length);
      const forceScale = Math.min(7, 95 / Math.max(weight, tension, 1));
      arrow(x, y, x, y + weight * forceScale, B, `mg = ${format(weight)} N`);
      arrow(x, y, x - Math.sin(s.theta) * tension * forceScale,
        y - Math.cos(s.theta) * tension * forceScale, G, `T = ${format(tension)} N`);
      energy(
        [
          ["Kinetik", s.kinetic, O],
          ["Potensial", s.potential, B],
          ["Issiqlik", s.heat, R],
        ],
        s.initial,
      );
      break;
    }
    case "wave": {
      line(80, 210, 720, 210);
      const phase = s.phase ?? 0,
        A = config.key === "wave" ? p.amplitude * 90 : 70,
        waves = config.key === "wave" ? 5 / p.wavelength : 3;
      plot(
        (u) => Math.sin(2 * Math.PI * u * waves - phase),
        80,
        210,
        640,
        A,
        O,
      );
      if (config.key === "emwave")
        plot(
          (u) => Math.sin(2 * Math.PI * u * waves - phase),
          80,
          210,
          640,
          40,
          B,
        );
      else
        for (let i = 0; i < 55; i++)
          ball(
            80 +
              i * 11 +
              20 *
                p.amplitude *
                Math.cos(((2 * Math.PI * i) / 54) * waves - phase),
            320,
            3,
            B,
          );
      txt(
        "Profil yuqorida · bo‘ylama tebranish pastda · masshtab ko‘rgazmali",
        400,
        375,
        theme.muted,
        13,
      );
      break;
    }
    case "gas": {
      const ratio = (s.volume ?? p.volume) / p.volume,
        h = clamp(140 * ratio, 70, 210);
      box(245, 330 - h, 310, h, B + "10");
      line(245, 330 - h, 555, 330 - h, O, 7);
      for (let i = 0; i < 36; i++) {
        const x = 260 + ((i * 47 + (t || 0) * 25) % 280),
          y = 345 - h + ((i * 31 + (t || 0) * 20) % Math.max(1, h - 30));
        ball(x, y, 3, i % 3 ? B : O);
      }
      txt("Ideal gaz · zarralar harakati sxematik", 400, 385, theme.muted, 14);
      break;
    }
    case "thermal": {
      if (config.key === "heatEngine") {
        box(110, 105, 170, 90, R + "35");
        txt(`${format(p.hot)} K`, 195, 160, R);
        box(520, 260, 170, 80, B + "35");
        txt(`${format(p.cold)} K`, 605, 310, B);
        circle(400, 220, 45, O);
        arrow(280, 160, 365, 200, R, "Q₁");
        arrow(435, 240, 520, 290, B, "Q₂");
        arrow(400, 265, 400, 345, G, "A");
        txt(
          s.warning ? "Karno chegarasi buzildi" : "Q₁ = A + Q₂",
          400,
          385,
          s.warning ? R : theme.ink,
          16,
        );
      } else {
        box(230, 130, 340, 160, R + "15");
        txt(`T = ${format(s.temperature2)} K`, 400, 215, O, 26);
        txt(`Q = ${format(s.heat)} J`, 400, 340);
      }
      break;
    }
    case "expansion": {
      const ratio = s.length2 / p.length;
      box(120, 165, 450, 35, B + "65");
      box(120, 245, 450 * ratio, 35, O);
      txt("Boshlang‘ich uzunlik", 350, 145, B);
      txt("Qizdirilgan / sovitilgan uzunlik", 350, 325, O);
      break;
    }
    case "charges": {
      for (const [x, q, color] of [
        [240, s.q1, O],
        [560, s.q2, B],
      ]) {
        ball(x, 230, 45, color);
        txt(q >= 0 ? "+" : "−", x, 244, "#fff", 38);
        txt(`${format(q)} μC`, x, 315, color);
      }
      arrow(300, 150, 500, 150, G, "Zaryad ko‘chishi");
      break;
    }
    case "field": {
      if (config.key === "fieldWork" || config.key === "magneticMaterial") {
        box(150,105,25,250,O+'45');box(625,105,25,250,B+'45');
        if(s.field !== 0 && p.field !== 0)for(let i=0;i<5;i++)arrow(205,140+i*45,590,140+i*45,B, i===0 ? config.key==='fieldWork'?'E':'B':'');
        if(config.key==='fieldWork')ball(clamp(400+p.distance*80,210,590),240,15,O);
        else for(let i=0;i<4;i++)arrow(285+i*60,220,315+i*60,220,G);
        txt(config.key==='fieldWork'?'Bir jinsli elektr maydon':'Modda ichidagi bir jinsli magnit maydon',400,390,theme.muted,14);
        break;
      }
      if (config.key === "sphere" && p.mode === 1) {
        line(400, 105, 400, 360, O, 6);
        for (let i = 0; i < 6; i++) {
          const y = 125 + i * 40;
          if (p.surfaceCharge > 0) {arrow(410, y, 600, y, B);arrow(390, y, 200, y, B);}
          if (p.surfaceCharge < 0) {arrow(600, y, 410, y, B);arrow(200, y, 390, y, B);}
        }
        txt(
          "Cheksiz tekislik · maydon masofaga bog‘liq emas",
          400,
          390,
          theme.muted,
          13,
        );
        break;
      }
      const isWire = config.key === "magnetic",
        positive = (p.charge ?? p.field ?? 1) >= 0;
      ball(400, 230, 25, O);
      txt(isWire ? "I" : positive ? "+" : "−", 400, 238, "#fff", 23);
      for (let i = 1; i < 4; i++) circle(400, 230, 45 + i * 35, B);
      for (let i = 0; i < 8; i++) {
        const q = (i * Math.PI) / 4;
        if (isWire)
          arrow(
            400 + 90 * Math.cos(q),
            230 + 90 * Math.sin(q),
            400 + 90 * Math.cos(q) - 25 * Math.sin(q),
            230 + 90 * Math.sin(q) + 25 * Math.cos(q),
            B,
          );
        else {
          const a = positive ? 55 : 150,
            b = positive ? 150 : 55;
          arrow(
            400 + a * Math.cos(q),
            230 + a * Math.sin(q),
            400 + b * Math.cos(q),
            230 + b * Math.sin(q),
            B,
          );
        }
      }
      txt(
        isWire
          ? "Magnit chiziqlar simni aylanib o‘tadi"
          : "Maydon chiziqlari va ekvipotensial kesimlar",
        400,
        390,
        theme.muted,
        14,
      );
      break;
    }
    case "capacitor":
    case "lc": {
      const gap =
        config.key === "capacitor" ? clamp((p.gap ?? 2) * 12, 25, 120) : 75;
      box(270, 125, 12, 190, O);
      box(270 + gap, 125, 12, 190, B);
      for (let i = 0; i < 6; i++)
        arrow(290, 145 + i * 28, 260 + gap, 145 + i * 28, G);
      if (config.key === "lcr") {
        coil(480, 220, 190);
        energy(
          [
            ["Elektr", s.energyCap, O],
            ["Magnit", s.energyInd, B],
          ],
          s.total,
        );
      } else
        txt(
          "Plastinalar orasidagi bir jinsli maydon",
          400,
          380,
          theme.muted,
          14,
        );
      break;
    }
    case "circuit": {
      const parallel = config.key === "network" && p.mode === 1;
      line(155, 160, 650, 160);
      line(650, 160, 650, 315);
      line(650, 315, 155, 315);
      line(155, 160, 155, 220);
      line(155, 250, 155, 315);
      line(125, 220, 185, 220, O, 4);
      line(137, 250, 173, 250, O, 4);
      if (parallel) {
        line(340, 160, 340, 230);
        line(560, 160, 560, 230);
        line(340, 230, 560, 230);
        box(410, 145, 90, 30, O + "40");
        box(410, 215, 90, 30, B + "40");
        txt("R₁", 455, 138);
        txt("R₂", 455, 278);
      } else {
        box(410, 145, 100, 30, O + "40");
        txt(
          config.key === "diode"
            ? "Diod"
            : config.key === "rl"
              ? "L, R"
              : "Yuk / asbob",
          460,
          135,
          theme.muted,
          13,
        );
      }
      const current = s.current ?? 0;
      if (Math.abs(current) > 1e-12)
        for (let i = 0; i < 7; i++)
          ball(
            190 +
              ((((i * 63 + (t || 0) * Math.sign(current) * 55) % 440) + 440) %
                440),
            315,
            4,
            G,
          );
      txt(`I = ${format(current)} A`, 400, 370, G);
      if (config.key === "ac")
        txt(
          `Uef = ${format(p.voltage)} V · Ief = ${format(s.rms)} A`,
          400,
          398,
          theme.muted,
          13,
        );
      break;
    }
    case "magnetic": {
      for (let i = 0; i < 6; i++)
        for (let j = 0; j < 3; j++) {
          circle(130 + i * 105, 145 + j * 80, 9, B);
          ball(130 + i * 105, 145 + j * 80, 2, B);
        }
      line(270, 230, 530, 230, O, 8);
      arrow(300, 230, 460, 230, O, "I");
      arrow(400, 235, 400, 340, G, `F=${format(s.force)} N`);
      break;
    }
    case "generator": {
      const a = s.phase ?? ((p.angle || 0) * Math.PI) / 180;
      box(100, 155, 100, 160, R + "35");
      box(600, 155, 100, 160, B + "35");
      txt("N", 150, 240, R, 26);
      txt("S", 650, 240, B, 26);
      const w = 130 * Math.cos(a);
      line(400 - w, 160, 400 + w, 160, O, 4);
      line(400 + w, 160, 400 + w, 310, O, 4);
      line(400 + w, 310, 400 - w, 310, O, 4);
      line(400 - w, 310, 400 - w, 160, O, 4);
      arrow(225, 235, 575, 235, B, "B");
      break;
    }
    case "transformer": {
      box(220, 125, 360, 210);
      box(285, 175, 230, 110, theme.surface);
      coil(125, 225, 200, 60);
      coil(475, 225, 200, 60);
      txt(`N₁=${p.n1}`, 225, 355, O);
      txt(`N₂=${p.n2}`, 575, 355, B);
      txt(`U₂=${format(s.voltage2)} V`, 575, 390, B);
      break;
    }
    case "reflection":
    case "refraction": {
      box(80, 235, 640, 165, B + "15");
      line(80, 235, 720, 235, theme.ink);
      line(400, 95, 400, 390, theme.muted, 1, [5, 6]);
      const a = (p.angle * Math.PI) / 180;
      arrow(
        400 - 145 * Math.sin(a),
        235 - 145 * Math.cos(a),
        400,
        235,
        O,
        "Tushuvchi nur",
      );
      arrow(
        400,
        235,
        400 + 145 * Math.sin(a),
        235 - 145 * Math.cos(a),
        G,
        "Qaytgan nur",
      );
      if (config.visual === "refraction" && !s.totalInternal) {
        const b = (s.beta * Math.PI) / 180;
        arrow(
          400,
          235,
          400 + 145 * Math.sin(b),
          235 + 145 * Math.cos(b),
          B,
          "Singan nur",
        );
      }
      if (s.totalInternal) txt("To‘liq ichki qaytish", 220, 365, R, 16);
      break;
    }
    case "interference":
    case "diffraction": {
      const interference = config.visual === "interference";
      line(160, 100, 160, 360, theme.ink, 5);
      line(650, 100, 650, 360, theme.ink, 5);
      const slit = interference ? 25 : 0;
      for (const y of interference ? [230 - slit, 230 + slit] : [230]) {
        line(160, y - 6, 160, y + 6, theme.surface, 8);
        line(160, y, 640, 230, O, 1);
      }
      for (let i = 0; i < 250; i++) {
        const q = (i - 125) / 125,
          value = interference
            ? config.calculate({ ...p, position: q * 10 }, 0).intensity
            : config.calculate({ ...p, angle: q * 20 }, 0).intensity;
        box(658, 105 + i, 26, 1, `rgba(241,89,42,${value})`);
      }
      plot(
        (u) =>
          interference
            ? config.calculate({ ...p, position: (u - 0.5) * 20 }, 0).intensity
            : config.calculate({ ...p, angle: (u - 0.5) * 40 }, 0).intensity,
        220,
        375,
        400,
        65,
        O,
      );
      txt("Ekrandagi normallangan intensivlik", 420, 405, theme.muted, 13);
      break;
    }
    case "polarization": {
      for (const [x, a, color] of [
        [260, 0, O],
        [520, (p.angle * Math.PI) / 180, B],
      ]) {
        circle(x, 235, 70, color);
        for (let i = -2; i <= 2; i++) {
          const z = i * 20;
          line(
            x - 45 * Math.cos(a) - z * Math.sin(a),
            235 - 45 * Math.sin(a) + z * Math.cos(a),
            x + 45 * Math.cos(a) - z * Math.sin(a),
            235 + 45 * Math.sin(a) + z * Math.cos(a),
            color,
          );
        }
      }
      arrow(100, 235, 170, 235, O);
      arrow(605, 235, 705, 235, G, `${format(s.intensity)} W/m²`);
      txt("Qutblagich → analizator", 400, 365);
      break;
    }
    case "instrument": {
      const telescope = p.mode === 1,
        x1 = telescope ? 240 : 400,
        x2 = 570;
      line(90, 245, 710, 245, theme.muted, 1);
      for (const x of telescope ? [x1, x2] : [x1]) {
        c.beginPath();
        c.ellipse(x, 245, 8, 100, 0, 0, Math.PI * 2);
        c.strokeStyle = B;
        c.lineWidth = 3;
        c.stroke();
      }
      for (const y of [185, 245, 305]) {
        line(90, y, x1, y, O);
        line(
          x1,
          y,
          telescope ? x2 : 650,
          telescope ? 245 : 245 + (245 - y) * 0.5,
          O,
        );
        if (telescope)
          line(x2, 245, 710, 245 + ((245 - y) * s.magnification) / 5, G);
      }
      txt(
        telescope
          ? "Obyektiv → okulyar · tasvir teskari"
          : "Lupa · burchak kattalashtirish",
        400,
        385,
      );
      break;
    }
    case "photoelectric":
    case "emission":
    case "photon": {
      box(390, 150, 30, 180, B + "65");
      plot((u) => Math.sin(u * Math.PI * 10), 100, 230, 265, 20, O);
      arrow(100, 230, 365, 230, O, "Foton / energiya");
      const emits =
        config.visual === "photon" ||
        s.emits ||
        s.breakdown === 1 ||
        s.density > 1;
      if (emits) {
        for (let i = 0; i < 5; i++) {
          ball(475 + i * 40, 220 + (i % 2) * 25, 5, G);
          arrow(
            465 + i * 40,
            220 + (i % 2) * 25,
            490 + i * 40,
            220 + (i % 2) * 25,
            G,
          );
        }
      }
      txt(
        config.visual === "photoelectric"
          ? s.emits
            ? "Elektron emissiyasi bor"
            : "hf < W: elektron uchib chiqmaydi"
          : config.title,
        400,
        370,
        emits ? G : R,
        16,
      );
      break;
    }
    case "electrolysis": {
      box(200, 170, 400, 175, B + "25");
      box(260, 125, 25, 160, O);
      box(510, 125, 25, 160, B);
      txt("+", 273, 115, O, 26);
      txt("−", 523, 115, B, 26);
      for (let i = 0; i < 25; i++) {
        const x = 250 + ((i * 43 + t * 10) % 250),
          y = 205 + ((i * 29) % 110);
        ball(x, y, 5, i % 2 ? O : G);
      }
      txt(`Katodda ajralgan massa: ${format(s.mass * 1e6)} mg`, 400, 390);
      break;
    }
    case "relativity": {
      box(100, 155, 540, 35, B + "65");
      box(100, 255, 540 / s.gamma, 35, O);
      txt("Xususiy uzunlik", 370, 135, B);
      txt("Kuzatuvchi o‘lchaydigan uzunlik", 370, 325, O);
      txt(`γ=${format(s.gamma)} · v/c=${format(p.beta)}`, 400, 385);
      break;
    }
    case "atom": {
      const n = Math.round(p.n);
      ball(400, 235, 20, O);
      for (let i = 1; i <= n; i++) circle(400, 235, 30 + i * 14, B);
      ball(400 + 30 + n * 14, 235, 8, G);
      txt(
        s.wavelength === null
          ? "Bu sathlar uchun emissiya yo‘q"
          : `Foton: λ=${format(s.wavelength * 1e9)} nm`,
        400,
        390,
        s.wavelength === null ? R : G,
        16,
      );
      break;
    }
    case "scattering": {
      ball(450, 245, 24, B);
      txt(`+${p.z}`, 450, 251, "#fff", 14);
      const b = p.impact * 1.2,
        y = 245 - clamp(b, 0, 130),
        a = (s.angle * Math.PI) / 180;
      arrow(80, y, 350, y, O, "Alfa-zarracha");
      line(350, y, 430, y, O);
      arrow(
        430,
        y,
        430 + 160 * Math.cos(a),
        y - 160 * Math.sin(a),
        G,
        `θ=${format(s.angle)}°`,
      );
      txt(
        "Kulon sochilishi · trayektoriya yo‘nalishlari sxematik",
        400,
        385,
        theme.muted,
        13,
      );
      break;
    }
    case "decay":
    case "nucleus":
    case "massEnergy": {
      const n =
          config.visual === "decay"
            ? Math.min(200, p.initial)
            : Math.min(120, p.nucleons ?? 24),
        fraction = config.visual === "decay" ? s.remaining / p.initial : 1;
      for (let i = 0; i < n; i++) {
        const x = 150 + (i % 20) * 26,
          y = 130 + Math.floor(i / 20) * 22;
        ball(x, y, 7, i < n * fraction ? (i % 2 ? O : B) : theme.line);
      }
      txt(
        config.visual === "decay"
          ? "Kutilayotgan son · tasodifiy yakka yemirilish modeli emas"
          : "Yadro / massa sxemasi",
        400,
        390,
        theme.muted,
        14,
      );
      break;
    }
  }
  // Telemetriya har bir modeldan haqiqiy hisoblangan sonlarni ko‘rsatadi.
  const results = config.results.slice(0, 3);
  results.forEach((r, i) => {
    const x = 135 + i * 265;
    txt(c.compactMode && r.label.length > 22 ? r.label.slice(0, 21)+'…' : r.label, x, 445, theme.muted, 11);
    txt(
      `${formatResult(r, s[r.key])} ${s[r.key] === null ? "" : r.unit}`,
      x,
      471,
      [O, B, G][i],
      18,
    );
  });
  if (s.warning)
    txt("Model chegarasi: izohni tajriba ostida ko‘ring", 400, 415, R, 13);
}
