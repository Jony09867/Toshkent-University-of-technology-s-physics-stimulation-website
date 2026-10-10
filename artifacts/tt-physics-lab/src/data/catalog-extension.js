import { models } from "../physics/catalog-engine.js";
import { calculateRutherfordBohr } from "../physics/rutherford-bohr.js";
import { catalogLessons } from "./catalog-lessons.js";
import { sectionFor } from "./sections.js";
import { paramNames, resultNames } from "../i18n/uz.js";

const P = (key, label, min, max, step, value, unit = "", level = 0) => ({
  key,
  label,
  min,
  max,
  step,
  value,
  unit,
  level,
});
const R = (key, label, unit = "", scale = 1) => ({ key, label, unit, scale });
const defs = {};
const add = (
  key,
  title,
  nums,
  formulaLatex,
  params,
  results,
  model,
  visual,
  staticModel = true,
) => {
  defs[key] = {
    key,
    id: key.replace(/[A-Z]/g, (s) => "-" + s.toLowerCase()),
    title,
    topicNumbers: nums,
    section: sectionFor(nums[0]),
    icon: "atom",
    formulaLatex,
    params,
    results,
    calculate: models[key],
    visual,
    static: staticModel,
    duration: 12,
    series: results.slice(0, 2).map((r) => [r.key, r.unit, r.scale]),
    sweep: params[0].key,
    description: title + ": parametr, natija va fizik bog‘lanishni tajribada tekshiring.",
    easy: catalogLessons[key] || model,
    medium: (catalogLessons[key] || "") + " " + model,
    hard: [formulaLatex],
    model,
    engineering:
      "Bu qonun o‘lchov natijalarini hisoblash va qurilmalar ishini baholashda qo‘llanadi.",
    task:
      params[0].label +
      " ni o‘zgartiring va " +
      results[0].label.toLowerCase() +
      " qanday o‘zgarishini aniqlang.",
    example: model,
  };
};
const mass = () => P("m", "Massa", 0.1, 20, 0.1, 2, "kg");
const angle = (value = 30, max = 180) =>
  P("angle", "Burchak", 0, max, 1, value, "°");
const voltage = (value = 12, max = 24) =>
  P("voltage", "Kuchlanish", 0, max, 0.5, value, "V");
const temp = () => P("temperature", "Harorat", 150, 800, 10, 300, "K");
const length = () => P("length", "Uzunlik", 0.1, 3, 0.1, 1, "m");
const force = () => P("force", "Kuch", 0, 100, 1, 20, "N");

