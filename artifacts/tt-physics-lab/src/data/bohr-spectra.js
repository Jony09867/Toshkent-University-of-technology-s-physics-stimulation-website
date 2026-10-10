import { calculateBohrSpectrum } from "../physics/bohr-spectra.js";

export function bohrSpectraVariant(base) {
  return {
    ...base,
    key: "bohrSpectra",
    title: "Nurlanish va yutilish spektrlari",
    topicNumbers: [137],
    section: "yadro",
    formulaLatex: "E_n=-13.6\\frac{Z^2}{n^2}\\;\\mathrm{eV},\\quad |\\Delta E|=h\\nu=\\frac{hc}{\\lambda}",
    params: [
      { key: "upper", label: "Yuqori sath n", min: 2, max: 8, step: 1, value: 3, unit: "", level: 0 },
      { key: "lower", label: "Quyi sath m", min: 1, max: 7, step: 1, value: 2, unit: "", level: 0 },
      { key: "z", label: "Yadro zaryadi Z", min: 1, max: 4, step: 1, value: 1, unit: "", level: 0 },
      { key: "absorption", label: "Jarayon: 0 chiqarish, 1 yutilish", min: 0, max: 1, step: 1, value: 0, unit: "", level: 0 },
    ],
    results: [
      { key: "upperEnergy", label: "Yuqori sath energiyasi", unit: "eV" },
      { key: "lowerEnergy", label: "Quyi sath energiyasi", unit: "eV" },
      { key: "transition", label: "Foton energiyasi", unit: "eV" },
      { key: "wavelength", label: "Spektr chizig‘i", unit: "nm", scale: 1e9 },
    ],
    calculate: calculateBohrSpectrum,
    visual: "atomSpectra",
    static: true,
    duration: 10,
    series: [["wavelength", "nm", 1e9]],
    sweep: "upper",
    description: "Sathlar orasidagi o‘tish energiyasi va unga mos spektr chizig‘ini kuzating.",
    model: "Bor modeli vodorodsimon, bitta elektronli atom yoki ion uchun qo‘llanadi. Energiya sathlari diskret. Emissiyada elektron yuqori sathdan quyi sathga tushib foton chiqaradi; yutilishda xuddi shu energiyali fotonni yutib yuqoriga o‘tadi. Bu yadro massasini cheksiz katta deb oladigan soddalashtirilgan Bor hisobi: vodoroddagi Hα chizig‘i 656.11 nm chiqadi, NIST o‘lchovi esa 656.28 nm; chekli proton massasi va nozik tuzilma hisobga olinmagan. Orbita tasviri ehtimollik buluti emas.",
    easy: "Yuqori va quyi sathni tanlang. Emissiyada elektron pastga o‘tib foton chiqaradi; yutilishda foton yadroga kelib elektroni yuqori sathga ko‘taradi.",
    medium: "Sathlar energiyasi n² ga teskari proporsional: E_n=−13.6Z²/n² eV. Ikki sathning energiya farqi foton energiyasiga teng: |ΔE|=hν=hc/λ. Emissiya va yutilishda λ bir xil; faqat o‘tish yo‘nalishi farq qiladi.",
    hard: [
      "E_n=-13.605693\\frac{Z^2}{n^2}\\;\\mathrm{eV}",
      "\\Delta E=E_{yuqori}-E_{quyi}=13.605693Z^2(1/m^2-1/n^2)\\;\\mathrm{eV}",
      "\\lambda=\\frac{hc}{|\\Delta E|},\\quad \\nu=\\frac{|\\Delta E|}{h}",
    ],
    task: "Vodorodda n=3 va m=2 ni tanlang. Chiqarish/yutilish holatini almashtiring: yo‘nalish o‘zgaradi, spektr chizig‘i esa 656 nm atrofida qoladi. So‘ng Z=2 ni sinang.",
    engineering: "Atomlarning spektr chiziqlari yulduzlar, gaz lampalari va laboratoriya nurlarining tarkibini aniqlashga yordam beradi.",
    example: "Vodorod atomida n=3→2 o‘tishi soddalashtirilgan Bor hisobida 656.11 nm qizil Balmer chizig‘ini beradi; teskari o‘tish ayni to‘lqin uzunligini yutadi.",
  };
}
