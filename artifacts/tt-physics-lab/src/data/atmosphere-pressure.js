const GAS_CONSTANT = 8.314462618;
const AIR_MOLAR_MASS = 0.0289644;
const MERCURY_PA_PER_MM = 133.322;

// Doimiy haroratli ideal atmosfera uchun barometrik yaqinlashuv.
export function calculateAtmospherePressure({ altitude, temperature, seaLevelPressure }) {
  if (![altitude, temperature, seaLevelPressure].every(Number.isFinite)
    || altitude < 0 || temperature <= 0 || seaLevelPressure <= 0) {
    return {
      pressure: null,
      mercuryHeight: null,
      relativePressure: null,
      warning: "Balandlik noldan katta, harorat va sirt bosimi esa musbat bo‘lishi kerak.",
    };
  }
  const pressure = seaLevelPressure * Math.exp(
    -(AIR_MOLAR_MASS * 9.80665 * altitude) / (GAS_CONSTANT * temperature),
  );
  return {
    pressure,
    mercuryHeight: pressure / MERCURY_PA_PER_MM,
    relativePressure: pressure / seaLevelPressure,
    warning: "",
  };
}

export function atmospherePressureVariant(base) {
  return {
    ...base,
    key: "atmospherePressure",
    title: "Atmosfera bosimi",
    topicNumbers: [45],
    formulaLatex: "p(h)=p_0\\exp\\!\\left(-\\frac{Mgh}{RT}\\right),\\quad h_{Hg}=p/(\\rho_{Hg}g)",
    params: [
      { key: "altitude", label: "Balandlik", min: 0, max: 12000, step: 100, value: 0, unit: "m", level: 0 },
      { key: "temperature", label: "Havo harorati", min: 220, max: 310, step: 1, value: 288.15, unit: "K", level: 1 },
      { key: "seaLevelPressure", label: "Dengiz sathidagi bosim", min: 80000, max: 110000, step: 100, value: 101325, unit: "Pa", level: 2 },
    ],
    results: [
      { key: "pressure", label: "Atmosfera bosimi", unit: "kPa", scale: 0.001 },
      { key: "mercuryHeight", label: "Simob ustuni", unit: "mm" },
      { key: "relativePressure", label: "Sirt bosimiga nisbati", unit: "" },
    ],
    calculate: calculateAtmospherePressure,
    visual: "barometer",
    static: true,
    series: [["pressure", "kPa", 0.001]],
    sweep: "altitude",
    description: "Balandlik, harorat va sirt bosimini o‘zgartirib, havo bosimi hamda barometr ustunini kuzating.",
    easy: "Havoning ustidagi qatlam qancha ko‘p bo‘lsa, bosim shuncha katta. Balandlikni oshiring: barometrdagi simob ustuni pasayadi.",
    medium: "Doimiy haroratli ideal atmosfera yaqinlashuvida bosim balandlik bilan eksponensial kamayadi. Barometrda simob ustunining bosimi atmosfera bosimiga teng: p=ρ_Hg·g·h_Hg.",
    hard: [
      "p(h)=p_0\\exp\\left(-\\frac{M_{havo}gh}{RT}\\right)",
      "h_{Hg}=\\frac{p}{\\rho_{Hg}g},\\quad 1\\;\\mathrm{mmHg}=133.322\\;\\mathrm{Pa}",
      "H=\\frac{RT}{M_{havo}g}\\quad (\\text{izotermik atmosfera masshtab balandligi})",
    ],
    task: "Dengiz sathidagi bosimni 101325 Pa qoldiring. Balandlikni 0 m dan 8000 m gacha oshirib, bosim necha marta kamayganini va simob ustuni qancha pasayganini solishtiring.",
    model: "Quruq havoning molyar massasi 0.0289644 kg/mol, harorat balandlik bo‘yicha o‘zgarmaydi, atmosfera ideal gaz va gidrostatik muvozanatda deb olinadi. Bu izotermik barometrik yaqinlashuv; haqiqiy ob-havo, namlik va troposferadagi harorat qatlamlari hisobga olinmaydi. Simob ustuni atmosfera bosimini 133.322 Pa/mm nisbat bilan ko‘rsatadi.",
    engineering: "Balandlik o‘lchagichlar bosimning balandlik bilan kamayishidan foydalanadi; barometr esa atmosfera bosimini o‘lchaydi.",
    example: "101325 Pa bosim taxminan 760 mm simob ustuniga teng. Izotermik modelda 8 km balandlikda bosim dengiz sathidagidan ancha kichik bo‘ladi.",
  };
}
