import { format } from "./ResultCard.js";

/**
 * ChallengeMode Component
 * Provides gamified interactive engineering challenges with automatic verification,
 * scoring, physics hints, and target feedback.
 */

export const simulationChallenges = {
  lever: [
    {
      id: "lever-1",
      title: "Richagni muvozanatga keltirish",
      desc: "Chap tomonda m₁ = 4 kg yuk l₁ = 1.5 m masofada turibdi. O‘ng tomondagi m₂ = 2 kg yuk qaysi masofaga (l₂) qo‘yilsa richag muvozanatga keladi?",
      hint: "Momentlar qoidasi: m₁ · l₁ = m₂ · l₂. Demak, 4 · 1.5 = 2 · l₂.",
      targetText: "Muvozanat (ΔM = 0 N·m)",
      check: (p, s) => {
        const error = Math.abs(s.netTorque);
        return {
          passed: error <= 0.3,
          actual: `${format(s.netTorque)} N·m`,
          score: error <= 0.1 ? 100 : Math.max(50, Math.round(100 - error * 20)),
          msg: error <= 0.3 ? "Ajoyib! Richag to‘liq muvozanatda! 🎉" : `Hali muvozanatda emas: ΔM = ${format(s.netTorque)} N·m.`,
        };
      },
    },
  ],
  projectile: [
    {
      id: "projectile-1",
      title: "35 metrli nishonga urish",
      desc: "Boshlang‘ich tezlik v₀ = 20 m/s bo‘lgan to‘p 35.0 metr uzoqlikdagi nishonga tegishi uchun boshlang‘ich burchakni toping!",
      hint: "Uchish masofasi formulasi: S = (v₀² sin 2α) / g. sin(2α) = 35 · 9.8 / 400 ≈ 0.8575.",
      targetText: "Masofa: 35.0 m (± 1.0 m)",
      targetX: 35.0,
      check: (p, s) => {
        const diff = Math.abs(s.range - 35.0);
        return {
          passed: diff <= 1.0,
          actual: `${format(s.range)} m`,
          score: diff <= 0.4 ? 100 : Math.max(60, Math.round(100 - diff * 20)),
          msg: diff <= 1.0 ? "To‘g‘ridan-to‘g‘ri markazga tegildi! Ajoyib hisob-kitob! 🎯" : `To‘p ${format(s.range)} metrga tushdi (Farq: ${format(diff)} m).`,
        };
      },
    },
  ],
  pendulum: [
    {
      id: "pendulum-1",
      title: "2 soniyalik davrli mayatnik",
      desc: "Klassik devor soatlarida mayatnik tebranish davri aynan T = 2.00 s bo‘lishi lozim. Ip uzunligini moslang!",
      hint: "Gyuygens formulasi: T = 2π√(l/g) → l = g · (T / 2π)² ≈ 9.8 · (2 / 6.283)² ≈ 0.993 m.",
      targetText: "Davr: T = 2.00 s (± 0.05 s)",
      check: (p, s) => {
        const diff = Math.abs(s.period - 2.00);
        return {
          passed: diff <= 0.05,
          actual: `${format(s.period)} s`,
          score: diff <= 0.02 ? 100 : Math.max(60, Math.round(100 - diff * 400)),
          msg: diff <= 0.05 ? "Qoyilmaqom! Soat sekund mili mukammal ishlaydi! ⏱️" : `Hozirgi davr: ${format(s.period)} s. Ip uzunligini o‘zgartiring.`,
        };
      },
    },
  ],
  spring: [
    {
      id: "spring-1",
      title: "1 soniyalik tebranish davri",
      desc: "Prujina bikrligi k = 40 N/m bo‘lganda, tebranish davri T = 1.00 s bo‘lishi uchun yuk massasini toping!",
      hint: "T = 2π√(m/k) → m = k · (T / 2π)² ≈ 40 · (1 / 6.283)² ≈ 1.01 kg.",
      targetText: "Davr: T = 1.00 s (± 0.05 s)",
      check: (p, s) => {
        const diff = Math.abs(s.period - 1.00);
        return {
          passed: diff <= 0.05,
          actual: `${format(s.period)} s`,
          score: diff <= 0.02 ? 100 : Math.max(60, Math.round(100 - diff * 400)),
          msg: diff <= 0.05 ? "To‘g‘ri! Prujinali osillyator talabga mos rezonansda! 🌀" : `Hozirgi davr: ${format(s.period)} s.`,
        };
      },
    },
  ],
  thermo: [
    {
      id: "thermo-1",
      title: "50% FIKli Karno sikli",
      desc: "Sovutgich harorati T₂ = 300 K bo‘lganda, Karno dvigatelining FIKi aynan η = 50.0% bo‘lishi uchun isitkich harorati T₁ ni aniqlang!",
      hint: "η = 1 - T₂/T₁ → 0.5 = 1 - 300/T₁ → T₁ = 300 / 0.5 = 600 K.",
      targetText: "FIK: η = 50.0% (± 1.0%)",
      check: (p, s) => {
        const diff = Math.abs(s.efficiency - 50.0);
        return {
          passed: diff <= 1.0,
          actual: `${format(s.efficiency)}%`,
          score: diff <= 0.2 ? 100 : Math.max(60, Math.round(100 - diff * 20)),
          msg: diff <= 1.0 ? "Mukammal termodinamik hisob! FIK = 50%! ⚙️" : `Hozirgi FIK: ${format(s.efficiency)}%. Isitkich haroratini sozlang.`,
        };
      },
    },
  ],
  circuit: [
    {
      id: "circuit-1",
      title: "1.5 Amper tok kuchi",
      desc: "Manba EYUKi ε = 12 V, ichki qarshiligi r = 1.0 Ω. Tok kuchi I = 1.50 A bo‘lishi uchun tashqi qarshilik R ni toping!",
      hint: "To‘liq zanjir uchun Om qonuni: I = ε / (R + r) → 1.5 = 12 / (R + 1) → R + 1 = 8 → R = 7.0 Ω.",
      targetText: "Tok kuchi: I = 1.50 A (± 0.05 A)",
      check: (p, s) => {
        const diff = Math.abs(s.current - 1.50);
        return {
          passed: diff <= 0.05,
          actual: `${format(s.current)} A`,
          score: diff <= 0.01 ? 100 : Math.max(60, Math.round(100 - diff * 400)),
          msg: diff <= 0.05 ? "To‘g‘ri! Zanjirdagi yuklama ideal hisoblandi! ⚡" : `Hozirgi tok: ${format(s.current)} A.`,
        };
      },
    },
  ],
  lens: [
    {
      id: "lens-1",
      title: "2 marta kattalashgan tasvir",
      desc: "Fokus masofasi F = 0.5 m bo‘lgan yig‘uvchi linzada 2 marta kattalashgan (k = 2) haqiqiy tasvir olish uchun predmet masofasi d ni sozlang!",
      hint: "1/F = 1/d + 1/f va f/d = 2 → f = 2d. 1/0.5 = 1/d + 1/(2d) = 3/(2d) → d = 0.75 m.",
      targetText: "Kattalashtirish: k = 2.0 (± 0.15)",
      check: (p, s) => {
        const mag = Math.abs(s.magnification ?? 0);
        const diff = Math.abs(mag - 2.0);
        return {
          passed: diff <= 0.15 && s.real,
          actual: `k = ${format(mag)} (${s.real ? "haqiqiy" : "mavhum"})`,
          score: diff <= 0.05 ? 100 : Math.max(60, Math.round(100 - diff * 100)),
          msg: diff <= 0.15 && s.real ? "Ajoyib optik fokus! Tasvir 2 marta kattalashdi! 🔍" : `Kattalashtirish: ${format(mag)}. Predmetni d = 0.75 m ga yaqinlashtiring.`,
        };
      },
    },
  ],
  collision: [
    {
      id: "collision-1",
      title: "Tezlikni to‘liq uzatish",
      desc: "1-aravacha 2-aravachaga urilgach butunlay to‘xtashi (v₁' = 0 m/s) uchun elastiklik e = 1 da massalarni qanday tanlash kerak?",
      hint: "Teng massali jismlar (m₁ = m₂) elastik to‘qnashganda o‘zaro tezliklarini to‘liq almashadi!",
      targetText: "v₁' = 0.0 m/s (± 0.2 m/s)",
      check: (p, s) => {
        const diff = Math.abs(s.v1After);
        return {
          passed: diff <= 0.2,
          actual: `v₁' = ${format(s.v1After)} m/s`,
          score: diff <= 0.05 ? 100 : Math.max(60, Math.round(100 - diff * 100)),
          msg: diff <= 0.2 ? "Impuls va energiya to‘liq uzatildi! 1-aravacha to‘xtadi! 💥" : `1-aravacha to‘xtamadi: v₁' = ${format(s.v1After)} m/s. Massalarni tenglashtirib ko‘ring.`,
        };
      },
    },
  ],
  buoyancy: [
    {
      id: "buoyancy-1",
      title: "Neytral suzish holati",
      desc: "Jism suyuqlik ichida na cho‘kmasligi, na sirtga qalqib chiqmasligi (neytral muvozanat) uchun zichlikni sozlang!",
      hint: "Arximed qonuni: Jism zichligi suyuqlik zichligiga teng bo‘lsa (ρ = ρ_suyuqlik), jism suyuqlik ichida osilib turadi.",
      targetText: "ρ = ρ_suyuqlik (Neytral suzish)",
      check: (p, s) => {
        const diff = Math.abs(p.rho - p.fluid);
        return {
          passed: diff <= 20,
          actual: `ρ = ${p.rho} kg/m³ (Suyuqlik: ${p.fluid})`,
          score: diff === 0 ? 100 : 80,
          msg: diff <= 20 ? "Gidrostatik muvozanat! Jism erkin osilib turibdi! 🌊" : "Jism yo cho‘kmoqda, yoki sirtga qalqib chiqyapti.",
        };
      },
    },
  ],
};

