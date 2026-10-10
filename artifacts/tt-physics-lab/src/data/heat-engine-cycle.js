// 76-mavzuda umumiy Karno hisobini saqlab, boshqaruv va izohlarni moslaydi.
export function heatEngineCycleVariant(base) {
  return {
    ...base,
    title: "Issiqlik dvigatellari",
    topicNumbers: [76],
    formulaLatex: "\\eta=\\frac{A}{Q_1}=1-\\frac{Q_2}{Q_1}\\leq1-\\frac{T_2}{T_1}",
    params: base.params.map(param => ({
      ...param,
      level: {
        hot: 0,
        cold: 0,
        heatIn: 1,
        efficiency: 2,
      }[param.key] ?? param.level,
    })),
    results: [
      { key: "carnot", label: "Karno FIK chegarasi", unit: "%" },
      { key: "efficiency", label: "Dvigatel FIKi", unit: "%" },
      { key: "work", label: "Bajarilgan ish", unit: "J" },
      { key: "heatOut", label: "Sovutgichga berilgan issiqlik", unit: "J" },
    ],
    description: "Issiq manbadan olingan energiyaning ish va sovutgichga uzatiladigan issiqlikka qanday taqsimlanishini kuzating.",
    easy: "Issiq manbadan Q₁ issiqlik olinadi. Uning bir qismi A ishga aylanadi, qolgan Q₂ esa sovutgichga beriladi. Dvigatel FIKi Karno chegarasidan oshmaydi.",
    medium: "Energiya balansi Q₁=A+Q₂. FIK η=A/Q₁=(Q₁−Q₂)/Q₁. Qaytar Karno sikli uchun eng katta mumkin bo‘lgan FIK η_C=1−T₂/T₁; haqiqiy dvigatelning FIKi bundan kichik.",
    hard: [
      "\\eta=\\frac{A}{Q_1}=\\frac{Q_1-Q_2}{Q_1}",
      "Q_1=A+Q_2",
      "\\eta\\leq\\eta_C=1-\\frac{T_2}{T_1}\\quad(T_1>T_2>0,\\;T\\text{ kelvinda})",
    ],
    task: "T₁=900 K, T₂=300 K va Q₁=1000 J da Karno chegarasini toping. FIKni 35% qilib A va Q₂ ni tekshiring; so‘ng FIKni chegaradan yuqori qo‘yib ogohlantirishni kuzating.",
    model: "Issiq va sovuq rezervuar harorati Kelvin shkalasida beriladi. Tanlangan haqiqiy FIK uchun A=ηQ₁ va Q₂=Q₁−A; η>η_C yoki T₁≤T₂ bo‘lsa fizik jihatdan yaroqsiz natijalar yashiriladi. p–V chizmasi bir atomli ideal gaz uchun qurilgan qaytar Karno siklining ideal yuqori chegarasidir (γ=5/3, V₁=1 L, V₂=2 L); aniq dvigatelning ishchi moddasi yoki ishqalanish yo‘qotishlari modellashtirilmaydi.",
    engineering: "Bug‘ turbinalari va ichki yonuv dvigatellari issiq manbadan energiya olib, uning bir qismini ishga, qolganini sovutgichga uzatadi. Karno chegarasi haroratlar belgilaydigan nazariy yuqori chegaradir.",
    example: "900 K va 300 K orasida ishlaydigan qaytar dvigatelning maksimal FIKi 1−300/900=66.7%. 1000 J issiqlikda bu eng ko‘pi bilan 667 J ish demakdir.",
  };
}
