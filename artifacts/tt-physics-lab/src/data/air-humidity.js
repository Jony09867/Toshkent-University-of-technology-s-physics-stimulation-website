import { saturationPressure, WATER_TRIPLE_T } from "./water-vapor.js";

// 1 m³ yopiq namunada suvning jami massasi saqlanadi.
// Gaz fazasi siyrak deb olinadi: rho_v = p_v M/(RT), natija g/m³.
const WATER_MOLAR_MASS = 18.01528; // g/mol
const GAS_CONSTANT = 8.314462618; // J/(mol·K)
export const HUMIDITY_MAX_T = 323.15;

export function calculateAirHumidity(p) {
  const { temperature, waterContent } = p;
  const pressure = saturationPressure(temperature);
  if (pressure === null || temperature > HUMIDITY_MAX_T || !Number.isFinite(waterContent) || waterContent < 0) {
    return {
      relative: null, vaporMass: null, condensate: null, capacity: null, vaporPressure: null,
      warning: "Harorat 273.16–323.15 K, suv miqdori esa manfiy bo‘lmagan qiymat bo‘lishi kerak.",
    };
  }
  const capacity = pressure * WATER_MOLAR_MASS / (GAS_CONSTANT * temperature);
  const vaporMass = Math.min(waterContent, capacity);
  const condensate = Math.max(0, waterContent - capacity);
  return {
    relative: 100 * vaporMass / capacity,
    vaporMass,
    condensate,
    capacity,
    vaporPressure: vaporMass * GAS_CONSTANT * temperature / WATER_MOLAR_MASS,
    warning: "",
  };
}

export function airHumidityVariant(base) {
  return {
    ...base,
    title: "Havoning namligi va kondensatsiya",
    description: "Harorat va suv miqdorini o‘zgartiring: nisbiy namlik hamda tomchi hosil bo‘lishini kuzating.",
    formulaLatex: "\\varphi=100\\,\\rho_v/\\rho_{sat}",
    params: [
      { key: "temperature", label: "Harorat", min: WATER_TRIPLE_T, max: HUMIDITY_MAX_T, step: 0.01, value: 293.15, unit: "K", level: 0 },
      { key: "waterContent", label: "Jami suv", min: 0, max: 80, step: 0.1, value: 10, unit: "g/m³", level: 0 },
    ],
    defaults: { temperature: 293.15, waterContent: 10 },
    results: [
      { key: "relative", label: "Namlik", unit: "%" },
      { key: "vaporMass", label: "Bug‘", unit: "g/m³" },
      { key: "condensate", label: "Tomchi", unit: "g/m³" },
      { key: "capacity", label: "Sig‘im", unit: "g/m³" },
    ],
    calculate: calculateAirHumidity,
    visual: "airHumidity",
    static: true,
    series: [["relative", "%"]],
    sweep: "temperature",
    easy: "Havoda suv bug‘i bor. Sovuq havo kamroq bug‘ sig‘diradi. Haroratni pasaytirganda namlik 100% ga yetadi; ortiqcha suv tomchi bo‘lib oynada ko‘rinadi.",
    medium: "Model 1 m³ yopiq havo namunasini oladi. Jami suv = havodagi bug‘ + tomchilar. To‘yinish bug‘ bosimi haroratga bog‘liq; ideal gaz yaqinlashuvida bug‘ning eng katta massasi rho_sat = p_sat M/(RT). Shundan yuqori suv miqdori kondensatsiyalanadi.",
    hard: [
      "\\rho_{sat}=p_{sat}(T)M/(RT)",
      "\\rho_v=\\min(\\rho_{jami},\\rho_{sat})",
      "\\rho_{tomchi}=\\max(0,\\rho_{jami}-\\rho_{sat})",
      "\\varphi=100\\rho_v/\\rho_{sat}\\leq100\\%",
    ],
    task: "Jami suvni 20 g/m³ qiling. Haroratni pasaytiring: qachon nisbiy namlik 100% bo‘lishini va tomchilar paydo bo‘lishini kuzating.",
    model: "1 m³ yopiq havo namunasi; jami suv miqdori bug‘ va suyuq tomchilarga bo‘linadi. Toza suvning IAPWS to‘yinish bosimi va siyrak bug‘ning ideal gaz yaqinlashuvi ishlatilgan. Sovuq oynadagi tomchilar sxematik. Ochiq atmosferadagi havo almashinuvi va muzlash hisoblanmaydi; model 273.16–323.15 K oralig‘ida qo‘llanadi.",
    example: "Sovuq oynaning ustida suv tomchilari paydo bo‘lishi havoning oyna yonida to‘yinishiga misol bo‘ladi.",
  };
}
