/**
 * ChallengeMode – Topshiriq / Muammo rejimi
 * Talabalarga maqsadli fizik vazifalar beradi va real vaqtda avtomatik baholaydi.
 */

const CHALLENGES = {
  projectile: {
    title: "🎯 Nishonni urish (Artilleriya masalasi)",
    desc: "Burchak va boshlang‘ich tezlikni shunday tanlangki, to‘p L = 30 m masofadagi nishonga tushsin.",
    target: "Uchish masofasi L = 30 ± 2 m",
    hint: "Burchakni 45° ga yaqinlashtirib, boshlang‘ich tezlikni sozlang.",
    eval: (s, p) => Math.abs((s.range ?? 0) - 30) <= 2,
    current: (s) => `${Number(s.range ?? 0).toFixed(1)} m`,
  },
  fall: {
    title: "⏱️ Aniq vaqtda tushish",
    desc: "Balandlikni sozlab, jismning erkin tushish vaqtini t = 2.0 s ga tenglashtiring.",
    target: "Tushish vaqti t = 2.0 ± 0.15 s",
    hint: "h = g·t²/2 = 9.8·4/2 ≈ 19.6 metr.",
    eval: (s, p) => Math.abs((s.duration ?? 0) - 2.0) <= 0.15,
    current: (s) => `${Number(s.duration ?? 0).toFixed(2)} s`,
  },
  spring: {
    title: "〰️ Tebranish davrini sozlash",
    desc: "Massa va prujina qattiqligini sozlab, tebranish davrini T = 1.0 s ga keltiring.",
    target: "Davr T = 1.0 ± 0.08 s",
    hint: "T = 2π√(m/k). m/k nisbati taxminan 0.025 bo‘lishi lozim.",
    eval: (s, p) => Math.abs((s.period ?? 0) - 1.0) <= 0.08,
    current: (s) => `${Number(s.period ?? 0).toFixed(2)} s`,
  },
  ohm: {
    title: "⚡ Nominal tok kuchi",
    desc: "Kuchlanish va qarshilikni shunday tanlangki, zanjirdagi tok I = 2.0 A bo‘lsin.",
    target: "Tok I = 2.0 ± 0.1 A",
    hint: "I = U / R. Masalan, U = 20 V va R = 10 Ω.",
    eval: (s, p) => Math.abs((s.current ?? 0) - 2.0) <= 0.1,
    current: (s) => `${Number(s.current ?? 0).toFixed(2)} A`,
  },
  circuit: {
    title: "🔋 Yuqori FIK ga erishish",
    desc: "Tashqi qarshilikni sozlab, zanjir FIKini kamida η ≥ 85% ga yetkazing.",
    target: "FIK η ≥ 85%",
    hint: "Tashqi qarshilik R ichki qarshilik r dan sezilarli darajada katta bo‘lishi kerak.",
    eval: (s, p) => Number(s.efficiency ?? 0) >= 85,
    current: (s) => `${Number(s.efficiency ?? 0).toFixed(1)}%`,
  },
  energy: {
    title: "🎢 Kinetik energiya cho‘qqisi",
    desc: "Eng quyi nuqtada kinetik energiyani Ek = 80 J ga yetkazing.",
    target: "Kinetik energiya Ek = 80 ± 8 J",
    hint: "Boshlang‘ich balandlik h yoki massani mos ravishda oshiring.",
    eval: (s, p) => Math.abs((s.kinetic ?? 0) - 80) <= 8,
    current: (s) => `${Number(s.kinetic ?? 0).toFixed(1)} J`,
  },
  newton: {
    title: "🚀 Aniq tezlanish hosil qilish",
    desc: "Massa va kuchni shunday tanlangki, tezlanish a = 5.0 m/s² bo‘lsin.",
    target: "Tezlanish a = 5.0 ± 0.3 m/s²",
    hint: "a = F / m munosabatidan foydalaning.",
    eval: (s, p) => Math.abs((s.a ?? 0) - 5.0) <= 0.3,
    current: (s) => `${Number(s.a ?? 0).toFixed(2)} m/s²`,
  },
  friction: {
    title: "🛑 Tormozlanish masofasi",
    desc: "Boshlang‘ich tezlik va ishqalanishni sozlab, tormoz masofasini S = 10 m ga keltiring.",
    target: "Tormoz masofasi S = 10 ± 1 m",
    hint: "S = v₀² / (2μg).",
    eval: (s, p) => Math.abs((s.distance ?? 0) - 10) <= 1,
    current: (s) => `${Number(s.distance ?? 0).toFixed(1)} m`,
  },
  lens: {
    title: "🔍 Haqiqiy tasvir hosil qilish",
    desc: "Predmetni shunday masofaga qo‘yingki, linzada haqiqiy tasvir hosil bo‘lsin.",
    target: "Tasvir: Haqiqiy (d > F)",
    hint: "Predmet masofasini fokus masofasidan katta qiling (d > F).",
    eval: (s, p) => Boolean(s.real),
    current: (s) => s.real ? "Haqiqiy" : "Xayoliy",
  },
};

