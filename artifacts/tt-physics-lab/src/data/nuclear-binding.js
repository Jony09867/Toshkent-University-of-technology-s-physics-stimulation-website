const NUCLEON_BINDING_LIMIT_MEV = 9;

export function calculateNuclearBinding(baseCalculate, params, time = 0) {
  const state = baseCalculate(params, time);
  const defect = Number(params.defect);
  const nucleons = Number(params.nucleons);

  if (!Number.isFinite(defect) || !Number.isFinite(nucleons) || defect < 0 || nucleons <= 0) {
    return {
      ...state,
      energy: null,
      perNucleon: null,
      warning: "Massa nuqsoni manfiy bo‘lmasin, nuklonlar soni esa musbat bo‘lsin.",
    };
  }

  if (defect >= nucleons) {
    return {
      ...state,
      energy: null,
      perNucleon: null,
      warning: "Massa nuqsoni erkin nuklonlar umumiy massasidan kichik bo‘lishi kerak.",
    };
  }

  const energy = defect * 931.49410242;
  const perNucleon = energy / nucleons;
  return {
    ...state,
    energy,
    perNucleon,
    warning: perNucleon > NUCLEON_BINDING_LIMIT_MEV
      ? "Bu qiymat nuklon boshiga 9 MeV dan yuqori. Bunday bog‘lanish energiyasi odatiy barqaror yadrolarga mos kelmaydi."
      : "",
  };
}

export function nuclearBindingVariant(base) {
  return {
    ...base,
    title: "Yadroning bog'lanish energiyasi",
    description: "Massa nuqsoni va nuklonlar sonidan bog‘lanish energiyasini hisoblang.",
    params: base.params.map((param) => {
      if (param.key === "defect") return { ...param, max: 0.038, step: 0.0001, value: 0.03 };
      if (param.key === "nucleons") return { ...param, min: 4, value: 4 };
      return param;
    }),
    results: base.results.filter((result) => result.key !== "mass"),
    series: [["energy", "MeV"], ["perNucleon", "MeV"]],
    sweep: "defect",
    calculate: (params, time = 0) => calculateNuclearBinding(base.calculate, params, time),
    easy: "Erkin nuklonlarni birlashtirib yadro hosil bo‘lganda massa kamayishi mumkin. Shu massa nuqsoni bog‘lanish energiyasiga aylanadi.",
    medium: "Massa nuqsoni Δm ni o‘zgartiring. E_b = Δm·931.494 MeV/u; har bir nuklonga to‘g‘ri keladigan qiymat E_b/A. A — nuklonlar soni. Bu misolda Δm 0–0.038 u, A esa 4 yoki undan katta.",
    hard: ["E_b=\\Delta mc^2", "E_b[\\mathrm{MeV}]=\\Delta m[\\mathrm{u}]\\cdot931.494", "\\bar E_b=E_b/A"],
    task: "Massa nuqsonini oshirib, jami va bir nuklonga to‘g‘ri keladigan bog‘lanish energiyasini taqqoslang.",
    model: "Statik, izotopga xos bo‘lmagan soddalashtirilgan model: nuklon tarkibi va aniq izotop massalari hisoblanmaydi. E_b = Δm·c² ishlatiladi. Parametr chegaralari Δm ≤ 0.038 u va A ≥ 4 qilib qo‘yilgan; A=4 da E_b/A 8.85 MeV dan oshmaydi. Massa nuqsoni erkin nuklonlar massasidan oshsa hisob yashiriladi.",
    example: "Geliy-4 uchun massa nuqsoni taxminan 0.0304 u, bog‘lanish energiyasi esa 28.3 MeV atrofida. Bu tajribada izotop massasi tanlanmaydi; qiymatni bog‘lanish formulasini o‘rganish uchun o‘zgartirasiz.",
  };
}
