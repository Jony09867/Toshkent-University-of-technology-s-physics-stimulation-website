const root2 = Math.SQRT2;
const tau = 2 * Math.PI;

// Sinusoidal manba va aktiv yuk ulangan ideal transformator modeli.
export function calculateTransformerInduction(p, time = 0) {
  const { n1, n2, voltage, frequency, loadResistance } = p;
  if (![n1, n2, voltage, frequency, loadResistance, time].every(Number.isFinite)
    || n1 <= 0 || n2 <= 0 || voltage < 0 || frequency <= 0 || loadResistance <= 0) {
    return {
      voltage2: null, current1: null, current2: null, fluxPeak: null,
      powerIn: null, powerOut: null, efficiency: null, ratio: null,
      voltagePrimaryInstant: null, voltageSecondaryInstant: null,
      fluxInstant: null, warning: "O‘ramlar, chastota va yuk qarshiligi musbat bo‘lishi kerak.",
    };
  }

  const ratio = n2 / n1;
  const voltage2 = voltage * ratio;
  const current2 = voltage2 / loadResistance;
  const current1 = current2 * ratio;
  const powerIn = voltage * current1;
  const powerOut = voltage2 * current2;
  const omega = tau * frequency;
  const fluxPeak = (root2 * voltage) / (omega * n1);
  const phase = omega * time;
  const primaryPeak = root2 * voltage;

  return {
    voltage2,
    current1,
    current2,
    fluxPeak,
    fluxInstant: fluxPeak * Math.cos(phase),
    // Kuchlanishlar mos nuqtali qutblarda o‘lchanadi.
    voltagePrimaryInstant: primaryPeak * Math.sin(phase),
    voltageSecondaryInstant: primaryPeak * ratio * Math.sin(phase),
    powerIn,
    powerOut,
    efficiency: powerIn > 0 ? (powerOut / powerIn) * 100 : null,
    ratio,
    warning: "",
  };
}

export function transformerInductionVariant(base) {
  return {
    ...base,
    title: "Transformator va elektromagnit induksiya",
    topicNumbers: [120],
    visual: "transformerInduction",
    static: false,
    duration: 0.2,
    formulaLatex: "\\mathcal{E}=-N\\frac{d\\Phi}{dt},\\quad \\frac{U_{2,\\rm rms}}{U_{1,\\rm rms}}=\\frac{N_2}{N_1},\\quad U_1I_1=U_2I_2",
    params: [
      { key: "n1", label: "Birlamchi o‘ramlar soni", min: 10, max: 500, step: 10, value: 100, unit: "ta", level: 0 },
      { key: "n2", label: "Ikkilamchi o‘ramlar soni", min: 10, max: 500, step: 10, value: 200, unit: "ta", level: 0 },
      { key: "voltage", label: "Kirish kuchlanishi (effektiv)", min: 0, max: 250, step: 5, value: 100, unit: "V", level: 0 },
      { key: "frequency", label: "O‘zgaruvchan tok chastotasi", min: 20, max: 100, step: 1, value: 50, unit: "Hz", level: 1 },
      { key: "loadResistance", label: "Ikkilamchi yuk qarshiligi", min: 10, max: 1000, step: 10, value: 100, unit: "Ω", level: 2 },
    ],
    results: [
      { key: "voltage2", label: "Chiqish kuchlanishi (effektiv)", unit: "V" },
      { key: "current1", label: "Birlamchi tok (effektiv)", unit: "A" },
      { key: "current2", label: "Ikkilamchi tok (effektiv)", unit: "A" },
      { key: "fluxPeak", label: "Magnit oqim amplitudasi", unit: "Wb" },
      { key: "powerIn", label: "Kirish quvvati", unit: "W" },
      { key: "powerOut", label: "Yuk quvvati", unit: "W" },
      { key: "efficiency", label: "Ideal FIK", unit: "%" },
    ],
    series: [
      ["voltagePrimaryInstant", "V"],
      ["voltageSecondaryInstant", "V"],
    ],
    calculate: calculateTransformerInduction,
    sweep: undefined,
    description: "Chulg‘amlar nisbatini va chastotani o‘zgartiring. Magnit oqimi almashganda ikkilamchi chulg‘amda kuchlanish qanday hosil bo‘lishini kuzating.",
    easy: "Birlamchi chulg‘amga o‘zgaruvchan kuchlanish beriladi. U temir o‘zakdagi magnit oqimini davriy o‘zgartiradi; shu oqim ikkilamchi chulg‘amda EYuK hosil qiladi.",
    medium: "Ideal transformator uchun effektiv kuchlanishlar nisbati o‘ramlar nisbatiga teng: U₂/U₁=N₂/N₁. Chastota ortganda, bir xil U₁ va N₁ uchun Faradey qonuniga ko‘ra magnit oqim amplitudasi kamayadi. Chiqish kuchlanishi o‘ramlar soni bilan o‘zgaradi.",
    hard: [
      "\\mathcal{E}=-N\\frac{d\\Phi}{dt}",
      "\\Phi(t)=\\frac{\\sqrt{2}U_{1,\\rm rms}}{2\\pi fN_1}\\cos(2\\pi ft)",
      "\\frac{U_{2,\\rm rms}}{U_{1,\\rm rms}}=\\frac{N_2}{N_1},\\quad \\frac{I_2}{I_1}=\\frac{N_1}{N_2}",
      "P_{\\rm in}=U_1I_1=P_{\\rm out}=U_2I_2\\quad(\\text{ideal})",
    ],
    task: "N₂/N₁ nisbatini 2 ga tenglab, chiqish kuchlanishi kirishnikidan ikki baravar bo‘lishini kuzating. So‘ng chastotani oshiring: effektiv kuchlanish o‘zgarmaganda magnit oqim amplitudasi qanday o‘zgaradi?",
    engineering: "Elektr tarmoqlarida transformatorlar energiyani uzatishga mos yuqori kuchlanish beradi yoki qurilmalarga past kuchlanish hosil qiladi. Ideal modelda kuchlanish oshsa, shu quvvatda tok kamayadi.",
    example: "N₁=100, N₂=200 va U₁=100 V bo‘lsa, U₂=200 V. 100 Ω yukda I₂=2 A, ideal holda I₁=4 A va har ikki tomondagi quvvat 400 W.",
    model: "Sinusoidal manba, ideal magnit o‘zak va sof aktiv yuk. Effektiv kuchlanishlar uchun U₂/U₁=N₂/N₁; Faradey qonuni magnit oqim tebranishi va EYuKni belgilaydi. Yo‘qotishlar, oqim sizishi va o‘zak to‘yinish hisoblanmaydi.",
  };
}