add(
  "uniform",
  "Tekis harakat va trayektoriya",
  [1, 2, 3, 14],
  "x=x_0+vt",
  [
    P("v0", "Tezlik", -20, 20, 0.5, 5, "m/s"),
    P("x0", "Boshlang‘ich koordinata", -20, 20, 1, 0, "m"),
  ],
  [
    R("x", "Koordinata", "m"),
    R("v", "Tezlik", "m/s"),
    R("distance", "Yo‘l", "m"),
  ],
  "Bir o‘lchamli tekis harakat. Manfiy tezlik chapga harakatni bildiradi; yo‘l va ko‘chish farqlanadi.",
  "cart",
  false,
);
add(
  "relative",
  "Harakatning nisbiyligi",
  [4],
  "\\vec v=\\vec v_1+\\vec v_2",
  [
    P("v1", "Qayiqning suvga nisbatan tezligi", 0, 10, 0.1, 3, "m/s"),
    P("v2", "Ko‘ndalang oqim tezligi", -5, 5, 0.1, 1, "m/s"),
  ],
  [
    R("speed", "Qirg‘oqqa nisbatan tezlik", "m/s"),
    R("x", "Bo‘ylama koordinata", "m"),
    R("y", "Ko‘ndalang koordinata", "m"),
  ],
  "Qayiq va oqim tezliklari o‘zaro perpendikulyar. Klassik tezliklar vektor orqali qo‘shiladi.",
  "relative",
  false,
);
add(
  "meeting",
  "Ikki jismning harakati",
  [8],
  "x_1=v_1t,\\quad x_2=d+v_2t",
  [
    P("v1", "Birinchi jism tezligi", -10, 20, 0.5, 8, "m/s"),
    P("v2", "Ikkinchi jism tezligi", -10, 20, 0.5, -2, "m/s"),
    P("gap", "Boshlang‘ich masofa", 1, 100, 1, 40, "m"),
  ],
  [
    R("x1", "Birinchi koordinata", "m"),
    R("x2", "Ikkinchi koordinata", "m"),
    R("meeting", "Uchrashish vaqti", "s"),
  ],
  "Jismlar bir chiziqda tekis harakat qiladi. Kelajakda uchrashmasa vaqt qiymati mavjud emas.",
  "meeting",
  false,
);
add(
  "circular",
  "Aylana bo‘ylab harakat",
  [10, 11, 13],
  "a_n=\\omega^2R,\\quad a_t=\\alpha R",
  [
    P("radius", "Aylana radiusi", 0.2, 4, 0.1, 2, "m"),
    P("omega", "Boshlang‘ich burchak tezligi", 0.1, 3, 0.1, 1, "rad/s"),
    P("alpha", "Burchak tezlanishi", -0.2, 0.2, 0.01, 0, "rad/s²"),
  ],
  [
    R("velocity", "Urinma tezlik", "m/s"),
    R("normal", "Normal tezlanish", "m/s²"),
    R("tangent", "Tangensial tezlanish", "m/s²"),
  ],
  "Radius doimiy. Normal tezlanish markazga, tangensial tezlanish urinma bo‘ylab yo‘naladi.",
  "orbit",
  false,
);
add(
  "gears",
  "Aylanma harakatni uzatish",
  [12],
  "R_1\\omega_1=-R_2\\omega_2",
  [
    P("r1", "Birinchi radius", 0.1, 1, 0.05, 0.3, "m"),
    P("r2", "Ikkinchi radius", 0.1, 1, 0.05, 0.6, "m"),
    P("omega", "Birinchi burchak tezligi", 0.1, 4, 0.1, 1, "rad/s"),
  ],
  [
    R("omega2", "Ikkinchi burchak tezligi", "rad/s"),
    R("velocity", "Chetdagi tezlik", "m/s"),
  ],
  "Tashqi tutashgan ideal g‘ildiraklar sirpanmaydi va qarama-qarshi yo‘nalishda aylanadi.",
  "gears",
  false,
);
add(
  "density",
  "Massa va zichlik",
  [15],
  "\\rho=m/V",
  [mass(), P("volume", "Hajm", 0.1, 20, 0.1, 2, "L")],
  [R("density", "Zichlik", "kg/m³"), R("weight", "Og‘irlik kuchi", "N")],
  "Bir jinsli jism. Hajm litrda kiritilib kub metrga o‘tkaziladi.",
  "block",
);
add(
  "reaction",
  "Nyutonning uchinchi qonuni",
  [17],
  "\\vec F_{12}=-\\vec F_{21}",
  [
    force(),
    P("m1", "Birinchi massa", 0.5, 10, 0.5, 2, "kg"),
    P("m2", "Ikkinchi massa", 0.5, 10, 0.5, 4, "kg"),
  ],
  [
    R("force", "Ta’sir kuchi", "N"),
    R("reaction", "Aks ta’sir kuchi", "N"),
    R("a1", "Birinchi tezlanish", "m/s²"),
    R("a2", "Ikkinchi tezlanish", "m/s²"),
  ],
  "Teng va qarama-qarshi kuchlar ikki xil jismga ta’sir qiladi; tezlanishlar massaga bog‘liq.",
  "reaction",
);
add(
  "gravity",
  "Gravitatsiya va sun’iy yo‘ldosh",
  [18, 19, 26],
  "g=GM/r^2,\\quad v=\\sqrt{GM/r}",
  [P("altitude", "Yer sirtidan balandlik", 0, 40000, 100, 400, "km"), mass()],
  [
    R("g", "Gravitatsion tezlanish", "m/s²"),
    R("force", "Tortishish kuchi", "N"),
    R("velocity", "Orbital tezlik", "m/s"),
    R("period", "Orbital davr", "s"),
  ],
  "Sferik Yer atrofidagi doiraviy orbita; atmosfera, boshqa jismlar tortishishi va Yer aylanishi hisobga olinmaydi.",
  "orbit",
  false,
);
add(
  "hooke",
  "Elastiklik kuchi va prujina energiyasi",
  [20, 37],
  "F=kx,\\quad E_p=kx^2/2",
  [
    P("extension", "Cho‘zilish", -0.5, 0.5, 0.01, 0.2, "m"),
    P("k", "Prujina qattiqligi", 1, 100, 1, 20, "N/m"),
  ],
  [
    R("force", "Elastiklik kuchi moduli va ishorasi", "N"),
    R("potential", "Prujina energiyasi", "J"),
  ],
  "Chiziqli elastik soha. kx tashqi ushlab turuvchi kuch; prujinaning tiklovchi kuchi −kx.",
  "spring",
);
add(
  "elevator",
  "Vazn va vaznsizlik",
  [21, 22],
  "N=m(g+a)",
  [P("a", "Lift tezlanishi", -9.8, 9.8, 0.1, 2, "m/s²"), mass()],
  [R("normal", "Tayanch reaksiyasi", "N"), R("weight", "Og‘irlik kuchi", "N"), R("y", "Vertikal ko‘chish", "m"), R("velocity", "Lift tezligi", "m/s")],
  "Yuqoriga tezlanish musbat. Erkin tushishda a=−g, tayanch reaksiyasi nol.",
  "elevator",
  false,
);
add(
  "vectors",
  "Bir necha kuch ta’siri",
  [29],
  "\\vec F=\\vec F_1+\\vec F_2",
  [
    P("f1", "Birinchi kuch", 0, 100, 1, 20, "N"),
    P("f2", "Ikkinchi kuch", 0, 100, 1, 30, "N"),
    angle(60),
    mass(),
  ],
  [
    R("force", "Natijaviy kuch", "N"),
    R("fx", "Gorizontal proyeksiya", "N"),
    R("fy", "Vertikal proyeksiya", "N"),
    R("ax", "Gorizontal tezlanish", "m/s²"),
    R("ay", "Vertikal tezlanish", "m/s²"),
  ],
  "Birinchi kuch gorizontal, ikkinchisi unga nisbatan burchak ostida. Jism tinch holatdan harakat boshlaydi.",
  "vectors",
  false,
);
add(
  "lever",
  "Og‘irlik markazi va richag muvozanati",
  [30, 31],
  "m_1gl_1=m_2gl_2",
  [
    P("m1", "Chap yuk massasi", 0.5, 10, 0.5, 2, "kg"),
    P("m2", "O‘ng yuk massasi", 0.5, 10, 0.5, 4, "kg"),
    P("arm1", "Chap yelka", 0.1, 3, 0.1, 1, "m"),
    P("arm2", "O‘ng yelka", 0.1, 3, 0.1, 0.5, "m"),
  ],
  [
    R("torque1", "Chap moment", "N·m"),
    R("torque2", "O‘ng moment", "N·m"),
    R("net", "Momentlar farqi", "N·m"),
    R("center", "Og‘irlik markazi", "m"),
  ],
  "Massasiz qattiq richag; ikki nuqtaviy yuk va ishqalanishsiz tayanch.",
  "lever",
);
add(
  "work",
  "Mexanik ish, quvvat va FIK",
  [34, 40, 41],
  "A=Fs\\cos\\alpha,\\quad P=A/t",
  [
    force(),
    P("distance", "Ko‘chish", 0, 20, 0.5, 5, "m"),
    angle(0),
    P("interval", "Sarflangan vaqt", 0.1, 20, 0.1, 2, "s"),
    P("efficiency", "Foydali ish ulushi", 0, 100, 1, 80, "%"),
  ],
  [
    R("work", "Mexanik ish", "J"),
    R("power", "O‘rtacha quvvat", "W"),
    R("useful", "Foydali ish", "J"),
  ],
  "Doimiy kuch va to‘g‘ri ko‘chish; kuch ko‘chishga qarama-qarshi bo‘lsa ish manfiy.",
  "vectors",
);
add(
  "pressure",
  "Gidrostatik va atmosfera bosimi",
  [43, 45],
  "p=p_0+\\rho gh",
  [
    P("h", "Chuqurlik", 0, 20, 0.1, 2, "m"),
    P("rho", "Suyuqlik zichligi", 500, 13600, 100, 1000, "kg/m³"),
    P("atmosphere", "Atmosfera bosimi", 0, 110, 1, 101, "kPa"),
  ],
  [R("pressure", "Absolut bosim", "Pa"), R("gauge", "Ortiqcha bosim", "Pa")],
  "Tinch suyuqlik, doimiy zichlik va g. Atmosfera bosimi sirtga qo‘shiladi.",
  "fluid",
);
add(
  "vessels",
  "Tutash idishlar",
  [44],
  "\\rho_1h_1=\\rho_2h_2",
  [
    P("rho1", "Birinchi suyuqlik zichligi", 500, 2000, 50, 1000, "kg/m³"),
    P("rho2", "Ikkinchi suyuqlik zichligi", 500, 2000, 50, 800, "kg/m³"),
    P("h", "Birinchi ustun balandligi", 0.1, 2, 0.1, 1, "m"),
  ],
  [
    R("h2", "Ikkinchi ustun balandligi", "m"),
    R("pressure", "Tutashuvdagi ortiqcha bosim", "Pa"),
  ],
  "Aralashmaydigan suyuqliklar, ustun sirtlarida bir xil atmosfera bosimi.",
  "vessels",
);
add(
  "bernoulli",
  "Bernulli qonuni",
  [48],
  "p+\\rho v^2/2+\\rho gh=\\mathrm{const}",
  [
    P("velocity", "Kirish tezligi", 0, 10, 0.1, 2, "m/s"),
    P("area1", "Kirish kesimi", 1, 100, 1, 30, "cm²"),
    P("area2", "Chiqish kesimi", 1, 100, 1, 15, "cm²"),
    P("pressure", "Kirish absolut bosimi", 100, 500, 10, 200, "kPa"),
    P("rho", "Zichlik", 500, 2000, 50, 1000, "kg/m³"),
    P("h1", "Kirish balandligi", 0, 5, 0.1, 0, "m", 1),
    P("h2", "Chiqish balandligi", 0, 5, 0.1, 0, "m", 1),
  ],
  [
    R("v2", "Chiqish tezligi", "m/s"),
    R("pressure2", "Chiqish bosimi", "Pa"),
    R("flow", "Hajmiy oqim", "m³/s"),
  ],
  "Statsionar, siqilmaydigan, ishqalanishsiz oqim. Juda past bosimda kavitatsiya bu modeldan tashqarida.",
  "pipe",
  false,
);
add(
  "wave",
  "Mexanik va tovush to‘lqinlari",
  [55, 56],
  "y=A\\sin(2\\pi ft-2\\pi x/\\lambda)",
  [
    P("amplitude", "Amplituda", 0.01, 1, 0.01, 0.3, "m"),
    P("frequency", "Chastota", 0.1, 3, 0.1, 1, "Hz"),
    P("wavelength", "To‘lqin uzunligi", 0.2, 5, 0.1, 2, "m"),
    P("position", "Kuzatish koordinatasi", 0, 5, 0.1, 1, "m"),
  ],
  [
    R("displacement", "Siljish", "m"),
    R("speed", "To‘lqin tezligi", "m/s"),
    R("period", "Davr", "s"),
  ],
  "Ideal garmonik yuguruvchi to‘lqin. Yuqorida ko‘ndalang, pastda tovush uchun bo‘ylama zarrachalar modeli.",
  "wave",
  false,
);
add(
  "vapor",
  "To‘yingan bug‘ va namlik",
  [66, 67],
  "\\varphi=100p_v/p_{sat}",
  [
    P("temperature", "Harorat", 274, 373, 1, 293, "K"),
    P("vapor", "Suv bug‘i bosimi", 0, 100, 0.1, 1, "kPa"),
  ],
  [
    R("saturation", "To‘yingan bug‘ bosimi", "Pa"),
    R("relative", "Nisbiy namlik", "%"),
  ],
  "Suv uchun Antoine empirik tenglamasi 1–100 °C oralig‘ida. Kritik nuqta ushbu oraliqdan tashqarida.",
  "fluid",
);
add(
  "capillary",
  "Kapillarlik va sirt taranglik",
  [68],
  "h=2\\sigma\\cos\\theta/(\\rho gr)",
  [
    P("radius", "Kapillyar radiusi", 0.1, 5, 0.1, 1, "mm"),
    P("tension", "Sirt taranglik", 0.01, 0.1, 0.001, 0.072, "N/m"),
    angle(0),
    P("rho", "Suyuqlik zichligi", 500, 2000, 50, 1000, "kg/m³"),
  ],
  [
    R("height", "Ko‘tarilish balandligi", "m"),
    R("force", "Vertikal sirt taranglik kuchi", "N"),
  ],
  "Silindrik kapillyar; burchak 90° dan oshsa suyuqlik sathi pasayadi.",
  "capillary",
);
add(
  "elastic",
  "Qattiq jismning elastik deformatsiyasi",
  [69],
  "\\sigma=F/S,\\quad \\varepsilon=\\sigma/E",
  [
    force(),
    P("area", "Ko‘ndalang kesim", 1, 100, 1, 10, "mm²"),
    length(),
    P("young", "Yung moduli", 1, 250, 1, 200, "GPa"),
  ],
  [
    R("stress", "Kuchlanish", "Pa"),
    R("strain", "Nisbiy deformatsiya"),
    R("extension", "Uzayish", "m"),
  ],
  "Bir o‘lchamli chiziqli elastiklik. Plastik deformatsiya va uzilish hisoblanmaydi.",
  "spring",
);
add(
  "expansion",
  "Issiqlikdan kengayish",
  [70],
  "\\Delta l=\\alpha l_0\\Delta T",
  [
    length(),
    P("alpha", "Kengayish koeffitsiyenti", 1, 100, 1, 12, "10⁻⁶ K⁻¹"),
    P("deltaT", "Harorat o‘zgarishi", -100, 500, 5, 100, "K"),
  ],
  [R("delta", "Uzunlik o‘zgarishi", "m"), R("length2", "Yakuniy uzunlik", "m")],
  "Koeffitsiyent doimiy; kichik nisbiy kengayish yaqinlashuvi.",
  "expansion",
);
add(
  "calorimetry",
  "Issiqlik miqdori",
  [73],
  "Q=mc\\Delta T",
  [
    mass(),
    P(
      "capacity",
      "Solishtirma issiqlik sig‘imi",
      100,
      5000,
      100,
      4200,
      "J/(kg·K)",
    ),
    P("deltaT", "Harorat o‘zgarishi", -50, 100, 1, 20, "K"),
    P("temperature", "Boshlang‘ich harorat", 200, 500, 5, 293, "K"),
  ],
  [
    R("heat", "Issiqlik miqdori", "J"),
    R("temperature2", "Yakuniy harorat", "K"),
  ],
  "Fazaviy o‘zgarishsiz qizish yoki sovish, issiqlik sig‘imi doimiy.",
  "thermal",
);
add(
  "adiabatic",
  "Adiabatik jarayon",
  [75],
  "pV^\\gamma=\\mathrm{const},\\quad TV^{\\gamma-1}=\\mathrm{const}",
  [
    P("volume", "Boshlang‘ich hajm", 5, 50, 1, 20, "L"),
    temp(),
    P("gamma", "Adiabata ko‘rsatkichi", 1.1, 1.67, 0.01, 1.4),
    P("moles", "Modda miqdori", 0.1, 3, 0.1, 1, "mol"),
  ],
  [
    R("pressure", "Bosim", "Pa"),
    R("temperature", "Harorat", "K"),
    R("work", "Bajarilgan ish", "J"),
  ],
  "Qaytar, issiqlik almashinuvisiz ideal gaz kengayishi. Q=0, A=−ΔU.",
  "gas",
  false,
);
add(
  "chargeTransfer",
  "Zaryadning saqlanishi",
  [77],
  "q_1+q_2=\\mathrm{const}",
  [
    P("q1", "Birinchi boshlang‘ich zaryad", -10, 10, 0.5, 3, "μC"),
    P("q2", "Ikkinchi boshlang‘ich zaryad", -10, 10, 0.5, -1, "μC"),
    P(
      "transfer",
      "Birinchidan ikkinchiga o‘tgan zaryad",
      -10,
      10,
      0.5,
      1,
      "μC",
    ),
  ],
  [
    R("q1", "Birinchi zaryad", "μC"),
    R("q2", "Ikkinchi zaryad", "μC"),
    R("total", "Jami zaryad", "μC"),
  ],
  "Yopiq tizimda zaryad faqat jismlar orasida ko‘chadi.",
  "charges",
);
add(
  "field",
  "Nuqtaviy zaryad maydoni va potensiali",
  [79, 83, 84, 85],
  "E=kq/r^2,\\quad \\varphi=kq/r",
  [
    P("charge", "Manba zaryadi", -10, 10, 0.5, 3, "μC"),
    P("radius", "Masofa", 0.1, 5, 0.1, 1, "m"),
    P("testCharge", "Sinov zaryadi", -5, 5, 0.1, 1, "μC"),
  ],
  [
    R("field", "Radial maydon", "V/m"),
    R("potential", "Potensial", "V"),
    R("work", "Cheksizlikdan keltirishdagi potensial energiya", "J"),
  ],
  "Nuqtaviy zaryad, vakuum; aylana kesimlari ekvipotensial sirtlarning kesimidir.",
  "field",
);
add(
  "sphere",
  "Zaryadlangan o‘tkazgich shar",
  [80],
  "E_{ichki}=0,\\quad E_{tashqi}=kq/r^2",
  [
    P("radius", "Shar radiusi", 0.1, 2, 0.1, 0.5, "m"),
    P("distance", "Markazdan masofa", 0.05, 5, 0.05, 1, "m"),
    P("charge", "Zaryad", -10, 10, 0.5, 3, "μC"),
  ],
  [R("field", "Maydon", "V/m"), R("potential", "Potensial", "V")],
  "Elektrostatik muvozanatdagi ideal o‘tkazgich shar; ichida maydon nol, potensial doimiy.",
  "field",
);
add(
  "fieldWork",
  "Bir jinsli maydonning ishi",
  [82],
  "A=qEd,\\quad U=Ed",
  [
    P("field", "Maydon kuchlanganligi", 0, 5000, 50, 1000, "V/m"),
    P("charge", "Zaryad", -10, 10, 0.5, 2, "μC"),
    P("distance", "Maydon yo‘nalishidagi ko‘chish", -2, 2, 0.1, 0.5, "m"),
  ],
  [
    R("work", "Maydon bajargan ish", "J"),
    R("voltage", "Potensiallar farqi", "V"),
    R("force", "Kuch", "N"),
  ],
  "Ko‘chish maydon bo‘ylab ishorali; A=q(φboshlang‘ich−φyakuniy).",
  "field",
);
add(
  "capacitor",
  "Kondensator va dielektrik",
  [81, 86, 88],
  "C=\\varepsilon_0\\varepsilon_rS/d,\\quad W=CU^2/2",
  [
    P("area", "Plastina yuzasi", 10, 1000, 10, 100, "cm²"),
    P("gap", "Plastinalar oralig‘i", 0.1, 10, 0.1, 1, "mm"),
    P("dielectric", "Nisbiy dielektrik singdiruvchanlik", 1, 10, 0.5, 1),
    voltage(),
  ],
  [
    R("capacitance", "Sig‘im", "nF", 1e9),
    R("charge", "Zaryad", "nC", 1e9),
    R("energy", "Elektr energiya", "μJ", 1e6),
  ],
  "Yassi parallel plastinalar. Chekka maydonlar hisoblanmaydi; manba ulanganligi uchun U doimiy.",
  "capacitor",
);
add(
  "capacitorNetwork",
  "Kondensatorlarni ulash",
  [87],
  "C_{par}=C_1+C_2,\\quad C_{ket}=\\frac{C_1C_2}{C_1+C_2}",
  [
    P("mode", "Ulash: 0 parallel, 1 ketma-ket", 0, 1, 1, 0),
    P("c1", "Birinchi sig‘im", 1, 100, 1, 10, "μF"),
    P("c2", "Ikkinchi sig‘im", 1, 100, 1, 20, "μF"),
    voltage(),
  ],
  [
    R("capacitance", "Ekvivalent sig‘im", "μF", 1e6),
    R("charge", "Zaryad", "μC", 1e6),
    R("energy", "Energiya", "J"),
  ],
  "Ideal ikki kondensator; tanlangan ulashda ekvivalent sig‘im hisoblanadi.",
  "capacitor",
);
add(
  "current",
  "Elektr toki va zaryad oqimi",
  [89],
  "I=\\Delta q/\\Delta t",
  [
    P("charge", "O‘tgan zaryad", 0, 20, 0.5, 6, "C"),
    P("interval", "O‘lchash oralig‘i", 0.1, 10, 0.1, 2, "s"),
  ],
  [R("current", "Tok kuchi", "A"), R("passed", "O‘tgan zaryad", "C")],
  "Doimiy tok. Shartli tok yo‘nalishi elektronlarning yo‘nalishiga qarama-qarshi.",
  "circuit",
  false,
);
add(
  "joule",
  "Tokning ishi va Joul–Lens issiqligi",
  [93, 94],
  "P=U^2/R,\\quad Q=Pt",
  [voltage(), P("resistance", "Qarshilik", 1, 100, 1, 20, "Ω")],
  [
    R("power", "Quvvat", "W"),
    R("heat", "Ajralgan issiqlik", "J"),
    R("current", "Tok", "A"),
  ],
  "Doimiy qarshilikli rezistor. Issiqlik yo‘qotilishi va haroratga bog‘liq qarshilik hisobga olinmaydi.",
  "circuit",
  false,
);
add(
  "meter",
  "Ampermetr shunti va voltmetr qo‘shimcha qarshiligi",
  [92],
  "R_{sh}=R_m/(n-1),\\quad R_{q}=R_m(n-1)",
  [
    P("meterResistance", "Asbob qarshiligi", 1, 1000, 1, 100, "Ω"),
    P("factor", "O‘lchash chegarasini oshirish", 2, 100, 1, 10),
    P("current", "Asbobning nominal toki", 0.001, 0.1, 0.001, 0.01, "A"),
  ],
  [
    R("shunt", "Shunt R", "Ω"),
    R("series", "Ketma-ket R", "Ω"),
    R("currentLimit", "Tok chegarasi", "A"),
  ],
  "Ideal magnitoelektrik asbob: ampermetrga parallel shunt, voltmetrga ketma-ket qarshilik. Asbobning qizishi va zanjirga yuklama ta’siri hisobga olinmaydi.",
  "meterRange",
);
defs.meter.results.push(R("voltageLimit", "Kuchlanish chegarasi", "V"));
defs.meter.series = [["shunt", "Ω"]];
defs.meter.sweep = "factor";
defs.meter.hard = [
  "I=nI_m=I_m+I_{sh}",
  "I_mR_m=I_{sh}R_{sh}\\quad\\Rightarrow\\quad R_{sh}=R_m/(n-1)",
  "U=I_m(R_m+R_q)\\quad\\Rightarrow\\quad R_q=(n-1)R_m",
];
defs.meter.task = "Koeffitsiyentni oshiring: shunt qarshiligi kamayishini, ketma-ket qarshilik va o‘lchash chegaralari ortishini kuzating.";
add(
  "batteries",
  "Tok manbalarini ulash",
  [97],
  "I=\\frac{\\varepsilon_{eq}}{R+r_{eq}}",
  [
    P("mode", "Ulash: 0 ketma-ket, 1 parallel", 0, 1, 1, 0),
    P("count", "Bir xil manbalar soni", 1, 6, 1, 2),
    P("emf", "Bitta manba EYuK", 1, 12, 0.5, 1.5, "V"),
    P("internal", "Bitta manba ichki qarshiligi", 0.1, 5, 0.1, 0.5, "Ω"),
    P("resistance", "Yuk qarshiligi", 1, 100, 1, 10, "Ω"),
  ],
  [
    R("current", "Yuk toki", "A"),
    R("emf", "Jami EYuK", "V"),
    R("internal", "Jami ichki R", "Ω"),
    R("voltage", "Yuk kuchlanishi", "V"),
  ],
  "Faqat bir xil EYuK va ichki qarshilikka ega manbalar bir xil qutblar bilan ulanadi.",
  "batteryCircuit",
);
defs.batteries.params[0].label = "Ulash turi (0/1)";
defs.batteries.series = [["current", "A"]];
defs.batteries.sweep = "count";
defs.batteries.description = "Manbalar soni va ulanishini o‘zgartiring: yuk toki hamda kuchlanishini solishtiring.";
defs.batteries.model = "Bir xil EYuK va ichki qarshilikli manbalar to‘g‘ri qutblar bilan ulangan. Manbalar ideal EYuK va doimiy ichki qarshilikdan iborat; zaryad kamayishi, teng bo‘lmagan manbalar orasidagi tenglashtiruvchi tok va qizish dinamikasi hisoblanmaydi.";
defs.batteries.easy = "Manbalarni ketma-ket ulang: ularning kuchlanishlari qo‘shiladi. Parallel ulang: kuchlanish bitta manbanikidek qoladi, ammo ichki qarshilik kamayadi. Sxemadagi manbalar sonini sanang.";
defs.batteries.medium = "Ketma-ketda bir xil manbalarning EYuKi nε, ichki qarshiligi nr bo‘ladi. Parallelda EYuK ε, ichki qarshilik r/n bo‘ladi. Har ikkala holatda yuk toki I = ε_eq/(R+r_eq), yuk kuchlanishi U=IR.";
defs.batteries.hard = [
  "\\varepsilon_{ket}=n\\varepsilon,\\quad r_{ket}=nr",
  "\\varepsilon_{par}=\\varepsilon,\\quad r_{par}=r/n",
  "I=\\frac{\\varepsilon_{eq}}{R+r_{eq}},\\quad U_R=IR",
  "I\\varepsilon_{eq}=I^2R+I^2r_{eq}",
];
defs.batteries.task = "2 va 6 ta manbani avval ketma-ket, keyin parallel ulang. Jami EYuK, ichki qarshilik va yuk toki qanday o‘zgarishini taqqoslang.";
defs.batteries.example = "Ikkita 1,5 V manba ketma-ketda 3 V EYuK beradi; parallel ulanishda EYuK 1,5 V bo‘lib qoladi, ichki qarshilik esa ikki baravar kamayadi.";
add(
  "metal",
  "Metall qarshiligining haroratga bog‘liqligi",
  [98],
  "R=R_0(1+\\alpha\\Delta T)",
  [
    P("r0", "Boshlang‘ich qarshilik", 1, 100, 1, 20, "Ω"),
    P("alpha", "Harorat koeffitsiyenti", 1, 6, 0.1, 3.9, "10⁻³ K⁻¹"),
    P("deltaT", "Harorat o‘zgarishi", -100, 300, 5, 50, "K"),
    voltage(),
  ],
  [R("resistance", "Yakuniy qarshilik", "Ω"), R("current", "Tok", "A")],
  "Metall uchun chiziqli empirik model, fazaviy o‘zgarishlar hisoblanmaydi.",
  "circuit",
);
add(
  "diode",
  "Yarimo‘tkazgich diod",
  [99],
  "I=I_s(e^{qU/(nk_BT)}-1)",
  [
    P("voltage", "Diod kuchlanishi", -0.2, 0.55, 0.01, 0.3, "V"),
    P("ideality", "Ideallik koeffitsiyenti", 1, 2, 0.1, 1.5),
    P("saturation", "To‘yinish toki", 0.1, 10, 0.1, 1, "nA"),
    temp(),
  ],
  [R("current", "Tok", "mA", 1000)],
  "Shockley ideal diod tenglamasi. Teskari teshilish va katta tokdagi qarshilik bu modelga kirmaydi.",
  "circuit",
);
add(
  "thermionic",
  "Vakuumdagi termoelektron emissiya",
  [100],
  "j=A_RT^2e^{-W/(k_BT)}",
  [
    P("temperature", "Katod harorati", 500, 2500, 50, 2000, "K"),
    P("work", "Chiqish ishi", 1, 6, 0.1, 4.5, "eV"),
  ],
  [
    R("density", "Emissiya tok zichligi", "A/m²"),
    R("charge", "Birlik yuzadan o‘tgan zaryad", "C/m²"),
  ],
  "Richardson–Dushman modeli: qizdirilgan katoddan elektronlar chiqadi. Anod musbat va tok emissiya bilan cheklangan deb olingan; fazoviy zaryad va anod kuchlanishi hisobga olinmaydi. Elektronlarning chizmadagi tezligi sxematik.",
  "thermionic",
  false,
);
defs.thermionic.duration = 8;
defs.thermionic.series = [["charge", "C/m²"]];
defs.thermionic.description =
  "Katodni qizdiring: elektronlar vakuumga chiqadi. Chizmadagi harakat tezligi sxematik, zaryad hisobi esa fizik vaqtga bog‘liq.";
