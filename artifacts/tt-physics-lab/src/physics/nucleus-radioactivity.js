import { models } from "./catalog-engine.js";

const LN2 = Math.LN2;

// Bitta namuna uchun massa nuqsoni soddalashtirilgan; radioaktiv yemirilish
// esa ko‘p yadrolardan iborat namunadagi kutilayotgan sonni ifodalaydi.
export function calculateNucleusRadioactivity(p, t = 0) {
  const valid = [p.defect, p.nucleons, p.protons, p.initial, p.halfLife].every(Number.isFinite) &&
    p.defect >= 0 && p.nucleons >= 2 && p.protons >= 1 &&
    p.protons <= p.nucleons && p.initial > 0 && p.halfLife > 0;
  if (!valid) {
    return {
      energy: null, perNucleon: null, mass: null, remaining: null,
      decayed: null, percent: null, activity: null, lambda: null,
      protons: p.protons, neutrons: null, warning: "Protonlar soni nuklonlar sonidan oshmasin; namuna va yarim davr musbat bo‘lsin.",
    };
  }
  const nucleus = models.binding({ defect: p.defect, nucleons: p.nucleons });
  const elapsed = Number.isFinite(t) ? Math.max(0, t) : 0;
  const lambda = LN2 / p.halfLife;
  const remaining = p.initial * Math.exp(-lambda * elapsed);
  return {
    ...nucleus,
    remaining,
    decayed: p.initial - remaining,
    percent: (remaining / p.initial) * 100,
    activity: lambda * remaining,
    lambda,
    halfLives: elapsed / p.halfLife,
    protons: Math.round(p.protons),
    neutrons: Math.max(0, Math.round(p.nucleons) - Math.round(p.protons)),
    warning: "",
  };
}