export function challengeFor(config) {
  if (CHALLENGES[config.key]) return CHALLENGES[config.key];
  const baseline = {
    ...Object.fromEntries(config.params.map((param) => [param.key, param.value])),
    ...config.defaults,
  };
  const sampleTime = config.static ? 0 : config.duration / 2;
  let starting;
  try {
    starting = config.calculate(baseline, sampleTime);
  } catch {
    return null;
  }
  for (const param of config.params) {
    for (const value of [param.min, param.max]) {
      if (value === baseline[param.key]) continue;
      const trial = { ...baseline, [param.key]: value };
      let outcome;
      try {
        outcome = config.calculate(trial, sampleTime);
      } catch {
        continue;
      }
      for (const result of config.results) {
        const start = starting[result.key];
        const target = outcome[result.key];
        if (!Number.isFinite(start) || !Number.isFinite(target)) continue;
        const difference = Math.abs(target - start);
        if (difference < Number.EPSILON * Math.max(1, Math.abs(start), Math.abs(target)) * 10) continue;
        const tolerance = Math.max(difference * 0.06, Math.abs(target) * 0.01);
        const scale = result.scale ?? 1;
        const format = (number) => Number((number * scale).toPrecision(4)).toLocaleString("uz-UZ");
        const label = result.label || result.key;
        return {
          parameterKey: param.key,
          title: `${config.title}: natijani toping`,
          desc: `${param.label || param.key} ni sozlab, ${label.toLowerCase()} qiymatini maqsadga yetkazing.`,
          target: `${label}: ${format(target)} ${result.unit || ""}`.trim(),
          hint: `Boshlang‘ich holatda ${format(start)} ${result.unit || ""}. ${param.label || param.key} natijaga qanday ta’sir qilishini kuzating.`,
          eval: (_state, currentParams) => {
            try {
              const actual = config.calculate(currentParams, sampleTime)[result.key];
              return Number.isFinite(actual) && Math.abs(actual - target) <= tolerance;
            } catch {
              return false;
            }
          },
          current: (_state, currentParams) => {
            try {
              const actual = config.calculate(currentParams, sampleTime)[result.key];
              return Number.isFinite(actual) ? `${format(actual)} ${result.unit || ""}`.trim() : "—";
            } catch {
              return "—";
            }
          },
        };
      }
    }
  }
  return null;
}

export function mountChallengeMode(container, config, getState) {
  const challenge = challengeFor(config);
  if (!challenge || !container) return { update() {}, destroy() {} };

  const storageKey = `tt-challenge-${config.id || config.key}`;
  let isDone = localStorage.getItem(storageKey) === "1";

  const el = document.createElement("section");
  el.className = "challenge-card" + (isDone ? " is-completed" : "");
  el.innerHTML = `
    <div class="challenge-header">
      <span class="challenge-badge">${isDone ? "✅ Bajarildi" : "🏆 Vazifa / Topshiriq"}</span>
      <button type="button" class="challenge-hint-btn" title="Yordam">💡 Maslahat</button>
    </div>
    <h3 class="challenge-title">${challenge.title}</h3>
    <p class="challenge-desc">${challenge.desc}</p>
    <div class="challenge-target-row">
      <span class="challenge-target-label">Maqsad:</span>
      <strong>${challenge.target}</strong>
    </div>
    <div class="challenge-status-row">
      <span>Hozirgi natija: <b id="ch-current">—</b></span>
      <button type="button" id="ch-submit" class="challenge-check-btn">${isDone ? "Qayta tekshirish" : "Tekshirish"}</button>
    </div>
    <div id="ch-feedback" class="challenge-feedback" hidden></div>
    <div id="ch-hint-box" class="challenge-hint-box" hidden>${challenge.hint}</div>
  `;

  container.append(el);

  const currentEl = el.querySelector("#ch-current");
  const submitBtn = el.querySelector("#ch-submit");
  const feedbackEl = el.querySelector("#ch-feedback");
  const hintBtn = el.querySelector(".challenge-hint-btn");
  const hintBox = el.querySelector("#ch-hint-box");

  hintBtn.onclick = () => {
    hintBox.hidden = !hintBox.hidden;
  };

  submitBtn.onclick = () => {
    const { state, p } = getState();
    if (!state) return;

    const pass = challenge.eval(state, p);
    feedbackEl.hidden = false;

    if (pass) {
      feedbackEl.className = "challenge-feedback success";
      feedbackEl.innerHTML = `🎉 <strong>Ajoyib natija!</strong> Topshiriq to‘g‘ri bajarildi (+100 ball). Fizik qonuniyat muvaffaqiyatli sinovdan o‘tkazildi.`;
      el.classList.add("is-completed");
      localStorage.setItem(storageKey, "1");
    } else {
      feedbackEl.className = "challenge-feedback error";
      const cur = challenge.current ? challenge.current(state, p) : "mos emas";
      feedbackEl.innerHTML = `❌ <strong>Hali yetarli emas.</strong> Hozirgi qiymat: <b>${cur}</b>. Kerakli maqsad: <b>${challenge.target}</b>. Maslahatdan foydalaning va qayta urinib ko‘ring!`;
    }
  };

  return {
    update(state, p) {
      if (!state || !currentEl) return;
      if (challenge.current) {
        currentEl.textContent = challenge.current(state, p);
      }
    },
    destroy() {
      el.remove();
    },
  };
}