add(
  "electrolysis",
  "Suyuqliklarda tok va elektroliz",
  [101],
  "m=\\frac{MIt}{zF}",
  [
    P("current", "Tok kuchi", 0, 10, 0.1, 2, "A"),
    P("molarMass", "Molyar massa", 1, 200, 1, 63, "g/mol"),
    P("valence", "Ion valentligi", 1, 3, 1, 2),
  ],
  [R("mass", "Ajralgan modda", "mg", 1e6), R("charge", "O‘tgan zaryad", "C")],
  "Faradey qonuni, tok samaradorligi 100%. Eritma konsentratsiyasi va yon reaksiyalar hisoblanmaydi.",
  "electrolysis",
  false,
);
add(
  "discharge",
  "Gazlarda elektr razryadi",
  [102],
  "E=U/d",
  [
    P("voltage", "Kuchlanish", 0, 30, 0.5, 20, "kV"),
    P("gap", "Elektrodlar oralig‘i", 1, 20, 0.5, 5, "mm"),
  ],
  [
    R("field", "Elektr maydon", "MV/m", 1e-6),
    R("thresholdVoltage", "Teshilish chegarasi", "kV"),
    R("breakdown", "Razryad: 0 yo‘q, 1 bor"),
  ],
  "Oddiy atmosfera havosi uchun E≈3 MV/m taxminiy teshilish chegarasi. Bu Paschen qonunining to‘liq modeli emas; animatsiyadagi zarracha tezligi va vaqt masshtabi sxematik.",
  "gasDischarge",
  false,
);
defs.discharge.duration = 6;
defs.discharge.series = [["field", "MV/m", 1e-6]];
defs.discharge.description =
  "Kuchlanish va elektrodlar oralig‘ini o‘zgartiring. Maydon taxminiy chegaradan oshsa, gazda razryad paydo bo‘ladi.";
