// IAPWS to‘yingan suv bug‘i bosimi korrelyatsiyasi; T kelvinda, p paskalda.
// Manba: https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=935265
export const WATER_TRIPLE_T = 273.16;
export const WATER_CRITICAL_T = 647.096;
export const WATER_CRITICAL_P = 22.064e6;
const coefficients = [-7.85951783, 1.84408259, -11.7866497, 22.6807411, -15.9618719, 1.80122502];
const powers = [1, 1.5, 3, 3.5, 4, 7.5];

export function saturationPressure(temperature) {
  // Selsiydan aylantirishdagi ikkilik yaxlitlash fizik chegara buzilishi emas.
  if (!Number.isFinite(temperature) || temperature < WATER_TRIPLE_T - 1e-10 || temperature > WATER_CRITICAL_T + 1e-10) return null;
  temperature = Math.max(WATER_TRIPLE_T, Math.min(WATER_CRITICAL_T, temperature));
  const tau = 1 - temperature / WATER_CRITICAL_T;
  return WATER_CRITICAL_P * Math.exp(WATER_CRITICAL_T / temperature *
    coefficients.reduce((sum, a, i) => sum + a * tau ** powers[i], 0));
}

export function calculateWaterVapor(p) {
  const saturation = saturationPressure(p.temperature);
  return {
    saturation,
    celsius: Number.isFinite(p.temperature) ? p.temperature - 273.15 : null,
    critical: saturation !== null && Math.abs(p.temperature - WATER_CRITICAL_T) < 1e-10,
    // Bu ko‘rgazmali kontrast; zichlik yoki fazalarning hajm ulushi emas.
    contrast: saturation === null ? 0 : Math.pow(Math.max(0, Math.min(1, (WATER_CRITICAL_T - p.temperature) / (WATER_CRITICAL_T - WATER_TRIPLE_T))), 0.326),
    warning: saturation === null ? "Hisob faqat 273.16–647.096 K oralig‘ida. Kritik haroratdan yuqorida to‘yingan bug‘ bosimi aniqlanmaydi." : "",
  };
}

export function waterVaporVariant(base) {
  return {
    ...base,
    title: "To‘yingan bug‘ va kritik temperatura",
    description: "Haroratni oshiring: bug‘ bosimi ortadi, kritik nuqtada suyuqlik–bug‘ chegarasi yo‘qoladi.",
    formulaLatex: "p=p_{sat}(T)",
    params: [{ key: "temperature", label: "Harorat", min: WATER_TRIPLE_T, max: WATER_CRITICAL_T, step: 0.001, value: 373.15, unit: "K", level: 0 }],
    defaults: { temperature: 373.15 },
    results: [
      { key: "saturation", label: "Bug‘ bosimi", unit: "MPa", scale: 1e-6 },
      { key: "celsius", label: "Harorat", unit: "°C" },
    ],
    calculate: calculateWaterVapor,
    visual: "waterVapor",
    static: true,
    series: [["saturation", "MPa", 1e-6]],
    sweep: "temperature",
    easy: "Suyuqlik va uning to‘yingan bug‘i muvozanatda turibdi: bug‘lanish va kondensatsiya bir-birini qoplaydi. Haroratni oshiring va bosim ortishini kuzating. Slayderning oxirida suyuqlik va bug‘ orasidagi farq yo‘qoladi.",
    medium: "Har bir haroratda muvozanatga mos p_sat mavjud. 373.15 K (100 °C) da u taxminan 0.1014 MPa. Kritik nuqta: 647.096 K va 22.064 MPa. Bu egri chiziq bo‘ylab muvozanat holatlarini solishtirish; doimiy hajmdagi idishni qizdirish jarayoni emas.",
    hard: [
      "\\tau=1-T/T_c",
      "\\ln(p_{sat}/p_c)=\\frac{T_c}{T}\\sum_{i=1}^{6}a_i\\tau^{b_i}",
      "b_i=(1,1.5,3,3.5,4,7.5)",
      "a_i=(-7.85951783,1.84408259,-11.7866497,22.6807411,-15.9618719,1.80122502)",
      "T\\to T_c:\\quad p_{sat}\\to p_c",
    ],
    task: "Haroratni 373.15 K dan 647.096 K gacha oshiring. Bosim va fazalar chegarasini solishtiring.",
    model: "Toza suv uchun IAPWS to‘yinish bosimi korrelyatsiyasi, 273.16–647.096 K. Har bir nuqta alohida muvozanat holati. Idish, rang va zarrachalar sxematik: zichlik, massa, hajm ulushi yoki molekulalar soni hisoblanmaydi. Kritik nuqtadan yuqorida suyuqlik–bug‘ to‘yinish chizig‘i davom etmaydi.",
    example: "Bosimli qozonda qaynash harorati bosimga bog‘liq. 100 °C qiymati barcha bosimlarda bir xil emas.",
  };
}
