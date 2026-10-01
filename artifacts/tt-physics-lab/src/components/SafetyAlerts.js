import { format } from "./ResultCard.js";

/**
 * SafetyAlerts Component
 * Detects fundamental physical limit conditions and displays educational safeguards:
 * - 2nd Law of Thermodynamics violations (T2 >= T1)
 * - Short circuit & thermal overload in circuits (R -> 0, I -> inf)
 * - Red boundary of photoelectric effect (h*nu < A)
 * - Resonance catastrophe in undamped oscillations
 * - Elastic limit violations
 */

export class SafetyAlerts {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.mount();
  }

  mount() {
    if (!this.container) return;
    this.element = document.createElement("div");
    this.element.className = "safety-alert-banner";
    this.element.style.display = "none";
    this.activeAlertKey = null;
    this.container.prepend(this.element);
  }

  check(configKey, p, s) {
    if (!this.element) return;

    let alert = null;

    if (configKey === "thermo") {
      if (p.t1 <= p.t2) {
        alert = {
          type: "danger",
          icon: "⚠️",
          title: "Termodinamikaning II-qonuni buzilishi!",
          text: `Sovutgich harorati (T₂ = ${p.t2} K) isitkichnikidan (T₁ = ${p.t1} K) kichik bo‘lishi shart! Issiqlik o‘z-o‘zidan sovuq jismdan issiq jismga o‘tmaydi. FIK manfiy yoki nol bo‘lib, bunday issiqlik mashinasi ishlashi fizik jihatdan imkonsiz.`,
        };
      }
    } else if (configKey === "circuit" || configKey === "ohm") {
      const R = p.resistance ?? 1;
      const current = s.current ?? 0;
      if (R <= 0.5 || current > 12) {
        alert = {
          type: "warning",
          icon: "🔥",
          title: "Qisqa tutashuv va erish xavfi (R ≈ 0)!",
          text: `Tashqi qarshilik juda past (R = ${format(R)} Ω). Tok kuchi xavfli darajada yuqori (I = ${format(current)} A). Joule-Lenz qonuniga ko‘ra (Q = I²Rt) o‘tkazgichlar haddan tashqari qizib, izolyatsiya erishi va yong‘in xavfi yuzaga keladi.`,
        };
      }
    } else if (configKey === "photoelectric") {
      const photonEnergy = s.photonEnergy ?? (1240 / (p.wavelength ?? 400));
      const workFunc = s.workFunc ?? 2.0;
      if (photonEnergy < workFunc) {
        alert = {
          type: "info",
          icon: "🛑",
          title: "Fotoeffektning qizil chegarasi (hν < A)!",
          text: `Tushayotgan yorug‘lik foton energiyasi (${format(photonEnergy)} eV) metallning elektron chiqish ishidan (${format(workFunc)} eV) kichik. Eynshteyn tenglamasiga ko‘ra, yorug‘lik intensivligi qanchalik kuchli bo‘lmasin, metalldan birorta ham fotoelektron uchib chiqmaydi!`,
        };
      }
    } else if (configKey === "resonance") {
      const damping = p.damping ?? 0.1;
      const omega = p.frequency ?? 1;
      const omega0 = s.omega0 ?? 1;
      if (damping <= 0.05 && Math.abs(omega - omega0) < 0.1) {
        alert = {
          type: "danger",
          icon: "⚡",
          title: "Xavfli rezonans halokati (Mexanik sinish xavfi)!",
          text: `Majburiy tebranish chastotasi (ω = ${format(omega)}) xususiy chastotaga (ω₀ = ${format(omega0)}) teng va so‘nish juda kichik. Amplituda cheksiz ortib ketadi — texnikada (masalan, ko‘priklar yoki binolarda) bu konstruksiyaning butunlay yemirilishiga olib keladi!`,
        };
      }
    } else if (configKey === "spring") {
      const amp = p.amplitude ?? 0.3;
      if (amp > 0.7) {
        alert = {
          type: "warning",
          icon: "⚠️",
          title: "Guk qonunining elastiklik chegarasi!",
          text: `Prujina cho‘zilishi (${format(amp)} m) juda katta. Haqiqiy materiallarda bu plastik deformatsiyaga olib keladi: prujina elastikligini yo‘qotadi va qaytib o‘z holatiga kelmaydi.`,
        };
      }
    }

    if (alert) {
      const key = `${alert.type}-${alert.title}`;
      if (this.activeAlertKey !== key) {
        this.activeAlertKey = key;
        this.element.style.display = "flex";
        this.element.className = `safety-alert-banner alert-${alert.type}`;
        this.element.innerHTML = `
          <span class="alert-icon">${alert.icon}</span>
          <div class="alert-content">
            <strong>${alert.title}</strong>
            <p>${alert.text}</p>
          </div>
        `;
      }
    } else {
      if (this.activeAlertKey !== null) {
        this.activeAlertKey = null;
        this.element.style.display = "none";
      }
    }
  }

  destroy() {
    this.element?.remove();
  }
}
