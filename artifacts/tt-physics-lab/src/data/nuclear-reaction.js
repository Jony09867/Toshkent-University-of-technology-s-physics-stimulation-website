// D + T → He-4 + n reaksiyasi uchun neytral atom massalari (u).
// Elektronlar soni ikkala tomonda teng, shuning uchun atom massalaridan Q topish mumkin.
export const fusionMasses = Object.freeze({
  deuterium: 2.01410177812,
  tritium: 3.01604928199,
  helium4: 4.00260325413,
  neutron: 1.00866491595,
});

export const fusionMassDefect =
  fusionMasses.deuterium + fusionMasses.tritium -
  fusionMasses.helium4 - fusionMasses.neutron;
export const fusionEnergy = fusionMassDefect * 931.49410242;

export function calculateFusion(p, t = 0) {
  const pairs = Math.max(1, Math.min(10, Math.round(Number(p.pairs) || 1)));
  // Vaqt faqat jarayonni sekin ko‘rsatish uchun; yadro reaksiyasi 3.5 s davom etmaydi.
  const reacted = t >= 3.5;
  return {
    energy: reacted ? fusionEnergy * pairs : 0,
    perReaction: fusionEnergy,
    massDefect: fusionMassDefect,
    beforeA: 5,
    afterA: 5,
    beforeZ: 2,
    afterZ: 2,
    reacted,
  };
}

export function nuclearReactionVariant(base) {
  return {
    ...base,
    title: "Deuteriy va tritiy sintezi",
    description: "D va T yadrolari qo‘shilib geliy-4, neytron va energiya hosil qiladi. Animatsiya vaqti sxematik.",
    formulaLatex: "{}^{2}_{1}H+{}^{3}_{1}H\\rightarrow{}^{4}_{2}He+{}^{1}_{0}n+Q",
    params: [{ key: "pairs", label: "Reaksiya juftlari", min: 1, max: 10, step: 1, value: 1, unit: "", level: 0 }],
    results: [
      { key: "energy", label: "Ajralgan energiya", unit: "MeV" },
      { key: "perReaction", label: "Bir juftlik energiyasi", unit: "MeV" },
      { key: "massDefect", label: "Massa farqi / juftlik", unit: "u" },
    ],
    calculate: calculateFusion,
    visual: "nuclearFusion",
    static: false,
    duration: 7,
    series: [["energy", "MeV"]],
    sweep: "pairs",
    easy: "Ikki og‘ir vodorod yadrosi yaqinlashadi. Sintezdan geliy-4 va erkin neytron hosil bo‘ladi; massa farqi energiyaga aylanadi. Play tugmasini bosing.",
    medium: "Boshlanishda A: 2+3=5 va Z: 1+1=2. Yakunda A: 4+1=5 va Z: 2+0=2. Massa farqidan Q≈17,59 MeV ajraladi. Juftlar sonini oshirib jami energiyani solishtiring.",
    hard: ["A_{boshlangich}=A_{yakun}=5,\\quad Z_{boshlangich}=Z_{yakun}=2", "Q=(m_D+m_T-m_{He}-m_n)c^2"],
    task: "Play tugmasini bosing, mahsulotlarni kuzating va reaksiya juftlari soni energiyaga qanday ta’sir qilishini tekshiring.",
    model: "D+T sintezining sxematik animatsiyasi. Ko‘rsatilgan soniyalar haqiqiy yadro reaksiyasi davomiyligi emas. Massa hisobida neytral atom massalari ishlatilgan; zaryad va nuklon soni saqlanadi.",
    example: "D–T sintezi termoyadro fizikasi uchun muhim namunadir; energiya hisobida Q=(m_boshlang‘ich−m_yakuniy)c² ishlatiladi.",
  };
}