export class ChallengeMode {
  constructor(container, config, getSimState) {
    this.container = container;
    this.config = config;
    this.getState = getSimState;
    this.challenges = simulationChallenges[config.key] || [];
    this.activeIdx = 0;
    this.element = null;
    this.isOpen = false;
    this.mount();
  }

  mount() {
    if (!this.container) return;
    this.element = document.createElement("div");
    this.element.className = "challenge-mode-container";

    if (!this.challenges.length) {
      // Generic challenge for other simulations
      this.challenges = [
        {
          id: `${this.config.key}-auto`,
          title: `Laboratoriya tadqiqoti: ${this.config.title}`,
          desc: "Parametrlarni o‘zgartirib, tizimning maksimal natijadorligini kuzating va tahlil qiling.",
          hint: "Barcha darajalarda parametrlarning ta’sirini tahlil qiling.",
          targetText: "O‘lchovlarni bajarish",
          check: (p, s) => ({
            passed: true,
            actual: "Tahlil yakunlandi",
            score: 100,
            msg: "Laboratoriya o‘lchovlari muvaffaqiyatli bajarildi! ✓",
          }),
        },
      ];
    }

    const ch = this.challenges[this.activeIdx];
    this.element.innerHTML = `
      <div class="challenge-card">
        <div class="challenge-top">
          <div class="challenge-badge">
            <span class="badge-icon">🎯</span>
            <span>Laboratoriya Vazifasi</span>
          </div>
          <span class="challenge-points" id="ch-status-badge">Kutilmoqda</span>
        </div>
        <h3 class="challenge-title" id="ch-title">${ch.title}</h3>
        <p class="challenge-desc" id="ch-desc">${ch.desc}</p>
        <div class="challenge-target-row">
          <small>Maqsadli ko‘rsatkich:</small>
          <strong id="ch-target">${ch.targetText}</strong>
        </div>
        <div class="challenge-actions">
          <button type="button" class="button primary challenge-verify-btn" id="btn-check-challenge">
            Tekshirish (Check)
          </button>
          <button type="button" class="subtle-button challenge-hint-btn" id="btn-show-hint">
            💡 Maslahat
          </button>
        </div>
        <div class="challenge-feedback" id="ch-feedback" style="display: none;"></div>
      </div>
    `;

    this.container.append(this.element);
    this.bindEvents();
  }

