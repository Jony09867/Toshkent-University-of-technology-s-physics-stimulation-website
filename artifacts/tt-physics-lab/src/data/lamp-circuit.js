import { network } from "../physics/engine.js";

// Lampalar doimiy qarshilikli ideal yuk deb olinadi; yorqinlik quvvatga bog‘liq.
export function calculateLampCircuit(p) {
  const s = network(p);
  return {
    ...s,
    p1: s.i1 * s.u1,
    p2: s.i2 * s.u2,
  };
}

export function lampCircuitVariant(base) {
  return {
    ...base,
    title: "Lampalarni ulash",
    description: "Ikki lampani ketma-ket va parallel ulang; tok, kuchlanish va yorqinlikni solishtiring.",
    formulaLatex: "P_1=U_1I_1,\\quad P_2=U_2I_2",
    params: [
      { key: "mode", label: "Ulash turi (0/1)", min: 0, max: 1, step: 1, value: 0, unit: "", level: 0 },
      { key: "voltage", label: "Manba kuchlanishi", min: 0, max: 24, step: 0.5, value: 12, unit: "V", level: 0 },
      { key: "r1", label: "1-lampa qarshiligi", min: 5, max: 100, step: 1, value: 40, unit: "Ω", level: 1 },
      { key: "r2", label: "2-lampa qarshiligi", min: 5, max: 100, step: 1, value: 40, unit: "Ω", level: 1 },
    ],
    defaults: { mode: 0, voltage: 12, r1: 40, r2: 40 },
    results: [
      { key: "p1", label: "1-lampa quvvati", unit: "W" },
      { key: "p2", label: "2-lampa quvvati", unit: "W" },
      { key: "current", label: "Manba toki", unit: "A" },
      { key: "u1", label: "1-lampa kuchlanishi", unit: "V" },
      { key: "u2", label: "2-lampa kuchlanishi", unit: "V" },
    ],
    calculate: calculateLampCircuit,
    visual: "lampCircuit",
    static: true,
    series: [["p1", "W"], ["p2", "W"]],
    sweep: "voltage",
    easy: "Ikkita bir xil lampani avval ketma-ket, keyin parallel ulang. Ketma-ketda ikkisi ham xira yonadi; parallelda har biri manbaning to‘liq kuchlanishini oladi va yorqinroq yonadi.",
    medium: "Ketma-ketda ikkala lampadan bir xil tok o‘tadi va kuchlanish bo‘linadi. Parallelda lampalar kuchlanishi teng, tok esa tarmoqlarga bo‘linadi. Yorqinlik har bir lampaning P = UI quvvatiga qarab ko‘rsatiladi.",
    hard: [
      "R_{ket}=R_1+R_2,\\quad I=U/R_{ket}",
      "R_{par}=R_1R_2/(R_1+R_2),\\quad I=I_1+I_2",
      "P_1=U_1I_1,\\quad P_2=U_2I_2",
      "P_1+P_2=UI",
    ],
    task: "Bir xil qarshilikdagi lampalarni ikki usulda ulang. Qaysi holatda har birining quvvati kattaroq? Keyin bir lampaning qarshiligini o‘zgartirib solishtiring.",
    model: "Ideal doimiy kuchlanish manbai va harorati bilan qarshiligi o‘zgarmaydigan lampalar. Chizmadagi yorqinlik elektr quvvatining shartli ko‘rinishi; haqiqiy cho‘g‘lanma lampaning qizishi, rang o‘zgarishi va manbaning ichki qarshiligi hisoblanmaydi.",
    engineering: "Uy yoritgichlari odatda parallel ulanadi: har biri bir xil tarmoq kuchlanishini oladi. Ketma-ket ulanishda manba kuchlanishi lampalar orasida bo‘linadi.",
    example: "12 V manbaga ulangan ikkita 40 Ω ideal lampa ketma-ketda har biri 0.9 W, parallelda esa 3.6 W quvvat oladi.",
  };
}
