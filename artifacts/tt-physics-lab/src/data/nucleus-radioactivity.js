import { calculateNucleusRadioactivity } from "../physics/nucleus-radioactivity.js";

export function nucleusRadioactivityVariant(base) {
  return {
    ...base,
    key: "nucleusRadioactivity",
    title: "Atom yadrosi va radioaktiv yemirilish",
    topicNumbers: [142],
    section: "yadro",
    icon: "nucleus",
    formulaLatex: "E_b=\\Delta mc^2,\\quad N=N_0e^{-\\lambda t},\\;T_{1/2}=\\frac{\\ln2}{\\lambda}",
    params: [
      { key: "defect", label: "Massa nuqsoni", min: 0, max: 2, step: 0.001, value: 0.03, unit: "u", level: 0 },
      { key: "nucleons", label: "Nuklonlar soni A", min: 2, max: 250, step: 1, value: 40, unit: "dona", level: 0 },
      { key: "protons", label: "Protonlar soni Z", min: 1, max: 120, step: 1, value: 18, unit: "dona", level: 0 },
      { key: "initial", label: "Boshlang‘ich yadrolar N₀", min: 20, max: 200, step: 10, value: 100, unit: "dona", level: 0 },
      { key: "halfLife", label: "Yarim yemirilish davri T½", min: 1, max: 8, step: 0.1, value: 4, unit: "s", level: 0 },
    ],
    results: [
      { key: "energy", label: "Bog‘lanish energiyasi", unit: "MeV" },
      { key: "perNucleon", label: "Bir nuklonga energiya", unit: "MeV" },
      { key: "remaining", label: "Qolgan yadrolar (kutilgan)", unit: "dona" },
      { key: "percent", label: "Qolgan ulush", unit: "%" },
      { key: "activity", label: "Aktivlik", unit: "dona/s" },
    ],
    calculate: calculateNucleusRadioactivity,
    visual: "nucleusRadioactivity",
    static: false,
    duration: 24,
    series: [["remaining", "dona"], ["activity", "dona/s"]],
    sweep: "halfLife",
    description: "Yadro tarkibi va radioaktiv namuna vaqt o‘tishi bilan qanday o‘zgarishini o‘rganing.",
    model: "Yadro chizmasi sxematik. Bog‘lanish energiyasi kiritilgan massa nuqsonidan hisoblanadi; bu aniq izotop jadvali emas. Yarim davr soniyalarda berilgan umumiy namuna parametri, u muayyan izotopga tegishli emas. Radioaktiv yemirilish ko‘p yadrolar uchun kutilayotgan qiymat bilan beriladi; alohida yadro qachon yemirilishini model oldindan aytmaydi.",
    easy: "Chapda yadroning proton va neytronlari, o‘ngda radioaktiv namuna ko‘rsatilgan. Har bir yarim davrda ota yadrolarning kutilayotgan soni ikki baravar kamayadi.",
    medium: "Massa nuqsonidan E_b=Δmc² va E_b/A hisoblanadi. Radioaktiv namunada N(t)=N₀·2^(−t/T½); tarkib va yarim davrni o‘zgartirib natijalarni solishtiring.",
    hard: [
      "E_b=\\Delta m c^2,\\quad E_b/A=\\Delta m c^2/A",
      "\\lambda=\\frac{\\ln2}{T_{1/2}},\\quad N(t)=N_0e^{-\\lambda t}=N_0 2^{-t/T_{1/2}}",
      "A(t)=\\lambda N(t),\\quad N_{yemirilgan}=N_0-N(t)",
    ],
    task: "Yarim davrni 4 s da qoldiring. t=4 s va t=8 s da namunada mos ravishda N₀/2 va N₀/4 qolganini kuzating.",
    engineering: "Radioaktiv yemirilish qonuni radiouglerod bilan yosh aniqlash va tibbiy izotoplar faolligini baholashda qo‘llanadi.",
    example: "N₀=100 va T½=4 s bo‘lsa, 4 s dan keyin 50, 8 s dan keyin 25 yadro qoladi (kutilayotgan qiymat).",
  };
}