  bindEvents() {
    const btnCheck = this.element.querySelector("#btn-check-challenge");
    const btnHint = this.element.querySelector("#btn-show-hint");
    const feedback = this.element.querySelector("#ch-feedback");
    const statusBadge = this.element.querySelector("#ch-status-badge");

    btnHint?.addEventListener("click", () => {
      const ch = this.challenges[this.activeIdx];
      if (feedback) {
        feedback.style.display = "block";
        feedback.className = "challenge-feedback hint";
        feedback.innerHTML = `<span>💡 Maslahat:</span> ${ch.hint}`;
      }
    });

    btnCheck?.addEventListener("click", () => {
      const sim = this.getState();
      if (!sim) return;
      const ch = this.challenges[this.activeIdx];
      const result = ch.check(sim.p, sim.s);

      feedback.style.display = "block";
      if (result.passed) {
        feedback.className = "challenge-feedback success";
        feedback.innerHTML = `
          <strong>🎉 ${result.msg}</strong>
          <div>Haqiqiy qiymat: <b>${result.actual}</b> · Ball: <b>+${result.score}</b></div>
        `;
        statusBadge.textContent = "Bajarildi! ⭐⭐⭐";
        statusBadge.className = "challenge-points completed";
        // Save completed challenge
        try {
          const list = JSON.parse(localStorage.getItem("tt-completed-challenges") || "[]");
          if (!list.includes(ch.id)) {
            list.push(ch.id);
            localStorage.setItem("tt-completed-challenges", JSON.stringify(list));
          }
        } catch {}
      } else {
        feedback.className = "challenge-feedback fail";
        feedback.innerHTML = `
          <strong>❌ ${result.msg}</strong>
          <div>Joriy natija: <b>${result.actual}</b>. Yana urinib ko‘ring yoki maslahatni o‘qing.</div>
        `;
        statusBadge.textContent = "Qayta urinish";
        statusBadge.className = "challenge-points retry";
      }
    });
  }

  destroy() {
    this.element?.remove();
  }
}
