const PLANCK = 6.62607015e-34;
const ELEMENTARY = 1.602176634e-19;
const ELECTRON_MASS = 9.1093837139e-31;
const HC_EV_NM = 1239.841984;

export function calculatePhotoelectric(p, time = 0) {
  const frequency14 = Number(p.frequency);
  const work = Number(p.work);
  const intensity = Number(p.intensity);
  const elapsed = Number(time);
  if (
    ![frequency14, work, intensity, elapsed].every(Number.isFinite) ||
    frequency14 <= 0 || work <= 0 || intensity < 0
  ) {
    return {
      photonEnergy: null, kinetic: null, thresholdFrequency: null,
      thresholdWavelength: null, electronSpeed: null, emittedCount: null,
      emits: false, warning: "Chastota va chiqish ishi musbat, intensivlik esa manfiy bo‘lmasin.",
    };
  }

  const frequency = frequency14 * 1e14;
  const photonEnergy = PLANCK * frequency / ELEMENTARY;
  const thresholdFrequency = work * ELEMENTARY / PLANCK;
  const thresholdFrequency14 = thresholdFrequency / 1e14;
  const thresholdWavelength = HC_EV_NM / work;
  // Einshteyn tenglamasi: bitta foton bitta elektron bilan energiya almashadi.
  const aboveThreshold = frequency >= thresholdFrequency;
  const emits = aboveThreshold && intensity > 0;
  const kinetic = aboveThreshold ? Math.max(0, photonEnergy - work) : 0;
  const electronSpeed = kinetic > 0
    ? Math.sqrt(2 * kinetic * ELEMENTARY / ELECTRON_MASS)
    : 0;
  // Intensivlik nisbiy optik quvvat: bir xil quvvatda foton oqimi 1/f ga mutanosib.
  // Ekrandagi son kalibrlangan fototok emas, kvant samaradorligi doimiy deb olinadi.
  const elapsedSafe = Math.max(0, elapsed);
  const emittedCount = emits ? intensity / 100 * 6 * elapsedSafe * (1e15 / frequency) : 0;
  return {
    photonEnergy, kinetic, thresholdFrequency, thresholdFrequency14,
    thresholdWavelength, electronSpeed, emittedCount, emits, aboveThreshold,
    frequency, work, intensity,
    warning: !aboveThreshold
      ? `Qizil chegara: f = ${frequency14.toFixed(2)}·10¹⁴ Hz < f₀ = ${thresholdFrequency14.toFixed(2)}·10¹⁴ Hz. Elektron chiqmaydi.`
      : "",
  };
}

export function photoelectricVariant(base) {
  return {
    ...base,
    key: "photoelectric",
    title: "Fotoeffekt",
    topicNumbers: [140],
    section: "kvant",
    visual: "photoelectric",
    static: false,
    duration: 6,
    formulaLatex: "h\\nu=A+E_{k\\max},\\quad f_0=\\frac{A}{h},\\quad \\lambda_0=\\frac{hc}{A}",
    params: [
      { key: "frequency", label: "Yorug‘lik chastotasi", min: 2, max: 30, step: 0.1, value: 10, unit: "·10¹⁴ Hz", level: 0 },
      { key: "work", label: "Metallning chiqish ishi", min: 1, max: 6, step: 0.1, value: 4.5, unit: "eV", level: 1 },
      { key: "intensity", label: "Intensivlik (nisbiy quvvat)", min: 0, max: 100, step: 1, value: 50, unit: "%", level: 2 },
    ],
    results: [
      { key: "photonEnergy", label: "Bitta foton energiyasi", unit: "eV" },
      { key: "kinetic", label: "Mumkin bo‘lgan maksimal Eₖ", unit: "eV" },
      { key: "thresholdFrequency14", label: "Qizil chegara chastotasi", unit: "·10¹⁴ Hz" },
      { key: "thresholdWavelength", label: "Chegara to‘lqin uzunligi", unit: "nm" },
      { key: "electronSpeed", label: "Elektron tezligi", unit: "m/s" },
      { key: "emittedCount", label: "Kutilayotgan elektronlar (sxema)", unit: "ta" },
    ],
    series: [["emittedCount", "ta"]],
    sweep: "frequency",
    calculate: calculatePhotoelectric,
    description: "Yorug‘lik chastotasi chiqish chegarasidan o‘tganda elektronlar qanday ajralishini tekshiring.",
    easy: "Har bir foton energiyasi hν ga teng. Agar u metall elektronini chiqarish ishidan kichik bo‘lsa, elektron chiqmaydi; chegaradan oshganda elektron ajraladi.",
    medium: "Chastota ortishi foton energiyasini va elektronning maksimal kinetik energiyasini oshiradi: Eₖ,max=hν−A. Bir xil optik quvvatda fotonlar soni esa hν ortishi sabab kamayadi. Chastota chegaradan past bo‘lsa, kuchliroq yorug‘lik ham elektron chiqarmaydi.",
    hard: [
      "h\\nu=A+E_{k\\max}",
      "f_0=\\frac{A}{h},\\quad \\lambda_0=\\frac{hc}{A}",
      "E_{k\\max}=h\\nu-A\\quad (\\nu\\ge f_0)",
      "v_{\\max}=\\sqrt{\\frac{2E_{k\\max}}{m_e}}\\quad (E_{k\\max}\\ll m_ec^2)",
      "N_\\gamma\\propto\\frac{P t}{h\\nu},\\quad N_e\\approx\\eta N_\\gamma\\quad (\\nu\\ge f_0)",
    ],
    task: "A=4.5 eV da avval f=10·10¹⁴ Hz ni sinang. So‘ng chastotani f₀ dan pastga tushiring: intensivlikni oshirsangiz ham elektron chiqmasligi kerak. Chegaradan o‘tgach intensivlikni o‘zgartiring — elektronlar soni o‘zgaradi, ularning maksimal energiyasi esa o‘zgarmaydi.",
    model: "Einshteynning fotoeffekt tenglamasi qo‘llanadi. Chiqish ishi bitta foton energiyasi bilan qoplanadi; ortgan qismi bitta elektronning maksimal kinetik energiyasiga aylanadi. Elektron tezligi Eₖ≪mₑc² bo‘lgani uchun klassik yaqinlashuvda hisoblanadi. Intensivlik slayderi nisbiy optik quvvatni bildiradi: shu quvvat va vaqt o‘zgarmasa, fotonlar soni 1/(hν) ga mutanosib. Ekrandagi elektronlar soni doimiy kvant samaradorligi farazi bilan ko‘rgazmali hisoblanadi, kalibrlangan fototok emas; sirt ifloslanishi, kontakt potensiali va elektronlarning energiya taqsimoti hisoblanmaydi.",
    engineering: "Fotoelementlar, fotodiodlar va tasvir datchiklarida yorug‘lik elektr signaliga aylanadi. Chegara chastotasi material tanloviga bog‘liq.",
    example: "A=4.5 eV uchun f₀≈1.09·10¹⁵ Hz va λ₀≈276 nm. 10¹⁵ Hz fotonning energiyasi≈4.14 eV bo‘lib, bu metalldan elektron chiqarishga yetmaydi.",
  };
}
