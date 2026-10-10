const HC_KEV_NM = 1.239841984;
const RYDBERG_KEV = 0.013605693;

export function calculateXrayTube(p, time = 0) {
  const voltage = Number(p.voltage);
  const current = Number(p.current);
  const Z = Math.round(Number(p.targetZ));
  if (![voltage, current, Z, time].every(Number.isFinite) || voltage <= 0 || current < 0 || Z < 3) {
    return {
      energy: null, wavelength: null, electronSpeedC: null, beamPower: null,
      kShellEdge: null, kAlphaEnergy: null, kAlphaWavelength: null,
      kShellExcited: false, warning: "Kuchlanish musbat, tok manfiy bo‘lmasin va anod materiali tanlansin.",
    };
  }

  // 1 kV elektronni ko‘pi bilan 1 keV energiyagacha tezlashtiradi.
  const timeFraction = Math.max(0, Math.min(1, time / 2));
  // Vaqt ko‘rgazmali: t² haqiqiy relyativistik uchish vaqtini bildirmaydi.
  const progress = timeFraction ** 2;
  const electronKineticEnergy = voltage * progress;
  const gamma = 1 + electronKineticEnergy / 511;
  const kShellEdge = RYDBERG_KEV * (Z - 1) ** 2;
  const kAlphaEnergy = 0.75 * kShellEdge;
  const kShellExcited = current > 0 && voltage >= kShellEdge;
  return {
    energy: voltage,
    wavelength: HC_KEV_NM / voltage,
    electronSpeedC: Math.sqrt(1 - 1 / gamma ** 2),
    electronKineticEnergy,
    progress,
    impact: progress >= 1,
    beamPower: voltage * current,
    targetZ: Z,
    kShellEdge,
    kAlphaEnergy: kShellExcited ? kAlphaEnergy : null,
    kAlphaWavelength: kShellExcited ? HC_KEV_NM / kAlphaEnergy : null,
    kShellExcited,
    warning: "",
  };
}

export function xrayTubeVariant(base) {
  return {
    ...base,
    title: "Rentgen trubkasida nurlanish",
    topicNumbers: [139],
    visual: "xrayTube",
    static: false,
    duration: 2,
    formulaLatex: "E_{k,\\max}=eU,\\quad \\lambda_{\\min}=\\frac{hc}{eU},\\quad E_{K\\alpha}\\approx\\frac{3}{4}R_y(Z-1)^2",
    params: [
      { key: "voltage", label: "Anod kuchlanishi", min: 1, max: 200, step: 1, value: 50, unit: "kV", level: 0 },
      { key: "current", label: "Elektronlar dastasi toki", min: 0, max: 20, step: 0.1, value: 5, unit: "mA", level: 1 },
      { key: "targetZ", label: "Anod materiali atom raqami Z", min: 13, max: 74, step: 1, value: 29, unit: "", level: 2 },
    ],
    results: [
      { key: "energy", label: "Foton energiyasining yuqori chegarasi", unit: "keV" },
      { key: "wavelength", label: "Eng qisqa to‘lqin uzunligi", unit: "nm" },
      { key: "electronKineticEnergy", label: "Elektron kinetik energiyasi", unit: "keV" },
      { key: "electronSpeedC", label: "Elektron tezligi (c ulushi)", unit: "c" },
      { key: "beamPower", label: "Elektron dastasi quvvati", unit: "W" },
      { key: "kShellEdge", label: "K-qobiq ionlanish chegarasi", unit: "keV" },
      { key: "kAlphaEnergy", label: "Kα chiziq energiyasi (taxminiy)", unit: "keV" },
    ],
    series: [["electronKineticEnergy", "keV"]],
    sweep: "voltage",
    calculate: calculateXrayTube,
    description: "Anod kuchlanishi va materialni o‘zgartirib, elektron energiyasi rentgen spektrining chegarasi hamda xos chiziqqa qanday ta’sir qilishini tekshiring.",
    easy: "Katoddan chiqqan elektronlar anod kuchlanishi U orqali tezlashadi. Nishonda ularning kinetik energiyasi rentgen fotonlariga o‘tishi mumkin; bitta foton elektronning butun energiyasini olsa, Eγ=eU bo‘ladi.",
    medium: "Sekinlashayotgan elektronlar turli miqdorda energiya yo‘qotib, uzluksiz tormozlanish spektrini hosil qiladi. Foton energiyasi eU dan oshmaydi, shuning uchun qisqa to‘lqin chegarasi Duane–Hunt qonuni bilan aniqlanadi. Tok ortishi nurlanishlar sonini va elektron dastasi quvvatini oshiradi.",
    hard: [
      "E_{e,\\max}=eU",
      "\\lambda_{\\min}=\\frac{hc}{eU}=\\frac{1.23984\\;\\mathrm{keV\\,nm}}{U\\;(\\mathrm{kV})}",
      "E_K\\approx R_y(Z-1)^2,\\quad E_{K\\alpha}\\approx\\frac{3}{4}R_y(Z-1)^2",
      "K\\alpha \\text{ chizig‘i faqat } eU\\ge E_K \\text{ bo‘lganda chiqishi mumkin}",
    ],
    task: "U=50 kV da elektronning yuqori energiya chegarasi va λmin ni toping. Tokni o‘zgartiring: energiya chegarasi o‘zgarmasligi kerak. So‘ng anod Z sini oshirib, K-qobiq chegarasiga yetganda taxminiy Kα chizig‘i paydo bo‘lishini kuzating.",
    model: "Rentgen trubkasi vakuumda, elektronlar anod kuchlanishi orqali tezlashadi. Duane–Hunt λmin va eU foton energiyasining yuqori chegarasini beradi. K-qobiq chegarasi va Kα chizig‘i ekranlashgan vodorodsimon atom yaqinlashuvida hisoblanadi; og‘ir elementlarda relativistik tuzatishlar sabab bu chiziq taxminiy. Spektr rasmi sifat jihatdan sxematik; anoddagi o‘z-o‘zini yutish, filtr, elektronlarning ko‘p martalik sochilishi va chiziq intensivligi hisoblanmaydi. Ekrandagi 2 soniyalik elektron yo‘li ko‘rgazmali vaqt bo‘lib, haqiqiy uchish vaqti yoki masofa masshtabi emas.",
    engineering: "Rentgen naychalarida elektronlar metall anodga urilib, tormozlanish rentgen nurlarini hosil qiladi. Tibbiy tasvirda anod kuchlanishi fotonlarning energiya chegarasini, tok esa bir vaqt ichida tushadigan elektronlar sonini belgilaydi.",
    example: "50 kV da Eγ,max=50 keV va λmin≈0.0248 nm. 5 mA elektron dastasining elektr quvvati U·I=250 W; bu qiymat rentgen quvvati emas, anodga kelayotgan elektron dastasi quvvatidir.",
  };
}