defs.discharge.hard = ["E=U/d", "U_{krit}\\approx E_{krit}d"];
defs.discharge.task =
  "Kuchlanishni yoki oraliqni o‘zgartirib, E = 3 MV/m chegarasining ikki tomonini solishtiring.";
add(
  "magnetic",
  "Tokli simning magnit maydoni",
  [104],
  "B=\\mu_0I/(2\\pi r)",
  [
    P("current", "Tok", 0, 20, 0.5, 4, "A"),
    P("radius", "Simdan masofa", 0.1, 20, 0.1, 2, "cm"),
    P("area", "Sinov yuza", 1, 100, 1, 10, "cm²"),
  ],
  [
    R("field", "Magnit induksiya", "μT", 1e6),
    R("flux", "Taxminiy magnit oqim", "Wb"),
  ],
  "Cheksiz uzun to‘g‘ri sim, vakuum. Oqim kichik yuzadagi bir jinsli maydon yaqinlashuvida.",
  "field",
);
add(
  "magneticMaterial",
  "Moddaning magnit xossalari",
  [107],
  "B=\\mu_0\\mu_rH",
  [
    P("h", "Magnit maydon kuchlanganligi", 0, 1000, 10, 100, "A/m"),
    P("relative", "Nisbiy magnit singdiruvchanlik", 0.5, 100, 0.5, 1),
  ],
  [
    R("field", "Magnit induksiya", "T"),
    R("magnetization", "Magnitlanish", "A/m"),
  ],
  "Chiziqli izotrop muhit; ferromagnit gisterezis va to‘yinish hisobga olinmaydi.",
  "field",
);
add(
  "flux",
  "Magnit oqimi",
  [108],
  "\\Phi=BS\\cos\\alpha",
  [
    P("field", "Magnit induksiya", 0, 2, 0.05, 0.5, "T"),
    P("area", "Ramka yuzasi", 10, 1000, 10, 100, "cm²"),
    angle(30),
  ],
  [R("flux", "Magnit oqim", "Wb")],
  "Burchak maydon bilan ramka normalining orasida o‘lchanadi.",
  "generator",
);
add(
  "rl",
  "O‘zinduksiya va magnit energiya",
  [110, 111],
  "I=\\frac UR(1-e^{-Rt/L}),\\quad W=LI^2/2",
  [
    voltage(),
    P("resistance", "Qarshilik", 1, 100, 1, 10, "Ω"),
    P("inductance", "Induktivlik", 100, 10000, 100, 2000, "mH"),
  ],
  [
    R("current", "Tok", "A"),
    R("emf", "O‘zinduksiya EYuK", "V"),
    R("energy", "Magnit energiya", "J"),
  ],
  "RL zanjir manbaga t=0 da ulanadi. Induktivlik va qarshilik doimiy.",
  "circuit",
  false,
);
add(
  "generator",
  "O‘zgaruvchan tok generatori",
  [115],
  "\\varepsilon=NBS\\omega\\sin(\\omega t)",
  [
    P("frequency", "Aylanish chastotasi", 0.1, 3, 0.1, 1, "Hz"),
    P("turns", "O‘ramlar soni", 1, 200, 1, 50),
    P("field", "Magnit induksiya", 0, 2, 0.05, 0.5, "T"),
    P("area", "Ramka yuzasi", 10, 1000, 10, 100, "cm²"),
  ],
  [R("emf", "Induksion EYuK", "V"), R("flux", "Bitta o‘ram oqimi", "Wb")],
  "Bir jinsli maydonda doimiy burchak tezligida aylanuvchi ideal ramka.",
  "generator",
  false,
);
add(
  "ac",
  "O‘zgaruvchan tokning RLC zanjiri",
  [116, 117, 118, 119],
  "Z=\\sqrt{R^2+(\\omega L-1/(\\omega C))^2}",
  [
    P("mode", "Zanjir: 0 R, 1 C, 2 L, 3 RLC", 0, 3, 1, 3),
    P("voltage", "Effektiv kuchlanish", 0, 100, 1, 12, "V"),
    P("frequency", "Chastota", 1, 100, 1, 50, "Hz"),
    P("resistance", "Aktiv qarshilik", 1, 100, 1, 20, "Ω"),
    P("inductance", "Induktivlik", 1, 1000, 1, 100, "mH"),
    P("capacitance", "Sig‘im", 1, 1000, 1, 100, "μF"),
  ],
  [
    R("current", "Oniy tok", "A"),
    R("voltage", "Oniy kuchlanish", "V"),
    R("impedance", "Impedans", "Ω"),
    R("power", "O‘rtacha aktiv quvvat", "W"),
  ],
  "Sinusoidal manbaning o‘rnashgan rejimi. R, L va C ideal; transient jarayonlar hisobga olinmaydi.",
  "circuit",
  false,
);
add(
  "emwave",
  "Elektromagnit to‘lqin va radiolokatsiya",
  [121, 122, 125],
  "c=\\lambda f,\\quad d=c\\Delta t/2",
  [
    P("frequency", "Radiochastota", 1, 3000, 1, 100, "MHz"),
    P("distance", "Nishon masofasi", 0.1, 100, 0.1, 10, "km"),
    P("amplitude", "Maydon amplitudasi", 0.1, 10, 0.1, 1, "V/m"),
  ],
  [
    R("wavelength", "To‘lqin uzunligi", "m"),
    R("delay", "Signalning qaytish vaqti", "μs", 1e6),
  ],
  "Vakuumda c doimiy. Animatsiya davri ko‘rgazmali sekinlashtirilgan; signal vaqti haqiqiy hisoblanadi.",
  "wave",
  false,
);
add(
  "reflection",
  "Yorug‘likning qaytishi",
  [123],
  "\\alpha=\\beta",
  [angle(30, 89)],
  [
    R("incident", "Tushish burchagi", "°"),
    R("reflected", "Qaytish burchagi", "°"),
  ],
  "Yassi ko‘zgu; burchaklar sirt normalidan o‘lchanadi.",
  "reflection",
);
add(
  "instrument",
  "Lupa va astronomik teleskop",
  [130],
  "M_{lupa}=D/f,\\quad |M_{tel}|=f_{obj}/f_{ok}",
  [
    P("mode", "Asbob: 0 lupa, 1 teleskop", 0, 1, 1, 0),
    P("eyepiece", "Lupa / okulyar fokus masofasi", 0.01, 0.2, 0.005, 0.05, "m"),
    P("objective", "Obyektiv fokus masofasi", 0.2, 2, 0.05, 0.5, "m"),
  ],
  [
    R("magnification", "Burchak kattalashtirish", "×"),
    R("length", "Fokus / tubus uzunligi", "m"),
  ],
  "Yupqa yig‘uvchi linzalar. Lupa uchun D=25 cm va tasvir cheksizlikda. Teleskop normal sozlangan; tasvir teskari, ko‘rsatilgan kattalashtirish modulidir.",
  "instrument",
);
add(
  "diffraction",
  "Bir tirqishdagi difraksiya",
  [133],
  "I/I_0=(\\sin u/u)^2,\\quad u=\\pi a\\sin\\theta/\\lambda",
  [
    P("width", "Tirqish kengligi", 1, 100, 1, 10, "μm"),
    P("wavelength", "To‘lqin uzunligi", 380, 750, 10, 550, "nm"),
    P("angle", "Kuzatish burchagi", -20, 20, 0.1, 0, "°"),
  ],
  [
    R("intensity", "Nisbiy intensivlik"),
    R("firstMin", "Birinchi minimum burchagi", "°"),
  ],
  "Fraungofer uzoq maydon modeli, bir tirqish; markazda limit I/I₀=1.",
  "diffraction",
);
add(
  "polarization",
  "Yorug‘likning qutblanishi",
  [134],
  "I=I_0\\cos^2\\theta",
  [P("angle", "Analizator burchagi", 0, 180, 1, 30, "°"), P("intensity", "Qutblangan nur intensivligi", 0, 100, 1, 100, "W/m²")],
  [
    R("intensity", "Chiqish intensivligi", "W/m²"),
    R("fraction", "O‘tgan ulush"),
  ],
  "Analizatorga tushayotgan nur allaqachon chiziqli qutblangan.",
  "polarization",
);
add(
  "relativity",
  "Maxsus nisbiylik",
  [135],
  "\\gamma=1/\\sqrt{1-v^2/c^2}",
  [
    P("beta", "Tezlikning c ga nisbati", 0, 0.99, 0.01, 0.5),
    P("interval", "Xususiy vaqt", 0.1, 10, 0.1, 1, "s"),
    P("length", "Tinch holatdagi uzunlik", 0.1, 3, 0.1, 1, "m"),
    P("m", "Tinchlik massasi", 0.1, 20, 0.1, 2, "kg"),
  ],
  [
    R("gamma", "Lorens koeffitsiyenti"),
    R("time", "Kuzatuvchi vaqti", "s"),
    R("length", "Qisqargan uzunlik", "m"),
    R("kinetic", "Kinetik energiya", "J"),
  ],
  "Inersial tizimlar, v<c. Uzunlik harakat yo‘nalishi bo‘ylab o‘lchanadi.",
  "relativity",
);
add(
  "photon",
  "Foton energiyasi va impulsi",
  [138],
  "E=hf=hc/\\lambda,\\quad p=h/\\lambda",
  [P("wavelength", "To‘lqin uzunligi", 1, 1000, 1, 550, "nm")],
  [
    R("energy", "Foton energiyasi", "eV", 1 / 1.602176634e-19),
    R("frequency", "Chastota", "Hz"),
    R("momentum", "Impuls", "kg·m/s"),
  ],
  "Vakuumdagi foton; tinchlik massasi nol.",
  "photon",
);
add(
  "xray",
  "Rentgen nurlarining qisqa to‘lqin chegarasi",
  [139],
  "\\lambda_{min}=hc/(eU)",
  [P("voltage", "Anod kuchlanishi", 1, 200, 1, 50, "kV")],
  [
    R("wavelength", "Minimal to‘lqin uzunligi", "nm", 1e9),
    R("energy", "Maksimal foton energiyasi", "keV", 1 / 1.602176634e-16),
  ],
  "Elektronning barcha kinetik energiyasi bitta fotonga o‘tishidagi chegara; xarakteristik spektr bu modelga kirmaydi.",
  "photon",
);
add(
  "bohr",
  "Bor modeli va atom spektrlari",
  [137],
  "E_n=-13.6Z^2/n^2\\;\\mathrm{eV}",
  [
    P("n", "Yuqori energetik sath", 1, 8, 1, 3),
    P("lower", "Quyi sath", 1, 7, 1, 2),
    P("z", "Yadro zaryad soni", 1, 4, 1, 1),
  ],
  [
    R("energy", "Sath energiyasi", "eV"),
    R("radius", "Orbita radiusi", "nm", 1e9),
    R("wavelength", "Chiqarilgan foton to‘lqin uzunligi", "nm", 1e9),
    R("transition", "O‘tish energiyasi", "eV"),
  ],
  "Faqat vodorodsimon, bitta elektronli atom. Orbita Borning tarixiy modeli; kvant ehtimol buluti emas.",
  "atom",
);
add(
  "binding",
  "Yadro tarkibi, bog‘lanish energiyasi va reaksiya",
  [142, 144, 145],
  "E_b=\\Delta mc^2",
  [
    P("defect", "Massa nuqsoni", 0, 2, 0.001, 0.03, "u"),
    P("nucleons", "Nuklonlar soni", 2, 250, 1, 4),
  ],
  [
    R("energy", "Bog‘lanish energiyasi", "MeV"),
    R("perNucleon", "Bitta nuklonga energiya", "MeV"),
    R("mass", "Soddalashtirilgan massa", "u"),
  ],
  "Massa nuqsoni foydalanuvchi tomonidan kiritiladi. Nuklon massasi 1 u deb olingan sxematik massa; aniq izotop jadvali emas. Reaksiya uchun Δm musbat bo‘lsa energiya ajraladi.",
  "nucleus",
);

