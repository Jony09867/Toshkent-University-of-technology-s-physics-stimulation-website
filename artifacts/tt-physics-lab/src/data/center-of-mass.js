// Ikki nuqtaviy yuk va massasi e'tiborga olinmaydigan gorizontal tayoq modeli.
// Koordinatalar bitta boshlang'ich nuqtaga nisbatan metrda beriladi.
export function calculateCenterOfMass({ m1, m2, x1, x2 }) {
  if (![m1, m2, x1, x2].every(Number.isFinite) || m1 <= 0 || m2 <= 0 || x1 >= x2) {
    return {
      center: null,
      totalMass: null,
      distance1: null,
      distance2: null,
      warning: "Massalar musbat, chap yuk koordinatasi esa o‘ng yuknikidan kichik bo‘lishi kerak.",
    };
  }
  const totalMass = m1 + m2;
  const center = (m1 * x1 + m2 * x2) / totalMass;
  return {
    center,
    totalMass,
    distance1: center - x1,
    distance2: x2 - center,
    warning: "",
  };
}

export function centerOfMassVariant(base) {
  return {
    ...base,
    key: "centerOfMass",
    title: "Jismning og‘irlik markazi",
    topicNumbers: [30],
    formulaLatex: "x_c=\\frac{m_1x_1+m_2x_2}{m_1+m_2}",
    params: [
      { key: "m1", label: "Chap yuk massasi", min: 0.5, max: 10, step: 0.1, value: 2, unit: "kg", level: 0 },
      { key: "m2", label: "O‘ng yuk massasi", min: 0.5, max: 10, step: 0.1, value: 4, unit: "kg", level: 0 },
      { key: "x1", label: "Chap yuk koordinatasi", min: -3, max: -0.2, step: 0.1, value: -2, unit: "m", level: 1 },
      { key: "x2", label: "O‘ng yuk koordinatasi", min: 0.2, max: 3, step: 0.1, value: 2, unit: "m", level: 1 },
    ],
    results: [
      { key: "center", label: "Og‘irlik markazi", unit: "m" },
      { key: "totalMass", label: "Jami massa", unit: "kg" },
      { key: "distance1", label: "Chap yukdan masofa", unit: "m" },
      { key: "distance2", label: "O‘ng yukdan masofa", unit: "m" },
    ],
    calculate: calculateCenterOfMass,
    visual: "centerOfMass",
    static: true,
    series: [["center", "m"]],
    sweep: "m2",
    description: "Yuklarning massasini va o‘rnini o‘zgartirib, og‘irlik markazi qayerga siljishini kuzating.",
    easy: "Ikkita yukning massasini o‘zgartiring. Yashil belgi og‘irlik markazini ko‘rsatadi: u har doim yuklar orasida bo‘ladi va og‘irroq yuk tomonga yaqinlashadi.",
    medium: "Har bir yukning koordinatasi massasi bilan ko‘paytiriladi. Ko‘paytmalar yig‘indisi jami massaga bo‘linsa x_c topiladi. Tayanch x_c ostiga qo‘yilsa, ikkala yukning unga nisbatan momenti teng bo‘ladi.",
    hard: [
      "x_c=\\frac{m_1x_1+m_2x_2}{m_1+m_2}",
      "m_1(x_c-x_1)=m_2(x_2-x_c)",
      "M_{chap}=m_1g(x_c-x_1)=m_2g(x_2-x_c)=M_{o'ng}",
    ],
    task: "Massalarni tenglang: markaz qayerda? Keyin o‘ng massani ikki baravar oshiring va yashil belgi qaysi tomonga siljishini kuzating.",
    model: "Ikki nuqtaviy yuk massasi e'tiborga olinmaydigan qattiq tayoqda joylashgan. Og‘irlik markazi ikkala yuk orasidagi massalar markazi bilan mos keladi. Yer tortishish maydoni bir xil deb olinadi; tayoqning o‘z massasi, egilishi va tashqi kuchlar hisobga olinmaydi.",
    engineering: "Yuklarni ko‘tarishda va transport vositasiga joylashda og‘irlik markazini bilish tayanch joyini tanlashga yordam beradi.",
    example: "Chapda 2 kg yuk −2 m da, o‘ngda 4 kg yuk +2 m da tursa, og‘irlik markazi +0.667 m da bo‘ladi.",
  };
}
