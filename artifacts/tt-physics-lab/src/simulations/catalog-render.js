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
    // Mayda zarrachalar oddiy nuqta bo'lib qoladi; yirik jismda hajm seziladi.
    const shade = r >= 10 && !color.startsWith("#") ? null
      : r >= 10 ? c.createRadialGradient?.(x - r * .3, y - r * .35, 1, x, y, r) : null;
    shade?.addColorStop(0, "#f2f6f8");
    shade?.addColorStop(.42, color);
    shade?.addColorStop(1, "#25323b");
    c.fillStyle = shade || color;
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
    const shade = c.createLinearGradient?.(x, y, x + 60, y + 55);
    shade?.addColorStop(0, "#8193a1");
    shade?.addColorStop(1, "#344858");
    box(x, y, 60, 55, shade || "#526777");
    c.fillStyle = color;
    c.fillRect(x, y, 60, 5);
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
  if (config.key === "rutherford") {
    txt(c.compactMode ? "Yadro va spektr" : config.title, 400, 43, theme.ink, c.compactMode ? 30 : 20);
    txt("Chapda Kulon sochilishi · o‘ngda vodorodning Bor modeli", 400, 75, theme.muted, c.compactMode ? 21 : 14);
  } else if (config.key === "bohrSpectra") {
    txt(c.compactMode ? "Atom spektri" : config.title, 400, 43, theme.ink, c.compactMode ? 30 : 20);
    txt("Diskret sathlar · foton energiyasi sathlar farqiga teng", 400, 75, theme.muted, c.compactMode ? 21 : 14);
  } else if (config.visual === "centerOfMass") {
    txt(c.compactMode ? "Og‘irlik markazi" : config.title, 400, 43, theme.ink, c.compactMode ? 30 : 20);
    txt("Massalar markazi · tayanch uning ostida bo‘lsa muvozanat saqlanadi", 400, 75, theme.muted, c.compactMode ? 21 : 14);
  } else if (config.visual === "barometer") {
    txt(c.compactMode ? "Havo bosimi" : config.title, 400, 43, theme.ink, c.compactMode ? 30 : 20);
    txt(`Balandlik: ${format(p.altitude)} m · izotermik atmosfera modeli`, 400, 75, theme.muted, c.compactMode ? 21 : 14);
  } else if (config.key === "heatEngine") {
    txt(c.compactMode ? "Issiqlik dvigateli" : config.title, 400, 43, theme.ink, c.compactMode ? 30 : 20);
    txt("Issiqlik oqimi · foydali ish · Karno FIK chegarasi", 400, 75, theme.muted, c.compactMode ? 21 : 14);
  } else if (config.key === "nucleusRadioactivity") {
    txt(c.compactMode ? "Yadro va yemirilish" : config.title, 400, 43, theme.ink, c.compactMode ? 30 : 20);
    txt("Nuklon tarkibi · namunadagi kutilayotgan o‘zgarish", 400, 75, theme.muted, c.compactMode ? 21 : 14);
  } else if (config.visual === "batteryCircuit") {
    txt(c.compactMode ? "Tok manbalari" : config.title, 400, 43, theme.ink, c.compactMode ? 31 : 21);
    txt(p.mode === 1 ? "Parallel · EYuK bir xil, ichki R kamayadi" : "Ketma-ket · EYuK va ichki R qo‘shiladi", 400, 76, theme.muted, c.compactMode ? 22 : 15);
  } else if (config.visual === "lampCircuit") {
    txt(c.compactMode ? "Ikkita lampa" : config.title, 400, 43, theme.ink, c.compactMode ? 31 : 21);
    txt(p.mode === 1 ? "Parallel ulanish · kuchlanish bir xil" : "Ketma-ket ulanish · tok bir xil", 400, 76, theme.muted, c.compactMode ? 23 : 15);
  } else if (config.visual === "meterRange") {
    txt(c.compactMode ? "Asbob chegarasini oshirish" : config.title, 400, 43, theme.ink, c.compactMode ? 31 : 21);
    txt("Bir xil o‘lchov mexanizmi · ikki ulanish usuli", 400, 77, theme.muted, c.compactMode ? 23 : 15);
  } else if (config.visual === "airHumidity") {
    txt(c.compactMode ? "Havoning namligi" : config.title, 400, 43, theme.ink, c.compactMode ? 32 : 22);
    txt("1 m³ yopiq havo namunasi", 400, 76, theme.muted, c.compactMode ? 25 : 16);
  } else if (config.visual === "waterVapor") {
    txt(c.compactMode ? "Suvning fazalari" : config.title, 400, 43, theme.ink, c.compactMode ? 32 : 22);
    txt("Haroratni o‘zgartiring", 400, 76, theme.muted, c.compactMode ? 25 : 16);
  } else if (config.key === "electrolysis") {
    txt(c.compactMode ? "Elektroliz" : "Ionlar harakati", 400, 80, theme.ink, c.compactMode ? 34 : 20);
  } else {
    txt(config.title, 400, 43, theme.ink, 19);
    if (!config.static)
      txt(`Vaqt: ${config.timeScale && t > 0 && t < 1 ? t.toExponential(3) : format(t)} s`,
        400, 69, theme.muted, 12);
  }
  switch (config.visual) {
    case "centerOfMass": {
      if (!Number.isFinite(s.center)) break;
      const origin = 400;
      const pixelsPerMetre = 80;
      const toCanvasX = position => origin + position * pixelsPerMetre;
      const leftX = toCanvasX(p.x1);
      const rightX = toCanvasX(p.x2);
      const centerX = toCanvasX(s.center);
      box(145, 250, 510, 16, theme.floor);
      line(145, 258, 655, 258, theme.ink, 2);
      for (let metre = -3; metre <= 3; metre++) {
        const x = toCanvasX(metre);
        line(x, 247, x, 274, theme.muted, metre === 0 ? 2 : 1);
        txt(String(metre), x, 294, theme.muted, 12);
      }
      txt("m", 678, 264, theme.muted, 14);
      const leftRadius = 12 + 5 * Math.sqrt(p.m1);
      const rightRadius = 12 + 5 * Math.sqrt(p.m2);
      line(leftX, 220 + leftRadius, leftX, 250, O, 2);
      line(rightX, 220 + rightRadius, rightX, 250, B, 2);
      ball(leftX, 220, leftRadius, O);
      ball(rightX, 220, rightRadius, B);
      txt(`m₁ = ${format(p.m1)} kg`, leftX, 168, O, 15);
      txt(`m₂ = ${format(p.m2)} kg`, rightX, 168, B, 15);
      // Tayanch yuklarning massalar markaziga qo‘yilganda ikki moment teng.
      c.beginPath();
      c.moveTo(centerX, 270);
      c.lineTo(centerX - 24, 316);
      c.lineTo(centerX + 24, 316);
      c.closePath();
      c.fillStyle = G + "45";
      c.fill();
      c.strokeStyle = G;
      c.lineWidth = 2;
      c.stroke();
      ball(centerX, 258, 7, G);
      line(leftX, 338, centerX, 338, O, 2);
      line(centerX, 338, rightX, 338, B, 2);
      txt(`x₁ = ${format(p.x1)} m`, 170, 135, O, 14, "left");
      txt(`x₂ = ${format(p.x2)} m`, 630, 135, B, 14, "right");
      txt(`x_c = ${format(s.center)} m`, centerX, 383, G, 19);
      break;
    }
    case "barometer": {
      if (!Number.isFinite(s.pressure)) break;
      const seaLevelMm = p.seaLevelPressure / 133.322;
      const altitudeMm = s.mercuryHeight;
      const drawBarometer = (x, heightMm, color, title, value) => {
        const tubeTop = 150;
        const baseY = 355;
        const tubeHeight = baseY - tubeTop;
        const columnHeight = clamp(heightMm / 820, 0, 1) * tubeHeight;
        c.save();
        c.strokeStyle = theme.line;
        c.lineWidth = 3;
        c.strokeRect(x - 29, tubeTop, 58, tubeHeight);
        c.fillStyle = color + "75";
        c.fillRect(x - 24, baseY - columnHeight, 48, columnHeight);
        c.restore();
        box(x - 39, baseY, 78, 18, color + "40");
        txt(title, x, 391, theme.muted, 14);
        txt(value, x, 423, color, 17);
      };
      // Bir xil sirt bosimi bilan balandlikdagi atmosfera ustuni taqqoslanadi.
      drawBarometer(265, seaLevelMm, B, "Dengiz sathi", `${format(seaLevelMm)} mmHg`);
      drawBarometer(535, altitudeMm, O, `h = ${format(p.altitude)} m`, `${format(altitudeMm)} mmHg`);
      line(400, 115, 400, 366, theme.line, 1, [5, 6]);
      txt(`p₀ = ${format(p.seaLevelPressure / 1000)} kPa`, 265, 130, B, 14);
      txt(`p = ${format(s.pressure / 1000)} kPa`, 535, 130, O, 14);
      txt(`Bosimning ${format(s.relativePressure * 100)}% i saqlandi`, 400, 465, G, 17);
      break;
    }
    case "batteryCircuit": {
      const n = Math.min(6, Math.max(1, Math.round(p.count || 1)));
      const cell = (x, y, index, small = false) => {
        line(x - 9, y - (small ? 14 : 23), x - 9, y + (small ? 14 : 23), O, 4);
        line(x + 9, y - (small ? 9 : 15), x + 9, y + (small ? 9 : 15), B, 4);
        if (!small) txt(String(index), x, y - 35, theme.muted, 15);
      };
      const load = (x, top, bottom) => {
        const mid = (top + bottom) / 2;
        line(x, top, x, mid - 30, theme.ink, 3);
        box(x - 22, mid - 30, 44, 60, B + "35");
        txt("R", x, mid + 6, B, 20);
        line(x, mid + 30, x, bottom, theme.ink, 3);
        txt(`Yuk ${format(p.resistance)} Ω`, p.mode === 1 ? 610 : x - 82, p.mode === 1 ? 181 : mid + 9, theme.muted, 15);
      };
      if (p.mode === 0) {
        const y = 205;
        const centers = Array.from({ length: n }, (_, i) => n === 1 ? 405 : 225 + i * 360 / (n - 1));
        line(120, y, centers[0] - 9, y, theme.ink, 3);
        centers.forEach((x, i) => {
          cell(x, y, i + 1);
          line(x + 9, y, (centers[i + 1] ?? 675) - (i + 1 < n ? 9 : 0), y, theme.ink, 3);
        });
        line(675, y, 680, y, theme.ink, 3);
        load(680, y, 330);
        line(680, 330, 120, 330, theme.ink, 3);
        line(120, y, 120, 330, theme.ink, 3);
        txt(`Har manba: ${format(p.emf)} V · ${format(p.internal)} Ω`, 400, 285, theme.muted, 16);
      } else {
        const left = 190, right = 570, start = n === 1 ? 235 : 154, end = n === 1 ? 235 : 314;
        line(left, 120, left, end, theme.ink, 3);
        line(right, start, right, 355, theme.ink, 3);
        for (let i = 0; i < n; i++) {
          const y = n === 1 ? 235 : start + (end - start) * i / (n - 1);
          line(left, y, 389, y, theme.ink, 3);
          cell(398, y, i + 1, true);
          line(407, y, right, y, theme.ink, 3);
          txt(`${i + 1}`, 300, y - 7, theme.muted, 13);
        }
        line(left, 120, 680, 120, theme.ink, 3);
        load(680, 120, 355);
        line(680, 355, right, 355, theme.ink, 3);
        txt(`Har manbadan ${format(s.branchCurrent)} A`, 400, 369, theme.muted, 16);
      }
      txt(`n = ${n} · EYuK ${format(s.emf)} V · r ${format(s.internal)} Ω`, 400, 395, O, 16);
      txt(`Yuk toki ${format(s.current)} A · Yuk kuchlanishi ${format(s.voltage)} V`, 400, 425, theme.ink, 17);
      break;
    }
    case "lampCircuit": {
      const wire = theme.ink;
      const bulb = (x, y, power, label, resistance, showStats = true) => {
        const glow = clamp(power / 4, 0, 1);
        if (glow > 0) {
          c.beginPath();
          c.arc(x, y, 32 + glow * 12, 0, Math.PI * 2);
          c.fillStyle = `rgba(241, 164, 42, ${0.06 + glow * 0.24})`;
          c.fill();
        }
        c.beginPath();
        c.arc(x, y, 31, 0, Math.PI * 2);
        c.fillStyle = `rgba(255, 193, 69, ${0.08 + glow * 0.75})`;
        c.fill();
        circle(x, y, 31, glow > 0 ? "#ffc145" : theme.muted);
        line(x - 12, y - 12, x + 12, y + 12, theme.ink, 2);
        line(x - 12, y + 12, x + 12, y - 12, theme.ink, 2);
        txt(label, x + 64, y - 14, theme.ink, 16);
        if (showStats) txt(`${format(power)} W · ${format(resistance)} Ω`, x, y + 65, glow > 0 ? "#ffc145" : theme.muted, 15);
      };
      // Chapda manba, yuqorida lampalar: chiziqlar yopiq elektr zanjirini beradi.
      line(120, 170, 120, 220, wire, 3);
      line(120, 252, 120, 330, wire, 3);
      line(89, 220, 151, 220, O, 4);
      line(101, 252, 139, 252, O, 4);
      txt(`${format(p.voltage)} V`, 120, 285, O, 16);
      line(120, 330, 680, 330, wire, 3);
      line(680, 170, 680, 330, wire, 3);
      if (p.mode === 1) {
        line(120, 170, 255, 170, wire, 3);
        line(255, 170, 255, 295, wire, 3);
        line(610, 170, 680, 170, wire, 3);
        line(610, 170, 610, 295, wire, 3);
        for (const [y, power, resistance, label] of [[205, s.p1, p.r1, "L1"], [280, s.p2, p.r2, "L2"]]) {
          line(255, y, 400, y, wire, 3);
          line(462, y, 610, y, wire, 3);
          bulb(431, y, power, label, resistance, false);
        }
        txt(`I₁ = ${format(s.i1)} A`, 340, 150, B, 15);
        txt(`I₂ = ${format(s.i2)} A`, 545, 315, G, 15);
      } else {
        line(120, 170, 304, 170, wire, 3);
        line(366, 170, 484, 170, wire, 3);
        line(546, 170, 680, 170, wire, 3);
        bulb(335, 170, s.p1, "L1", p.r1);
        bulb(515, 170, s.p2, "L2", p.r2);
        txt(`U₁ = ${format(s.u1)} V`, 335, 295, B, 16);
        txt(`U₂ = ${format(s.u2)} V`, 515, 295, G, 16);
      }
      if (p.mode === 1) {
        txt(`L1: ${format(s.p1)} W`, 280, 370, O, 16);
        txt(`L2: ${format(s.p2)} W`, 520, 370, B, 16);
      }
      txt(`Manba toki ${format(s.current)} A · Jami quvvat ${format(s.power)} W`, 400, 415, theme.ink, 17);
      break;
    }
    case "meterRange": {
      const size = (normal) => c.compactMode ? Math.max(27, normal) : normal;
      box(65, 115, 325, 275, theme.floor);
      box(410, 115, 325, 275, theme.floor);
      txt(c.compactMode ? "A · parallel" : "Ampermetr · parallel shunt", 228, 147, O, size(19));
      txt(c.compactMode ? "V · ketma-ket" : "Voltmeter · ketma-ket R", 573, 147, B, size(19));
      // Chapdagi ikki tarmoq bir xil kuchlanishga ega; tok I=I_m+I_sh bo‘linadi.
      line(85, 250, 140, 250, theme.ink, 3);
      line(140, 195, 140, 305, theme.ink, 3);
      line(140, 195, 199, 195, theme.ink, 3);
      circle(229, 195, 30, O);
      txt("G", 229, 203, O, size(20));
      line(259, 195, 360, 195, theme.ink, 3);
      line(140, 305, 190, 305, theme.ink, 3);
      box(190, 287, 80, 36, O + "35");
      txt("Rsh", 230, 312, O, size(17));
      line(270, 305, 360, 305, theme.ink, 3);
      line(360, 195, 360, 305, theme.ink, 3);
      line(360, 250, 382, 250, theme.ink, 3);
      ball(140, 250, 5, O);
      ball(360, 250, 5, O);
      txt(`Iₘ = ${format(p.current)} A`, 317, 230, theme.ink, size(15));
      txt(`Ish = ${format(s.shuntCurrent)} A`, 315, 280, theme.ink, size(15));
      txt(`Rsh = ${format(s.shunt)} Ω`, 228, 362, O, size(19));
      // O‘ngda qo‘shimcha qarshilik va o‘lchov mexanizmidan bir xil I_m o‘tadi.
      line(428, 250, 480, 250, theme.ink, 3);
      box(480, 232, 85, 36, B + "35");
      txt("Rq", 522, 257, B, size(17));
      line(565, 250, 605, 250, theme.ink, 3);
      circle(635, 250, 30, B);
      txt("G", 635, 258, B, size(20));
      line(665, 250, 720, 250, theme.ink, 3);
      txt(`Rq = ${format(s.series)} Ω`, 573, 308, B, size(19));
      txt(`Uₘ = ${format(s.meterVoltage)} V`, 573, 341, theme.ink, size(17));
      txt(`Uq = ${format(s.seriesVoltage)} V`, 573, 371, theme.ink, size(17));
      txt(`I chegara = ${format(s.currentLimit)} A`, 228, 424, O, size(19));
      txt(`U chegara = ${format(s.voltageLimit)} V`, 573, 424, B, size(19));
      break;
    }
    case "airHumidity": {
      const size = (normal) => c.compactMode ? Math.max(28, normal) : normal;
      const relative = clamp(s.relative ?? 0, 0, 100);
      const droplets = s.condensate > 0 ? clamp(Math.ceil(s.condensate / 1.5), 3, 25) : 0;
      box(75, 125, 340, 265, theme.surface);
      c.fillStyle = B + "12";
      c.fillRect(76, 126, 338, 263);
      txt("HAVO", 245, 162, theme.muted, size(15));
      // Nuqtalar va tomchilar massa masshtabida emas, jarayonni tushuntirish uchun.
      const molecules = Math.min(32, Math.round((s.vaporMass ?? 0) / 1.6));
      for (let i = 0; i < molecules; i++) {
        const x = 115 + (i * 83) % 260;
        const y = 185 + (i * 59) % 155;
        ball(x, y, 4, B);
      }
      if (droplets) {
        c.fillStyle = B + "40";
        c.fillRect(78, 180, 14, 207);
        for (let i = 0; i < droplets; i++) {
          const x = 87 + (i % 2) * 7;
          const y = 190 + Math.floor(i / 2) * 14;
          ball(x, y, 3 + i % 3, B);
        }
      }
      txt(droplets ? "Tomchi hosil bo‘ldi" : "Tomchi yo‘q", 245, 418, droplets ? B : theme.muted, size(18));
      c.beginPath();
      c.arc(615, 230, 72, -Math.PI / 2, 1.5 * Math.PI);
      c.strokeStyle = theme.line;
      c.lineWidth = 13;
      c.stroke();
      c.beginPath();
      c.arc(615, 230, 72, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * relative / 100);
      c.strokeStyle = droplets ? B : G;
      c.lineWidth = 13;
      c.stroke();
      txt(`${format(relative)}%`, 615, 241, theme.ink, size(31));
      txt("Nisbiy namlik", 615, 341, theme.muted, size(18));
      txt(`T = ${format(p.temperature - 273.15)} °C`, 615, 383, O, size(19));
      break;
    }
    case "waterVapor": {
      const contrast = s.contrast;
      const size = (normal) => c.compactMode ? Math.max(28, normal) : normal;
      box(115, 115, 280, 255, theme.surface);
      c.fillStyle = `rgba(56,131,217,${0.13 + 0.22 * contrast})`;
      c.fillRect(116, 245, 278, 124);
      c.fillStyle = `rgba(56,131,217,${0.13 - 0.1 * contrast})`;
      c.fillRect(116, 116, 278, 129);
      if (contrast > 0) line(116, 245, 394, 245, `rgba(56,131,217,${contrast})`, 3);
      // Fazalar farqi rang bilan beriladi; nuqtalar soni massa hisobini anglatmaydi.
      for (let i = 0; i < 42; i++) {
        const x = 138 + (i % 7) * 39 + Math.sin(i * 4.1) * 5;
        const y = 138 + Math.floor(i / 7) * 42 + Math.cos(i * 2.7) * 5;
        c.globalAlpha = y < 245 ? 0.65 - 0.4 * contrast : 0.65 + 0.3 * contrast;
        ball(x, y, 3.5, B);
      }
      c.globalAlpha = 1;
      txt(s.critical ? "Kritik holat" : "To‘yingan bug‘", 255, 108, B, size(18));
      txt(s.critical ? "Chegara yo‘q" : "Suyuqlik", 255, 397, B, size(18));
      if (!s.critical && s.saturation !== null) {
        arrow(430, 282, 430, 208, O);
        arrow(473, 208, 473, 282, G);
        txt(c.compactMode ? "Bug‘ ⇄ suyuqlik" : "Bug‘lanish ⇄ kondensatsiya", 592, 152, theme.ink, size(16));
        txt("Tezliklar teng", 592, 187, theme.muted, size(14));
      } else {
        txt(c.compactMode ? "Fazalar farqi yo‘q" : "Suyuqlik va bug‘ farqi yo‘qoladi", 580, 172, G, size(16));
      }
      txt(`T = ${format(p.temperature)} K`, 605, 235, theme.ink, size(21));
      txt(`p = ${formatResult(config.results[0], s.saturation)} MPa`, 605, 270, O, size(21));
      txt("Kritik nuqta", 605, 313, theme.muted, size(16));
      if (c.compactMode) {
        txt("647.096 K", 605, 347, G, 28);
        txt("22.064 MPa", 605, 380, G, 28);
      } else txt("647.096 K · 22.064 MPa", 605, 351, G, 18);
      txt("Muvozanat modeli · sxematik", 400, 434, theme.muted, size(13));
      break;
    }
    case "cart": {
      // Bir metr doim to‘rt piksel: tezlik o‘zgarsa, ko‘rinadigan harakat ham o‘zgaradi.
      const pixelsPerMetre = 4;
      const camera = Math.abs(s.x) > 55 ? s.x - Math.sign(s.x) * 55 : 0;
      const worldX = (metres) => 400 + (metres - camera) * pixelsPerMetre;
      const carX = worldX(s.x);
      const startX = worldX(p.x0);
      const axisY = 290;

      txt("Koordinata o‘qi · 1 bo‘linma = 10 m", 80, 112, theme.muted, 15, "left");
      txt(s.v > 0 ? "O‘ngga harakat" : s.v < 0 ? "Chapga harakat" : "Jism tinch", 720, 112, B, 16, "right");
      line(75, axisY, 725, axisY, theme.line, 3);
      const firstTick = Math.ceil((camera - 81) / 10) * 10;
      for (let metre = firstTick; metre <= camera + 81; metre += 10) {
        const tickX = worldX(metre);
        if (tickX < 78 || tickX > 722) continue;
        line(tickX, axisY - 7, tickX, axisY + 8, metre === 0 ? O : theme.muted, metre === 0 ? 2.5 : 1);
        txt(`${metre}`, tickX, axisY + 29, metre === 0 ? O : theme.muted, 14);
      }
      txt("m", 737, axisY + 5, theme.muted, 12, "left");
      if (startX >= 80 && startX <= 720) {
        line(startX, 164, startX, axisY - 10, G, 1.5, [5, 5]);
        txt(`Boshlanish ${format(p.x0)} m`, startX, 153, G, 15);
      }
      if (t > 0 && s.v !== 0) {
        line(clamp(startX, 77, 723), axisY - 12, clamp(carX, 77, 723), axisY - 12, O, 4);
      }
      // Aravacha va g‘ildiraklar koordinataning o‘zida joylashgan.
      box(carX - 37, 214, 74, 43, O);
      ball(carX - 22, 266, 10, "#273746");
      ball(carX + 22, 266, 10, "#273746");
      ball(carX - 22, 266, 4, theme.ink);
      ball(carX + 22, 266, 4, theme.ink);
      if (Math.abs(s.v) > 1e-9) {
        const direction = Math.sign(s.v);
        const length = 30 + Math.abs(s.v) * 3;
        arrow(carX, 192, carX + direction * length, 192, B);
      }
      txt(`x = ${format(s.x)} m`, 225, 372, theme.ink, 19);
      txt(`Δx = ${format(s.x - p.x0)} m`, 425, 372, O, 19);
      txt(`Yo‘l = ${format(s.distance)} m`, 625, 372, G, 19);
      break;
    }
    case "relative": {
      const originX = 152, originY = 233;
      const scale = Math.min(480 / Math.max(1, p.v1 * config.duration),
        95 / Math.max(1, Math.abs(p.v2) * config.duration));
      const x = originX + s.x * scale;
      const y = originY - s.y * scale;
      box(96, 105, 610, 256, B + "13");
      line(96, 105, 706, 105, "#6b8393", 3);
      line(96, 361, 706, 361, "#6b8393", 3);
      for (let i = 0; i < 4; i++) {
        const streamX = 235 + i * 112;
        if (Math.abs(p.v2) > 1e-9)
          arrow(streamX, 246, streamX, 246 - Math.sign(p.v2) * 28, B);
      }
      line(originX, originY, x, originY, G, 2, [5, 6]);
      line(x, originY, x, y, B, 2, [5, 6]);
      if (Math.hypot(s.x, s.y) > 1e-8)
        arrow(originX, originY, x, y, O);
      c.save();
      c.translate(x, y);
      c.fillStyle = "#7590a3";
      c.beginPath();
      c.moveTo(-34, -13);
      c.lineTo(22, -13);
      c.lineTo(37, 0);
      c.lineTo(22, 13);
      c.lineTo(-34, 13);
      c.closePath();
      c.fill();
      c.fillStyle = O;
      c.fillRect(-29, -11, 53, 3);
      c.restore();
      txt(`v₁ = ${format(p.v1)} m/s`, 168, 395, G, 16);
      txt(`v₂ = ${format(p.v2)} m/s`, 400, 395, B, 16);
      txt(`|v| = ${format(s.speed)} m/s`, 630, 395, O, 16);
      txt("Qirg‘oqqa nisbatan yo‘l · strelkalar tezlik yo‘nalishini bildiradi",
        400, 430, theme.muted, 13);
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
    case "block": {
      // Zichlikda hajm geometrik, massa esa alohida o'lchov sifatida beriladi.
      const side = clamp(100 * Math.cbrt(p.volume / 2), 44, 205);
      const x = 260 - side / 2;
      const y = 245 - side / 2;
      const depth = Math.min(38, side * .26);
      c.fillStyle = "#394d5c";
      c.fillRect(x, y, side, side);
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + depth, y - depth);
      c.lineTo(x + side + depth, y - depth);
      c.lineTo(x + side, y);
      c.closePath();
      c.fillStyle = "#8195a4";
      c.fill();
      c.beginPath();
      c.moveTo(x + side, y);
      c.lineTo(x + side + depth, y - depth);
      c.lineTo(x + side + depth, y + side - depth);
      c.lineTo(x + side, y + side);
      c.closePath();
      c.fillStyle = "#526879";
      c.fill();
      line(x, y + side + 18, x + side, y + side + 18, B, 2);
      txt(`V = ${format(p.volume)} L`, 260, Math.min(400, y + side + 48), B, 17);
      box(490, 160, 195, 135, "#111b23");
      line(515, 248, 660, 248, theme.muted, 2);
      line(587, 248, 587, 217, theme.muted, 2);
      ball(587, 203, 12, O);
      txt("MASSA", 587, 187, theme.muted, 13);
      txt(`${format(p.m)} kg`, 587, 282, O, 22);
      txt(`ρ = ${format(s.density)} kg/m³`, 587, 345, theme.ink, 20);
      txt("Bir jinsli jism · hajm ko'rgazmali masshtabda", 400, 415, theme.muted, 13);
      break;
    }
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
      if (config.key === "vapor") {
        const ratio = Math.max(0, s.relative / 100);
        const occupied = Math.min(1, ratio);
        const excess = Math.max(0, ratio - 1);
        box(138, 121, 465, 244, "#111f2a");
        box(138, 343, 465, 22, B + "60");
        txt("Yopiq idish · suv va bug'", 160, 109, theme.muted, 14, "left");
        txt(`T = ${format(p.temperature)} K`, 626, 109, O, 16, "right");
        const count = Math.round(occupied * 58);
        for (let i = 0; i < count; i++) {
          const x = 162 + ((i * 97 + 31) % 415);
          const y = 151 + ((i * 67 + 19) % 166);
          ball(x, y, 3.5, "#78b8e0");
        }
        if (excess > 0) {
          const droplets = Math.min(22, Math.ceil(excess * 12));
          for (let i = 0; i < droplets; i++)
            ball(170 + i * 18, 339 - (i % 3) * 7, 3.5, B);
          txt("Ortiqcha bug' kondensatsiyalanadi", 370, 222, R, 16);
        }
        box(630, 121, 24, 244, "#162530");
        c.fillStyle = ratio > 1 ? R : G;
        c.fillRect(631, 365 - 242 * occupied, 22, 242 * occupied);
        txt("100%", 670, 128, theme.muted, 12, "left");
        txt("0%", 670, 366, theme.muted, 12, "left");
        txt(`Namlik ${format(s.relative)}%`, 400, 401,
          ratio > 1 ? R : G, 19);
        txt(`pᵥ = ${format(p.vapor)} kPa · pₛₐₜ = ${format(s.saturation / 1000)} kPa`,
          400, 430, theme.ink, 14);
        break;
      }
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
      const number = (value) => Number.isFinite(value)
        ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)
        : "—";
      if (config.key === "heatEngine") {
        const hot = p.hot > p.cold;
        const validWork = Number.isFinite(s.work) ? s.work : 0;
        const validHeatOut = Number.isFinite(s.heatOut) ? s.heatOut : 0;
        const flow = (x, y, X, Y, value, color) => {
          const width = 2 + 5 * clamp(value / Math.max(p.heatIn, 1), 0, 1);
          line(x, y, X, Y, color, width);
          const angle = Math.atan2(Y - y, X - x);
          line(X, Y, X - 11 * Math.cos(angle - 0.48), Y - 11 * Math.sin(angle - 0.48), color, width);
          line(X, Y, X - 11 * Math.cos(angle + 0.48), Y - 11 * Math.sin(angle + 0.48), color, width);
        };
        box(90, 125, 170, 122, hot ? R + "35" : R + "20");
        txt("ISSIQ MANBA", 175, 153, R, 13);
        txt(`T₁ = ${format(p.hot)} K`, 175, 186, theme.ink, 17);
        txt(`Q₁ = ${format(p.heatIn)} J`, 175, 220, R, 14);
        box(540, 255, 170, 122, B + "35");
        txt("SOVUTGICH", 625, 283, B, 13);
        txt(`T₂ = ${format(p.cold)} K`, 625, 316, theme.ink, 17);
        if (!s.warning) txt(`Q₂ = ${format(validHeatOut)} J`, 625, 351, B, 14);
        box(327, 196, 146, 118, O + "20");
        line(345, 228, 455, 228, O, 4);
        line(400, 229, 400, 271, theme.ink, 3);
        circle(400, 280, 17, G);
        line(400, 280, 413, 270, G, 3);
        txt("DVIGATEL", 400, 215, theme.ink, 14);
        if (!s.warning) {
          flow(260, 170, 327, 215, p.heatIn, R);
          flow(473, 225, 540, 296, validHeatOut, B);
          flow(400, 314, 400, 382, validWork, G);
          txt(`A = ${format(validWork)} J`, 490, 365, G, 14);
        }
        txt(
          s.warning
            ? "Yaroqsiz holat: T₁ > T₂ va η ≤ ηC bo‘lishi kerak"
            : `Energiya balansi: Q₁ = A + Q₂ · η = ${format(s.efficiency)}% ≤ ηC = ${format(s.carnot)}%`,
          400,
          423,
          s.warning ? R : theme.ink,
          14,
        );
      } else if (config.key === "firstLaw") {
        const heatColor = s.heat >= 0 ? R : B;
        box(306, 157, 188, 156, "#13202a");
        txt("GAZ", 400, 190, theme.ink, 17);
        txt(`${format(p.moles)} mol`, 400, 228, theme.muted, 17);
        txt(`${format(p.temperature)} → ${format(s.temperature2)} K`, 400, 265, O, 17);
        if (s.heat >= 0) arrow(112, 234, 296, 234, heatColor);
        else arrow(296, 234, 112, 234, heatColor);
        txt(`Q = ${number(s.heat)} J`, 194, 201, heatColor, 17);
        if (s.work >= 0) arrow(504, 234, 689, 234, G);
        else arrow(689, 234, 504, 234, G);
        txt(`A = ${number(s.work)} J`, 607, 201, G, 17);
        line(400, 315, 400, 360, B, 3);
        txt(`ΔU = ${number(s.internal)} J`, 400, 390, B, 19);
        if (!s.warning)
          txt("Q = ΔU + A · ishoralar energiya yo'nalishini bildiradi", 400, 424, theme.muted, 14);
      } else {
        const hot = p.deltaT >= 0;
        const startY = 225 - clamp((p.temperature - 200) / 300, 0, 1) * 80;
        const endY = 225 - clamp((s.temperature2 - 200) / 300, 0, 1) * 80;
        box(180, 142, 440, 160, "#13202a");
        line(248, 270, 248, 165, theme.muted, 7);
        line(552, 270, 552, 165, theme.muted, 7);
        ball(248, startY, 15, B);
        ball(552, endY, 15, hot ? R : B);
        arrow(326, 222, 474, 222, hot ? R : B);
        txt(`${format(p.temperature)} K`, 248, 325, B, 19);
        txt(`${format(s.temperature2)} K`, 552, 325, hot ? R : B, 19);
        txt(`${hot ? "+" : ""}${format(p.deltaT)} K`, 400, 191, hot ? R : B, 18);
        txt(`Q = ${number(s.heat)} J`, 400, 371, hot ? R : B, 22);
        txt(`m = ${format(p.m)} kg · c = ${format(p.capacity)} J/(kg·K)`, 400, 410, theme.muted, 14);
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
        box(410, 143, 100, 34, theme.surface);
        if (config.key === "diode") {
          line(414, 160, 440, 160, theme.ink, 2);
          c.beginPath();
          c.moveTo(440, 144);
          c.lineTo(440, 176);
          c.lineTo(476, 160);
          c.closePath();
          c.fillStyle = p.voltage < 0 ? B : O;
          c.fill();
          line(479, 142, 479, 178, theme.ink, 3);
          line(479, 160, 506, 160, theme.ink, 2);
          txt(`Uᴅ = ${format(p.voltage)} V`, 460, 116, theme.ink, 16);
          txt(p.voltage < 0 ? "Teskari ulanish" : "To'g'ri ulanish", 460, 198,
            p.voltage < 0 ? B : G, 14);
        } else if (config.key === "rl") {
          coil(416, 160, 88, 11);
        } else {
          line(418, 160, 428, 160, theme.ink, 2);
          let previousX = 428, previousY = 160;
          for (let i = 1; i <= 8; i++) {
            const X = 428 + i * 9, Y = i === 8 ? 160 : 160 + (i % 2 ? -13 : 13);
            line(previousX, previousY, X, Y, theme.ink, 2);
            previousX = X; previousY = Y;
          }
          line(500, 160, 506, 160, theme.ink, 2);
        }
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
      if (config.key === "diode")
        txt("Ideal Shockley modeli · teskari teshilish hisoblanmaydi", 400, 404,
          theme.muted, 13);
      if (config.key === "ac")
        txt(
          `Uef = ${format(p.voltage)} V · Ief = ${format(s.current)} A`,
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
    case "transformerInduction": {
      const fluxRatio = s.fluxPeak > 0 ? Math.abs(s.fluxInstant / s.fluxPeak) : 0;
      const fluxDirection = Math.sign(s.fluxInstant) || 1;
      // Yopiq temir o‘zak magnit oqimini ikkala chulg‘am orqali tutashtiradi.
      box(218, 132, 364, 204, "#263440");
      box(278, 178, 244, 112, theme.surface);
      coil(235, 220, 55, 68);
      coil(510, 220, 55, 68);
      txt("BIRLAMCHI", 262, 163, O, 13);
      txt("IKKILAMCHI", 538, 163, B, 13);
      txt(`N₁ = ${p.n1} ta`, 262, 322, O, 14);
      txt(`N₂ = ${p.n2} ta`, 538, 322, B, 14);
      const shaft = fluxDirection > 0 ? [290, 153, 510, 153] : [510, 153, 290, 153];
      arrow(...shaft, `rgba(56,131,217,${0.25 + 0.75 * fluxRatio})`, `Φ = ${format(s.fluxInstant)} Wb`);
      txt(`U₁(t) = ${format(s.voltagePrimaryInstant)} V`, 200, 375, O, 16, "left");
      txt(`U₂(t) = ${format(s.voltageSecondaryInstant)} V`, 600, 375, B, 16, "right");
      txt(`Kirish: ${format(p.voltage)} V effektiv · Chiqish: ${format(s.voltage2)} V effektiv`, 400, 410, theme.ink, 15);
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
      if (s.intensity === null) break;
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
      if (p.intensity > 0) arrow(100, 235, 170, 235, O);
      if (s.intensity > 0) {
        c.save();
        c.globalAlpha = Math.min(1, s.intensity / 100);
        arrow(605, 235, 705, 235, G);
        c.restore();
      }
      txt("Kirish qutblanishi", 260, 140, O);
      txt(`Analizator: ${format(p.angle)}°`, 520, 140, B);
      txt(`I₀ = ${format(p.intensity)} W/m²`, 260, 335, O);
      txt(`I = ${format(s.intensity)} W/m²`, 520, 335, G);
      txt(p.intensity === 0 ? "Manba o‘chirilgan" : s.intensity === 0 ? "O‘qlar tik: nur to‘liq to‘siladi" : `O‘tkazish: ${format(s.fraction * 100)}%`, 400, 375);
      txt("Kirish nuri oldindan chiziqli qutblangan", 400, 405, theme.muted, 14);
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
    case "gasDischarge": {
      const gap = 170 + p.gap * 12;
      const left = 400 - gap / 2;
      const right = 400 + gap / 2;
      box(125, 145, 550, 205, B + "10");
      box(left - 12, 175, 24, 145, O);
      box(right - 12, 175, 24, 145, B);
      txt("Katod (−)", left, 370, O, 16);
      txt("Anod (+)", right, 370, B, 16);
      txt(`Havo · d = ${format(p.gap)} mm`, 400, 122, theme.muted, 16);
      // Neytral molekulalarning issiqlik harakati faqat ko‘rgazmali masshtabda.
      for (let i = 0; i < 17; i++) {
        const x = left + 25 + ((i * 79 + t * 9) % Math.max(1, gap - 50));
        const y = 187 + ((i * 41 + t * 6) % 123);
        ball(x, y, 3, theme.muted);
      }
      if (s.breakdown) {
        c.save();
        c.shadowColor = O;
        c.shadowBlur = 22;
        for (let i = 0; i < 8; i++) {
          const x1 = left + 12 + ((gap - 24) * i) / 8;
          const x2 = left + 12 + ((gap - 24) * (i + 1)) / 8;
          const y1 = 247 + 13 * Math.sin(i * 2.4 + t * 15);
          const y2 = 247 + 13 * Math.sin((i + 1) * 2.4 + t * 15);
          line(x1, y1, x2, y2, O, 4);
        }
        c.restore();
        for (let i = 0; i < 5; i++) {
          const phase = (t * 0.55 + i / 5) % 1;
          ball(left + 18 + phase * (gap - 36), 211 + (i % 2) * 55, 6, G);
          ball(right - 18 - phase * (gap - 36), 223 + (i % 2) * 55, 6, O);
        }
        txt("Ionlanish: elektronlar → anod, musbat ionlar → katod", 400, 338, G, 15);
      } else {
        arrow(right - 42, 242, left + 42, 242, B, "Elektr maydon");
        txt("E < 3 MV/m · gaz hali izolyator", 400, 337, theme.muted, 16);
      }
      txt(`E = ${format(s.field / 1e6)} MV/m · chegara ≈ 3 MV/m`, 400, 409, s.breakdown ? G : theme.muted, 16);
      break;
    }
    case "thermionic": {
      const flux = clamp((Math.log10(Math.max(s.density, 1e-20)) + 3) / 6, 0, 1);
      const electrons = Math.round(flux * 9);
      box(155, 145, 490, 205, B + "10");
      txt("Vakuum", 400, 171, theme.muted, 14);
      box(215, 190, 28, 130, O);
      box(565, 190, 22, 130, B);
      txt("Qizigan katod (−)", 225, 375, O, 16);
      txt("Musbat anod (+)", 575, 375, B, 16);
      for (let i = 0; i < 4; i++) {
        const y = 206 + i * 30;
        line(175, y + 8, 186, y - 8, O, 2);
        line(186, y - 8, 198, y + 8, O, 2);
      }
      if (electrons) {
        for (let i = 0; i < electrons; i++) {
          const x = 265 + ((t * 105 + i * 53) % 280);
          const y = 209 + (i % 4) * 29;
          ball(x, y, 6, G);
          txt("−", x, y + 4, "#fff", 11);
        }
        arrow(292, 334, 515, 334, G, "Elektronlar");
      } else {
        txt("Emissiya ko‘rgazmali masshtabda juda sust", 400, 260, theme.muted, 15);
      }
      txt(`Katod: ${format(p.temperature)} K`, 400, 406, theme.muted, 15);
      break;
    }
    case "photoelectric": {
      const plateY = 205;
      box(92, 145, 625, 235, B + "10");
      txt("FOTOELEMENT · VAKUUM", 405, 126, theme.muted, 13);
      // Metall sirtga kelayotgan fotonlar.
      if (p.intensity > 0) {
        for (let i = 0; i < 4; i++) {
          const x = 112 + ((t * 115 + i * 38) % 112);
          const y = plateY + (i % 2) * 34;
          line(x - 12, y, x + 12, y, O, 2);
          ball(x + 12, y, 3, O);
        }
        arrow(120, 290, 215, 290, O, "Yorug‘lik");
      } else {
        txt("Foton oqimi yo‘q", 160, 290, theme.muted, 12);
      }
      box(236, 178, 18, 170, O);
      box(598, 178, 18, 170, B);
      txt("Yoritilgan metall katod", 245, 369, O, 12);
      txt("Kollektor", 608, 369, B, 12);
      txt(`${p.intensity > 0 ? "Foton" : "Foton bo‘lsa"}: hν = ${format(s.photonEnergy)} eV`, 405, 177, theme.ink, 13);
      if (s.emits) {
        const visible = Math.min(6, Math.floor(s.emittedCount + 0.35));
        for (let i = 0; i < visible; i++) {
          const x = 263 + ((t * 125 + i * 47) % 295);
          const y = 226 + (i % 4) * 27;
          ball(x, y, 5, G);
          txt("−", x, y + 4, "#fff", 10);
        }
        arrow(270, 335, 560, 335, G, "Fotoelektronlar");
      } else {
        txt(
          s.aboveThreshold
            ? "Intensivlik nol — foton kelmaydi"
            : "hν < A — elektron metall sirtidan chiqmaydi",
          405, 291, R, 14,
        );
        txt(
          s.aboveThreshold
            ? "Intensivlik oshsa, foton va elektronlar soni ortadi"
            : "Intensivlik chegaradan past chastotani qoplay olmaydi",
          405, 323, theme.muted, 11,
        );
      }
      break;
    }
    case "photon": {
      if (config.key === "xray") {
        const wavelengthNm = s.wavelength * 1e9;
        const energyKeV = s.energy / 1.602176634e-16;
        box(94, 135, 455, 240, "#12202b");
        txt("VAKUUM TRUBKASI · CHEGARA MODELI", 320, 116, theme.muted, 13);
        line(153, 178, 153, 314, O, 6);
        txt("KATOD (−)", 153, 342, O, 13);
        box(436, 160, 31, 166, "#76604f");
        txt("ANOD (+)", 452, 346, theme.ink, 13);
        arrow(172, 245, 425, 245, G, "e− · Eₖ = eU");
        for (let i = 0; i < 5; i++) ball(218 + i * 38, 245, 4, G);
        const cycles = clamp(5 / Math.max(wavelengthNm, .005), 3, 11);
        plot(u => Math.sin(u * Math.PI * 2 * cycles), 486, 216, 235, 27, B);
        arrow(489, 290, 720, 290, B, "Rentgen nuri");
        txt(`U = ${format(p.voltage)} kV`, 400, 401, O, 17);
        txt(`Eₘₐₓ = ${format(energyKeV)} keV`, 620, 361, theme.ink, 17);
        txt(`λₘᵢₙ = ${format(wavelengthNm)} nm`, 620, 393, B, 17);
        txt("Foton uchun eng qisqa to'lqin; spektr intensivligi modellashtirilmagan",
          400, 431, theme.muted, 12);
        break;
      }
      const wavelengthNm = p.wavelength;
      if (!Number.isFinite(wavelengthNm) || wavelengthNm <= 0) break;
      const photonColor = wavelengthNm <= 10 ? "#b7c4d4"
        : wavelengthNm < 380 ? "#9a67d2"
        : wavelengthNm < 495 ? "#5685ec"
          : wavelengthNm < 570 ? "#4ac7cc"
            : wavelengthNm < 590 ? "#d6c83b"
              : wavelengthNm < 620 ? "#f28a30"
                : wavelengthNm <= 750 ? O : "#e05757";
      const cycles = clamp(4 * 550 / wavelengthNm, 2, 12);
      box(90, 155, 620, 235, B + "0c");
      txt("FOTON · ELEKTROMAGNIT KVANT", 400, 135, theme.muted, 13);
      // Qisqa to‘lqinlarda ko‘proq tebranish ko‘rsatiladi; chizma masshtab emas.
      for (let i = 0; i < 72; i++) {
        const u0 = i / 72;
        const u1 = (i + 1) / 72;
        const envelope0 = Math.sin(Math.PI * u0);
        const envelope1 = Math.sin(Math.PI * u1);
        const x0 = 120 + u0 * 560;
        const x1 = 120 + u1 * 560;
        const y0 = 265 - Math.sin(u0 * cycles * Math.PI * 2) * 31 * envelope0;
        const y1 = 265 - Math.sin(u1 * cycles * Math.PI * 2) * 31 * envelope1;
        line(x0, y0, x1, y1, photonColor, 2.5);
      }
      arrow(135, 325, 665, 325, photonColor, "Tarqalish yo‘nalishi");
      const spectralBand = wavelengthNm <= 10 ? "Rentgen (taxminan 1–10 nm)"
        : wavelengthNm < 380 ? "Ultrabinafsha (UV)"
          : wavelengthNm <= 750 ? "Ko‘rinadigan yorug‘lik"
            : "Infraqizil (IQ)";
      txt(`Spektr oralig‘i: ${spectralBand}`, 400, 339, photonColor, 13);
      txt(`λ = ${format(wavelengthNm)} nm · ν = ${format(s.frequency)} Hz`, 400, 366, theme.ink, 14);
      txt(`E = ${formatResult(config.results.find(result => result.key === "energy"), s.energy)} eV · p = ${format(s.momentum)} kg·m/s`, 400, 392, photonColor, 14);
      txt("To‘lqin paketi sxematik; undagi uzunlik haqiqiy fazoviy masshtab emas.", 400, 414, theme.muted, 11);
      break;
    }
    case "emission": {
      box(390, 150, 30, 180, B + "65");
      plot((u) => Math.sin(u * Math.PI * 10), 100, 230, 265, 20, O);
      arrow(100, 230, 365, 230, O, "Foton / energiya");
      const emits =
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
    case "xrayTube": {
      box(85, 140, 375, 220, B + "12");
      txt("VAKUUMDAGI RENTGEN TRUBKASI", 272, 122, theme.muted, 13);
      line(145, 190, 145, 300, O, 5);
      txt("KATOD (−)", 145, 328, O, 13);
      txt("Elektronlar", 206, 180, G, 13);
      arrow(160, 245, 390, 245, G, "e⁻ · eU gacha tezlashadi");
      const electronX = 155 + 245 * s.progress;
      if (p.current > 0) {
        for (let i = 0; i < Math.min(5, Math.ceil(p.current / 4)); i++) {
          const x = electronX - i * 30;
          if (x > 150 && x < 400) ball(x, 245 + (i % 2 ? -5 : 5), 4, G);
        }
      }
      box(400, 165, 30, 160, "#73523f");
      line(390, 177, 435, 151, O, 4);
      line(390, 313, 435, 339, O, 4);
      txt(`ANOD (+), Z=${s.targetZ}`, 414, 370, O, 13);
      txt("Elektronlar nishonda tormozlanadi", 303, 288, theme.ink, 12);

      if (s.impact && p.current > 0) {
        for (let i = 0; i < 3; i++) {
          const y = 205 + i * 39;
          plot(u => Math.sin(u * Math.PI * 12), 445, y, 65, 8, B);
          arrow(510, y, 535, y, B);
        }
        txt("Rentgen fotonlari", 493, 345, B, 13);
      } else if (!s.impact) {
        txt("Elektron nishonga yaqinlashmoqda", 493, 345, theme.muted, 12);
      }

      const gx = 555, gy = 305, gw = 175, gh = 120;
      line(gx, gy, gx + gw, gy, theme.ink, 1.5);
      line(gx, gy, gx, gy - gh, theme.ink, 1.5);
      if (s.impact && p.current > 0) plot(u => 1 - u, gx, gy, gw, gh, O);
      txt(s.impact ? "Tormozlanish spektri · sxema" : "Nishondan keyingi spektr · sxema", 640, 155, theme.muted, 12);
      txt("Nisbiy intensivlik", gx, gy - gh - 7, theme.muted, 10, "left");
      txt("0", gx, gy + 18, theme.muted, 10);
      txt(`${format(s.energy)} keV`, gx + gw, gy + 18, theme.muted, 10, "right");
      txt("Foton energiyasi", gx + gw / 2, gy + 39, theme.muted, 11);
      const edgeX = gx + gw - 2;
      line(edgeX, gy, edgeX, gy - gh, R, 2, [5, 5]);
      txt("eU cutoff", edgeX, gy - gh + 15, R, 10, "right");
      if (p.current <= 0) {
        txt("Tok yo‘q · fotonlar chiqmaydi", 640, 340, R, 10);
      } else if (!s.impact) {
        txt("Elektron urilgach spektr paydo bo‘ladi", 640, 363, theme.muted, 10);
      } else if (s.kAlphaEnergy != null) {
        const lineX = gx + gw * (s.kAlphaEnergy / s.energy);
        line(lineX, gy, lineX, gy - gh * 0.8, G, 2);
        txt(`Kα ≈ ${format(s.kAlphaEnergy)} keV`, lineX, gy - gh * 0.8 - 7, G, 10);
      } else {
        txt("K-qobiq chegarasiga U yetmaydi", 640, 363, R, 10);
      }
      txt(`U = ${format(p.voltage)} kV · Elektron: ${format(s.electronKineticEnergy)} keV · λmin = ${format(s.wavelength)} nm`, 400, 405, theme.ink, 14);
      txt(`Dasta quvvati U·I = ${format(s.beamPower)} W`, 400, 431, theme.muted, 13);
      break;
    }
    case "electrolysis": {
      // Ionlarning drift tezligi ko'rgazmali: tok kuchiga bog'liq, haqiqiy m/s masshtabida emas.
      const current = Math.max(0, p.current);
      const drift = current * t * 12;
      const path = 320;
      const massMg = s.mass * 1e6;
      const coating = massMg > 0 ? Math.min(27, 4 + 6 * Math.sqrt(massMg)) : 0;

      box(140, 155, 520, 195, B + "18");
      line(140, 155, 660, 155, B, 2);
      box(180, 132, 24, 175, O);
      box(596, 132, 24, 175, B);
      if (coating > 0) box(596 - coating, 165, coating, 142, O);
      txt(c.compactMode ? "+" : "ANOD (+)", 192, 116, O, c.compactMode ? 30 : 15);
      txt(c.compactMode ? "−" : "KATOD (−)", 608, 116, B, c.compactMode ? 30 : 15);

      for (let i = 0; i < 10; i++) {
        const offset = (i * 41 + drift) % path;
        const y = 190 + (i % 5) * 25;
        ball(238 + offset, y, 6, O);
        if (!c.compactMode) txt("+", 238 + offset, y + 4, "#fff", 11);
      }
      for (let i = 0; i < 8; i++) {
        const offset = (i * 53 + drift) % path;
        const y = 202 + (i % 4) * 30;
        ball(562 - offset, y, 6, G);
        if (!c.compactMode) txt("−", 562 - offset, y + 4, "#fff", 11);
      }

      if (current > 0) {
        arrow(287, 326, 370, 326, O);
        arrow(513, 326, 430, 326, G);
        if (!c.compactMode) {
          txt("Kationlar", 328, 346, O, 14);
          txt("Anionlar", 472, 346, G, 14);
        }
      } else {
        txt("I = 0 A: ion oqimi yo‘q", 400, 327, theme.muted, c.compactMode ? 30 : 13);
      }
      if (!c.compactMode) txt(`I = ${format(current)} A · Q = ${format(s.charge)} C · m = ${format(massMg)} mg`, 400, 375, theme.ink, 16);
      break;
    }
    case "relativity": {
      if (s.gamma === null) break;
      const pixelsPerMetre = 180;
      box(100, 155, p.length * pixelsPerMetre, 30, B + "65");
      box(100, 250, s.length * pixelsPerMetre, 30, O);
      txt(`Jism bilan birga: L₀ = ${format(p.length)} m`, 400, 135, B);
      txt(`Laboratoriyada: L = ${format(s.length)} m`, 400, 230, O);
      line(100, 300, 640, 300, theme.muted, 1);
      for (let metre = 0; metre <= 3; metre++) {
        const x = 100 + metre * pixelsPerMetre;
        line(x, 294, x, 306, theme.muted, 1);
        txt(`${metre} m`, x, 327, theme.muted, 13);
      }
      txt(`Jism soati: Δτ = ${format(p.interval)} s`, 250, 365, B);
      txt(`Laboratoriya: Δt = ${format(s.time)} s`, 565, 365, O);
      txt(`γ = ${format(s.gamma)} · v/c = ${format(p.beta)} · uzunlik harakat bo‘ylab`, 400, 405, theme.muted, 14);
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
      line(505, 110, 505, 425, theme.line, 1);
      txt(`Rezerford · Z = ${p.z}`, 265, 122, O, 17);
      const path = s.path || [];
      if (path.length) {
        const maxX = Math.max(1, ...path.map(point => Math.abs(point.x)));
        const maxY = Math.max(1, ...path.map(point => Math.abs(point.y)));
        const pixels = Math.min(195 / maxX, 125 / maxY);
        const screen = point => [265 + point.x * pixels, 275 - point.y * pixels];
        c.beginPath();
        c.lineWidth = 2;
        c.strokeStyle = theme.line;
        c.setLineDash([5, 5]);
        path.forEach((point, index) => {
          const [x, y] = screen(point);
          if (index === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        });
        c.stroke();
        c.setLineDash([]);
        c.beginPath();
        c.lineWidth = 3;
        c.strokeStyle = O;
        path.slice(0, s.pathIndex + 1).forEach((point, index) => {
          const [x, y] = screen(point);
          if (index === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        });
        c.lineTo(...screen({ x: s.x, y: s.y }));
        c.stroke();
        const [x, y] = screen({ x: s.x, y: s.y });
        ball(x, y, 8, O);
      }
      ball(265, 275, 14, B);
      txt(`+${p.z}`, 265, 281, "#fff", 14);
      txt(`b = ${format(p.impact)} fm · θ = ${format(s.angle)}°`, 265, c.compactMode ? 394 : 398, theme.ink, 16);
      txt("Bor · vodorod (Z = 1)", 640, 122, B, 17);
      const levelY = { 2: 310, 3: 255, 4: 214, 5: 184, 6: 158 };
      for (let n = 2; n <= 6; n++) {
        const selected = n === p.upper || n === 2;
        line(560, levelY[n], 700, levelY[n], n === p.upper ? O : n === 2 ? G : theme.line, selected ? 3 : 1.5);
        txt(`n=${n}`, 737, levelY[n] + 5, selected ? theme.ink : theme.muted, 13);
      }
      arrow(635, levelY[p.upper] + 10, 635, levelY[2] - 8, O);
      const photonColor = { 3: "#f1592a", 4: "#4ac7cc", 5: "#5685ec", 6: "#9a67d2" }[p.upper];
      box(560, 342, 150, 20, theme.floor);
      line(570 + clamp((s.wavelength * 1e9 - 400) / 260, 0, 1) * 130, 343,
        570 + clamp((s.wavelength * 1e9 - 400) / 260, 0, 1) * 130, 362, photonColor, 5);
      txt(`n=${p.upper} → 2 · λ=${format(s.wavelength * 1e9)} nm`, 640, c.compactMode ? 394 : 397, photonColor, 16);
      if (!c.compactMode) txt(`Foton energiyasi ${format(s.photon)} eV`, 640, 423, theme.ink, 15);
      break;
    }
    case "atomSpectra": {
      line(475, 110, 475, 425, theme.line, 1);
      const levelY = { 1: 370, 2: 245, 3: 204, 4: 184, 5: 172, 6: 163, 7: 157, 8: 152 };
      const upper = Math.round(p.upper), lower = Math.round(p.lower);
      const from = p.absorption === 1 ? lower : upper;
      const to = p.absorption === 1 ? upper : lower;
      txt(`Bor sathlari · Z=${p.z}`, 245, 122, B, 17);
      for (let n = 1; n <= 8; n++) {
        const selected = n === upper || n === lower;
        line(150, levelY[n], 425, levelY[n], n === from ? O : n === to ? G : theme.line, selected ? 3 : 1.5);
        if (n <= 3) txt(`n=${n}`, 118, levelY[n] + 5, selected ? theme.ink : theme.muted, 13);
        if (n >= 4 && selected) txt(`n=${n}`, 436, levelY[n] + 5, theme.ink, 12, "left");
        if (selected) txt(`E${n}=${format(-13.605693 * p.z ** 2 / n ** 2)} eV`, 220, levelY[n] - 5, theme.muted, 11, "left");
      }
      txt("n=4–8 sathlari yaqinlashib boradi", 285, 139, theme.muted, 10);
      ball(405, levelY[from], 7, O);
      arrow(390, levelY[from], 390, levelY[to], p.absorption === 1 ? G : O);
      txt(p.absorption === 1 ? "Foton yutiladi" : "Foton chiqariladi", 282, 408, p.absorption === 1 ? G : O, 15);

      txt("Spektr chiziqlari", 615, 122, theme.ink, 17);
      const colors = ["#7b4fe0", "#405dde", "#36a7d4", "#39aa67", "#d6c83b", "#f28a30", "#e84b37"];
      const stripX = 510, stripY = 222, stripW = 220, segment = stripW / colors.length;
      const wavelength = s.wavelength * 1e9;
      const colorAt = value => colors[Math.min(colors.length - 1, Math.floor(clamp((value - 380) / 370, 0, 0.999) * colors.length))];
      if (p.absorption === 1) colors.forEach((color, index) => box(stripX + index * segment, stripY, segment + 1, 22, color));
      else {
        box(stripX, stripY, stripW, 22, "#080c11");
        if (p.z === 1 && lower === 2) {
          for (let level = 3; level <= 8; level++) {
            const lineNm = 1239.841984 / (13.605693 * (1 / 2 ** 2 - 1 / level ** 2));
            if (lineNm >= 380 && lineNm <= 750) {
              const x = stripX + ((lineNm - 380) / 370) * stripW;
              line(x, stripY + 2, x, stripY + 20, level === upper ? O : colorAt(lineNm), level === upper ? 4 : 2);
            }
          }
        }
      }
      const type = wavelength < 380 ? "Ultrabinafsha (UV)" : wavelength > 750 ? "Infraqizil (IQ)" : wavelength < 450 ? "Binafsha" : wavelength < 495 ? "Ko‘k" : wavelength < 570 ? "Yashil" : wavelength < 590 ? "Sariq" : wavelength < 620 ? "To‘q sariq" : "Qizil";
      const inVisibleBand = wavelength >= 380 && wavelength <= 750;
      const markerX = stripX + clamp((wavelength - 380) / (750 - 380), 0, 1) * stripW;
      if (inVisibleBand && p.absorption === 1) line(markerX, stripY - 4, markerX, stripY + 26, "#080c11", 4);
      else if (inVisibleBand && !(p.z === 1 && lower === 2)) line(markerX, stripY + 2, markerX, stripY + 20, O, 4);
      if (inVisibleBand) line(markerX, stripY - 11, markerX, stripY - 4, theme.ink, 2);
      else if (wavelength < 380) arrow(stripX - 5, stripY + 11, stripX - 30, stripY + 11, B);
      else arrow(stripX + stripW + 5, stripY + 11, stripX + stripW + 30, stripY + 11, R);
      txt("380 nm", stripX, stripY + 48, theme.muted, 12, "left");
      txt("750 nm", stripX + stripW, stripY + 48, theme.muted, 12, "right");
      txt(`${type} · λ=${format(wavelength)} nm`, 620, 315, inVisibleBand ? R : B, 17);
      txt(`Foton energiyasi ${format(s.photonEnergy)} eV`, 620, 347, theme.ink, 15);
      txt(`n=${from} → n=${to}`, 620, 389, theme.muted, 15);
      break;
    }
    case "nucleusRadioactivity": {
      line(400, 110, 400, 425, theme.line, 1);
      const protons = Math.max(1, Math.round(p.protons));
      const nucleons = Math.max(2, Math.round(p.nucleons));
      const shown = Math.min(48, nucleons);
      const points = [];
      for (let i = 0; i < shown; i++) {
        const radius = 10 + 78 * Math.sqrt((i + 0.5) / shown);
        const angle = i * 2.399963229728653;
        points.push([220 + Math.cos(angle) * radius, 245 + Math.sin(angle) * radius]);
      }
      points.forEach(([x, y], index) => ball(x, y, 7, index < Math.round(shown * protons / nucleons) ? O : B));
      txt(`Yadro sxemasi · A=${nucleons}`, 220, 130, O, 17);
      ball(115, 416, 5, O);
      txt("proton", 145, 421, theme.muted, 12, "left");
      ball(210, 416, 5, B);
      txt("neytron", 240, 421, theme.muted, 12, "left");
      txt(`Z=${protons} proton · N=${Math.max(0, nucleons - protons)} neytron`, 220, 355, theme.ink, 15);
      txt(`Δm = ${format(p.defect)} u · E_b = ${format(s.energy)} MeV`, 220, 391, theme.muted, 14);

      const total = Math.max(1, Math.min(100, Math.round(p.initial)));
      const expected = clamp(s.remaining / p.initial, 0, 1);
      const alive = Math.round(total * expected);
      for (let i = 0; i < total; i++) {
        const x = 455 + (i % 10) * 30;
        const y = 165 + Math.floor(i / 10) * 23;
        ball(x, y, 7, i < alive ? O : theme.line);
      }
      txt(`Radioaktiv namuna · N₀ = ${format(p.initial)}`, 600, 130, O, 17);
      ball(510, 149, 5, O);
      txt("ota yadro", 542, 154, theme.muted, 12, "left");
      ball(625, 149, 5, theme.line);
      txt("yemirilgan", 657, 154, theme.muted, 12, "left");
      txt(`T½ = ${format(p.halfLife)} · t/T½ = ${format(s.halfLives)}`, 600, 445, theme.ink, 15);
      box(462, 415, 276, 8, theme.floor);
      box(462, 415, 276 * expected, 8, O);
      txt(`Qolgan: ${format(s.remaining)} ta kutiladi · ${format(s.percent)}%`, 600, 391, G, 15);
      break;
    }
    case "nuclearFusion": {
      const approach = clamp(t / 3.5, 0, 1);
      const depart = clamp((t - 3.5) / 2.2, 0, 1);
      const nucleus = (x, y, colors, label) => {
        const offsets = colors.length === 2
          ? [[-12, 0], [12, 0]]
          : colors.length === 3
            ? [[0, -14], [-13, 10], [13, 10]]
            : [[-12, -12], [12, -12], [-12, 12], [12, 12]];
        colors.forEach((color, i) => ball(x + offsets[i][0], y + offsets[i][1], 13, color));
        if (label) txt(label, x, y + 62, theme.ink, 19);
      };
      txt("D + T  →  ⁴He + n + Q", 400, 113, theme.ink, 25);
      if (!s.reacted) {
        nucleus(210 + 145 * approach, 250, [O, B], "²H · deuteriy");
        nucleus(590 - 145 * approach, 250, [O, B, B], "³H · tritiy");
        arrow(290, 175, 355, 175, O);
        arrow(510, 175, 445, 175, B);
        txt("Har juftlikda: A 2 + 3 = 5 · Z 1 + 1 = 2", 400, 383, theme.muted, 16);
        txt(`N = ${Math.round(p.pairs)} juftlik · rasmda bittasi ko‘rsatilgan`, 400, 413, theme.ink, 14);
      } else {
        const heliumX = 400 - 115 * depart;
        const neutronX = 400 + 180 * depart;
        nucleus(heliumX, 245, [O, O, B, B], "");
        ball(neutronX, 245, 15, B);
        txt("⁴He · geliy", heliumX, 307, theme.ink, 17);
        txt("n · neytron", neutronX, 345, theme.ink, 17);
        arrow(400, 170, 400 + 135 * depart, 145, G);
        txt(`Q = ${format(s.perReaction)} MeV / juftlik`, 400, 383, G, 19);
        txt(`N = ${Math.round(p.pairs)} · jami Q = ${format(s.energy)} MeV · har juftlikda A=5, Z=2 saqlanadi`, 400, 413, theme.muted, 14);
      }
      break;
    }
    case "nucleus": {
      const nucleons = Math.max(2, Math.round(p.nucleons ?? 24));
      const shown = Math.min(80, nucleons);
      circle(285, 240, 108, theme.line);
      circle(285, 240, 113, O + "65");
      for (let i = 0; i < shown; i++) {
        const radius = shown <= 12
          ? 18 + 30 * Math.sqrt((i + 0.5) / shown)
          : 8 + 83 * Math.sqrt((i + 0.5) / shown);
        const angle = i * 2.399963229728653;
        ball(285 + Math.cos(angle) * radius, 240 + Math.sin(angle) * radius,
          shown <= 12 ? 18 : shown <= 40 ? 10 : 7, theme.ink);
      }
      txt(`A = ${nucleons} nuklon`, 285, 386, theme.ink, 17);
      txt("Tarkib sxematik, izotop aniqlanmagan", 285, 410, theme.muted, 12);
      txt("MASSA NUQSONI", 505, 166, theme.muted, 12, "left");
      txt(`Δm = ${format(p.defect)} u`, 505, 197, O, 20, "left");
      arrow(510, 229, 652, 229, O);
      txt("BOG'LANISH ENERGIYASI", 505, 271, theme.muted, 12, "left");
      txt(`${format(s.energy)} MeV`, 505, 306, theme.ink, 22, "left");
      txt(`${format(s.perNucleon)} MeV / nuklon`, 505, 339, G, 16, "left");
      if (nucleons > shown)
        txt(`${shown} ta nuklon chizilgan`, 285, 430, theme.muted, 11);
      break;
    }
    case "decay": {
      const n = Math.min(200, p.initial),
        fraction = s.remaining / p.initial;
      for (let i = 0; i < n; i++) {
        const x = 150 + (i % 20) * 26,
          y = 130 + Math.floor(i / 20) * 22;
        ball(x, y, 7, i < n * fraction ? (i % 2 ? O : B) : theme.line);
      }
      txt(
        "Kutilayotgan son · tasodifiy yakka yemirilish modeli emas",
        400,
        390,
        theme.muted,
        14,
      );
      break;
    }
    case "massEnergy": {
      const massFraction = Math.max(0, Math.min(1, p.mass / 20));
      box(135, 185, 200, 54, B + "70");
      box(135, 185, 200 * massFraction, 54, B);
      box(465, 185, 200, 54, O + "70");
      box(465, 185, 200 * massFraction, 54, O);
      arrow(350, 212, 450, 212, G, "c²");
      txt(`Tinchlik massasi: ${format(p.mass)} g`, 235, 160, B);
      txt("Tinchlik energiyasi", 565, 160, O);
      txt(`${format(s.joules)} J`, 565, 276, O, 22);
      txt(`${format(s.tnt)} kt TNT`, 565, 305, theme.muted, 15);
      txt("E = mc² · m kilogrammda olinadi", 400, 365);
      txt("Bu nazariy to‘liq aylanish ekvivalenti; real qurilmada olinadigan energiya emas", 400, 397, theme.muted, 13);
      break;
    }
  }
  // Natijalar o'ngdagi o'lchov panelida bor; pastdagi formula ustiga tushirmaymiz.
  if (s.warning)
    txt("Model chegarasi: izohni tajriba ostida ko‘ring", 400, 415, R, 13);
}