add(
  "rutherford",
  "Rezerford tajribasi va Bor postulatlari",
  [141],
  "\\theta=2\\arctan(kZze^2/(2Eb))",
  [
    P("energy", "Alfa-zarracha energiyasi", 1, 10, 0.1, 5, "MeV"),
    P("impact", "Nishonlash masofasi", 0, 100, 1, 20, "fm"),
    P("z", "Yadro zaryad soni", 1, 100, 1, 79),
    P("upper", "Bor: yuqori sath n", 3, 6, 1, 3),
  ],
  [
    R("angle", "Sochilish burchagi", "°"),
    R("closest", "Eng yaqin masofa", "fm", 1e15),
    R("distance", "Alfa–yadro masofasi", "fm"),
    R("wavelength", "Vodorod spektr chizig‘i", "nm", 1e9),
  ],
  "Chapda qo‘zg‘almas, nuqtaviy yadrodan alfa-zarrachaning klassik Kulon sochilishi; yo‘l cheklangan masofagacha chiziladi, burchak esa cheksizlikdagi asimptotik yo‘nalishlar orasida o‘lchanadi. O‘ngda alohida vodorod atomining tarixiy Bor modeli: n→2 o‘tishda foton chiqadi. Bu ikkita turli fizik tajriba; yadro ichiga kirish, kvant sochilishi va elektron ehtimol buluti hisoblanmaydi.",
  "scattering",
  false,
);
defs.rutherford.calculate = calculateRutherfordBohr;
defs.rutherford.timeScale = 2e-20;
defs.rutherford.duration = 1e-18;
defs.rutherford.series = [["distance", "fm"]];
defs.rutherford.description = "Alfa-zarrachaning yadro yonidan og‘ishini va vodorod spektr chizig‘ini kuzating.";
defs.rutherford.easy = "Chapda alfa-zarracha musbat yadrodan itarilib egri yo‘l bo‘ylab o‘tadi. Yaqinroq yo‘l ko‘proq og‘ishga olib keladi. O‘ngda vodorod elektroni faqat ruxsat etilgan sathlarda bo‘ladi; yuqoridan n=2 ga tushganda aniq rangli foton chiqaradi.";
defs.rutherford.medium = "Rezerford sochilishida boshlang‘ich energiya va nishonlash masofasi burchakni belgilaydi. Bor modelida elektron ruxsat etilgan sathda nurlanmaydi; n→2 o‘tishida energiyalar farqi hν bo‘lgan foton chiqadi. Chapdagi og‘ir yadro va o‘ngdagi vodorod atomi bir xil nishon emas.";
defs.rutherford.hard = [
  "a=k(2Ze^2)/(2E),\\quad \\theta=2\\arctan(a/b)",
  "r_{min}=a+\\sqrt{a^2+b^2}",
  "E_n=-13.6/n^2\\;\\mathrm{eV}\\quad (\\mathrm{H})",
  "h\\nu=E_n-E_2,\\quad \\lambda=hc/(E_n-E_2)",
];
defs.rutherford.task = "Nishonlash masofasini 20 fm dan 0 fm ga tushiring: alfa-zarracha orqaga qaytishini kuzating. Keyin Bor sathini 3 dan 4 ga o‘zgartirib spektr chizig‘ini solishtiring.";
defs.rutherford.engineering = "Sochilish tajribalari yadro tuzilishini, atom spektri esa ruxsat etilgan energiya sathlarini aniqlashga yordam beradi. Bu sahifada ular ikki alohida model sifatida berilgan.";

export function completeCatalog(configs) {
  // Oldindan boshlangan modullarni tugatish: mavzu va birliklar mosligini tuzatish.
  const overrides = {
    collision: {
      topicNumbers: [32, 33],
      section: "statika",
      static: false,
      visual: "collision",
      calculate: models.collision,
    },
    hydraulic: {
      topicNumbers: [42, 46],
      visual: "hydraulic",
      calculate: models.hydraulic,
    },
    pendulum: { visual: "pendulum", calculate: models.pendulum },
    isoProcess: { topicNumbers: [64, 65, 72], visual: "gas" },
    firstLaw: {
      topicNumbers: [71, 74],
      section: "termodinamika",
      visual: "thermal",
      calculate: models.firstLaw,
    },
    heatEngine: {
      topicNumbers: [76],
      section: "termodinamika",
      visual: "thermal",
      calculate: models.heatEngine,
    },
    network: {
      topicNumbers: [91, 95, 103],
      visual: "circuit",
      formulaLatex: "R_{ket}=R_1+R_2,\\quad R_{par}=R_1R_2/(R_1+R_2)",
    },
    ampere: { topicNumbers: [105], visual: "magnetic" },
    lorentz: { visual: "orbit", calculate: models.lorentz },
    lcr: {
      section: "elektro-tebranish",
      visual: "lc",
      calculate: models.lcr,
      duration: 0.01,
      timeScale: 0.001,
    },
    transformer: {
      topicNumbers: [120],
      section: "elektro-tebranish",
      visual: "transformer",
    },
    refraction: { topicNumbers: [124, 126], visual: "refraction" },
    interference: { topicNumbers: [132], visual: "interference" },
    photoelectric: {
      topicNumbers: [140],
      section: "yadro",
      visual: "photoelectric",
    },
    massEnergy: { topicNumbers: [136], section: "yadro", visual: "massEnergy" },
    decay: { section: "yadro", visual: "decay" },
  };
  for (const [key, override] of Object.entries(overrides)) {
    if (!configs[key]) continue;
    const c = Object.assign(configs[key], override);
    c.title = {
      collision: "Impuls va to‘qnashuv",
      hydraulic: "Gidravlik press",
      pendulum: "Matematik mayatnik",
      isoProcess: "Izojarayonlar",
      firstLaw: "Termodinamikaning birinchi qonuni",
      heatEngine: "Issiqlik dvigateli va Karno chegarasi",
      network: "Rezistorlarni ulash",
      ampere: "Amper kuchi",
      lorentz: "Lorens kuchi",
      lcr: "LC tebranish konturi",
      transformer: "Transformator",
      refraction: "Yorug‘lik sinishi",
      interference: "Ikki tirqish interferensiyasi",
      photoelectric: "Fotoeffekt",
      massEnergy: "Massa va energiya",
      decay: "Radioaktiv yemirilish",
    }[key];
    c.description =
      "Parametrlarni boshqaring va fizik qonunni jonli tajribada tekshiring.";
    c.model = {
      collision:
        "Bir o‘lchamli to‘qnashuv t=2 s da. e=1 elastik, e=0 mutlaq noelastik. Faqat yaqinlashuvchi jismlar uchun.",
      hydraulic:
        "Ideal siqilmaydigan suyuqlik; cm va cm² SI birliklariga o‘tkaziladi.",
      pendulum:
        "Bir kilogrammli nuqtaviy yuk; sin(theta) tenglamasi RK4 bilan yechiladi. Davr katta burchak uchun qator bilan taxminlangan.",
      isoProcess:
        "Bir atomli ideal gaz. 0 izoterma, 1 izobara, 2 izoxora. Vaqt jarayonning tanlangan yuritish tezligini bildiradi.",
      firstLaw:
        "Bir atomli ideal gaz; Q=ΔU+A. 0 K dan past yakuniy harorat yaroqsiz.",
      heatEngine:
        "Issiqlik rezervuarlari Kelvin birligida. Karno chegarasidan yuqori FIK fizik jihatdan mumkin emas.",
      network: "Ideal rezistorlar: 0 ketma-ket, 1 parallel.",
      ampere: "Bir jinsli magnit maydondagi to‘g‘ri tokli sim.",
      lorentz:
        "Musbat zaryad e birliklarida. Magnit maydon tezlikning faqat ko‘ndalang komponentini buradi.",
      lcr: "Ideal yo‘qotishsiz LC kontur. Kirish mH, μF va mC; hisoblash natijalari SI da.",
      transformer:
        "Ideal transformator, quvvat saqlanadi. Kuchlanish va tok effektiv qiymatlar.",
      refraction:
        "Geometrik optika, sirt normalidan o‘lchangan burchaklar. To‘liq ichki qaytishda singan nur yo‘q.",
      interference:
        "Ikki tirqish, kichik burchak: Δ≈dx/L. Intensivlik eng katta qiymatga normallangan.",
      photoelectric:
        "Einshteyn fotoeffekt tenglamasi. Ekin=max(0,hf−W); chegaradan pastda elektron emissiyasi yo‘q.",
      massEnergy:
        "E=mc² — tinchlik energiyasi, to‘liq massa energiyaga aylanishining nazariy qiymati.",
      decay:
        "Mustaqil yemiriluvchi yadrolarning kutilayotgan soni; λ=ln2/T. Davr soniyalarda.",
    }[key];
    c.easy = c.model;
    c.medium = c.model;
    c.hard = [c.formulaLatex];
    c.engineering =
      "Model parametrlarini o‘zgartirib, o‘lchov va nazariy natijani taqqoslash mumkin.";
    c.example = c.model;
    c.task =
      "Birinchi parametrni o‘zgartiring va natijani formula bilan solishtiring.";
    c.sweep = c.params[0].key;
    if (key === "network") c.sweep = "voltage";
    if (key === "interference") c.sweep = "position";
    if (key === "photoelectric") c.sweep = "frequency";
    if (key === "refraction") c.sweep = "angle";
    const labels =
      {
        network: {
          u1: "Birinchi rezistor kuchlanishi",
          u2: "Ikkinchi rezistor kuchlanishi",
          total: "Ekvivalent qarshilik",
        },
        pendulum: { period: "Taxminiy davr", energy: "Mexanik energiya" },
        lcr: { energyCap: "Elektr energiya", energyInd: "Magnit energiya" },
        heatEngine: {
          carnot: "Karno FIK chegarasi",
          efficiency: "Tanlangan FIK",
        },
        massEnergy: { joules: "Tinchlik energiyasi", tnt: "TNT ekvivalenti" },
      }[key] || {};
    for (const r of c.results) if (labels[r.key]) r.label = labels[r.key];
    const paramLabels = {
      current: "Tok kuchi",
      efficiency: "FIK (0–1)",
      process: "Jarayon: 0 izoterma, 1 izobara, 2 izoxora",
      mode: "Ulash: 0 ketma-ket, 1 parallel",
    };
    for (const p of c.params)
      if (paramLabels[p.key]) p.label = paramLabels[p.key];
    if (key === "pendulum")
      c.results.find((r) => r.key === "height").label =
        "Joriy ko‘tarilish balandligi";
    if (key === "refraction") {
      c.params.find((p) => p.key === "angle").label =
        "Tushish burchagi (normaldan)";
      c.results.find((r) => r.key === "ratio").label =
        "Sindirish ko‘rsatkichlari nisbati";
      c.series = [
        ["beta", "°"],
        ["speed2", "Mm/s", 1e-6],
      ];
    }
    if (key === "ampere" || key === "lorentz")
      c.params.find((p) => p.key === "angle").label = "Maydon bilan burchak";
    if (key === "photoelectric")
      c.params.find((p) => p.key === "frequency").label = "Foton chastotasi";
    if (key === "lorentz")
      c.model +=
        " Massa u birliklarida (1 u = 1.66054·10⁻²⁷ kg), zaryad e birliklarida. Klassik, norelativistik model.";
    if (key === "pendulum")
      c.formulaLatex = "\\ddot\\theta+2\\beta\\dot\\theta+(g/l)\\sin\\theta=0";
    if (key === "collision") {
      c.params.find((p) => p.key === "v1").min = 0.5;
      c.params.find((p) => p.key === "v2").max = 0;
      c.results.find((r) => r.key === "lost").scale = 1;
      c.series = [
        ["x1", "m"],
        ["x2", "m"],
      ];
    }
    if (key === "lorentz") {
      Object.assign(
        c.params.find((p) => p.key === "charge"),
        { unit: "e" },
      );
      Object.assign(
        c.params.find((p) => p.key === "mass"),
        {
          min: 1,
          max: 40,
          step: 1,
          value: 1,
          unit: "u",
          label: "Zarracha massasi",
        },
      );
      c.results.find((r) => r.key === "force").scale = 1e12;
      c.results.find((r) => r.key === "spiralRadius").scale = 1;
      c.results.find((r) => r.key === "helixPitch").scale = 1;
      Object.assign(
        c.params.find((p) => p.key === "velocity"),
        { min: 10000, max: 10000000, step: 10000, value: 1000000 },
      );
      c.static = false;
      c.duration = 0.000002;
      c.timeScale = 0.0000001;
    }
    if (key === "lcr") {
      c.results
        .filter((r) => r.key.startsWith("energy"))
        .forEach((r) => (r.scale = 1e6));
    }
    if (key === "interference") {
      c.params.forEach((p) => (p.level = 0));
    }
    if (key === "massEnergy") {
      c.results.find((r) => r.key === "joules").scale = 1;
      c.results.find((r) => r.key === "tnt").scale = 1;
      c.results.find((r) => r.key === "tnt").unit = "kt";
    }
    if (key === "decay") {
      c.params.find((p) => p.key === "halfLife").unit = "s";
      c.results.find((r) => r.key === "activity").unit = "s⁻¹";
    }
    if (key === "firstLaw") {
      c.params.find((p) => p.key === "deltaT").min = -100;
    }
    if (!c.series.length)
      c.series = c.results.slice(0, 2).map((r) => [r.key, r.unit, r.scale]);
    c.easy = c.model;
    c.medium = c.model;
    c.hard = [c.formulaLatex];
  }
  defs.sphere.title = "Zaryadlangan shar va tekislik";
  defs.sphere.params.unshift(
    P("mode", "Model: 0 o‘tkazgich shar, 1 tekislik", 0, 1, 1, 0),
  );
  defs.sphere.params.push(
    P(
      "surfaceCharge",
      "Tekislikning sirt zaryad zichligi",
      -100,
      100,
      1,
      20,
      "nC/m²",
    ),
  );
  defs.sphere.model +=
    " 1-rejimda cheksiz yupqa, o‘tkazmaydigan zaryadlangan tekislik: E=σ/(2ε₀); φ=−Ed, tekislikda φ=0. Ikkala tomonda kuch chiziqlari simmetrik.";
  defs.sphere.easy = defs.sphere.medium = defs.sphere.model;
  defs.sphere.formulaLatex =
    "E_{shar}=kq/r^2,\\quad E_{tekislik}=\\sigma/(2\\varepsilon_0)";
  defs.sphere.hard = [defs.sphere.formulaLatex];
  defs.sphere.sweep = "distance";
  defs.vectors.series = [
    ["x", "m"],
    ["y", "m"],
  ];
  defs.ac.timeScale = 0.02;
  defs.elevator.series = [["y", "m"], ["velocity", "m/s"]];
  defs.ac.duration = 0.24;
  defs.gravity.timeScale = 1000;
  defs.gravity.duration = 12000;
  defs.diffraction.sweep = "angle";
  defs.capacitorNetwork.sweep = "c1";
  defs.instrument.sweep = "eyepiece";
  Object.assign(configs, defs);
  // Ba’zi izoh mavzulari tayyor tajribaning bir qismi sifatida o‘rganiladi.
  configs.motion.topicNumbers.push(5);
  configs.spring.topicNumbers.push(49, 52);
  configs.gas.topicNumbers.push(57);
  for (const c of Object.values(configs)) {
    if (catalogLessons[c.key] && !["batteries", "rutherford"].includes(c.key)) {
      c.easy = catalogLessons[c.key];
      c.medium = catalogLessons[c.key] + " " + c.model;
    }
    for (const p of c.params) {
      p.label ||= paramNames[p.key] || p.key;
    }
    if (c.visual) c.params.forEach((p) => (p.level = 0));
    for (const r of c.results) {
      if (r.label && !resultNames[r.key]) resultNames[r.key] = r.label;
    }
    if (c.visual)
      c.results.forEach(
        (r) =>
          (r.label ||=
            resultNames[r.key] ||
            {
              u1: "Birinchi jismning yakuniy tezligi",
              u2: "Ikkinchi jismning yakuniy tezligi",
              impulse: "Kuch impulsi",
              momentumAfter: "Yakuniy impuls",
              lost: "Yo‘qolgan mexanik energiya",
              bigForce: "Katta pistondagi kuch",
              ratio: "Nisbat",
              bigLift: "Katta piston yo‘li",
              degrees: "Mayatnik burchagi",
              work: "Bajarilgan ish",
              temperature2: "Yakuniy harorat",
              carnot: "Karno FIK chegarasi",
              efficiency: "FIK",
              heatOut: "Sovutgichga issiqlik",
              total: "Jami qiymat",
              maxForce: "Maksimal kuch",
              spiralRadius: "Trayektoriya radiusi",
              helixPitch: "Spiral qadami",
              energyCap: "Elektr energiya",
              energyInd: "Magnit energiya",
              voltage2: "Ikkinchi kuchlanish",
              current2: "Ikkinchi tok",
              beta: "Sinish burchagi",
              critical: "Kritik burchak",
              speed2: "Ikkinchi muhitdagi tezlik",
              order: "Interferensiya tartibi",
              pathDiff: "Yo‘llar farqi",
              fringeSpacing: "Franjalar oralig‘i",
              intensity: "Nisbiy intensivlik",
              photon: "Foton energiyasi",
              threshold: "Chegara chastotasi",
              joules: "Tinchlik energiyasi",
              tnt: "TNT ekvivalenti",
              remaining: "Qolgan yadrolar",
              decayed: "Yemirilgan yadrolar",
              percent: "Qolgan ulush",
              activity: "Aktivlik",
            }[r.key] ||
            r.key),
      );
  }
  return configs;
}
