# TO'LIQ TEXNIK TOPSHIRIQ (PROMPT)
# Universitet muhandislik talabalari uchun interaktiv fizika simulyatsiya websayti

> Bu hujjat AI kod yozish vositasiga (Claude Code, Cursor, ChatGPT va h.k.) to'g'ridan-to'g'ri berish uchun mo'ljallangan. Har bir bo'lim aniq, bajariladigan ko'rsatma sifatida yozilgan. Hech narsani o'zingizcha soddalashtirmang yoki qisqartirmang — har bir talab pedagogik yoki texnik sababga ega.

---

## QISM A: LOYIHA KONTEKSTI VA MAQSAD

### A.1 Kim uchun
Loyiha foydalanuvchilari — **universitet muhandislik (engineering) yo'nalishi talabalari**. Bu ular uchun quyidagini anglatadi:
- Ular allaqachon asosiy matematikani (algebra, boshlang'ich hisob-kitob) bilishadi
- Ular faqat "tushunish" emas, balki **muhandislik intuitsiyasini** rivojlantirishlari kerak — parametrlar o'rtasidagi sabab-oqibat bog'liqligini his qilish
- Ular real loyihalashda ishlatiladigan formulalarni ko'rishni xohlaydilar, shunchaki maktab darsligi emas
- Interfeys "o'yinchoq" emas, balki **professional muhandislik vositasi** hissini berishi kerak (masalan, MATLAB/Simulink yoki PhET simulyatsiyalari darajasidagi jiddiylik, lekin ancha chiroyliroq va zamonaviyroq)

### A.2 Nima uchun kerak
Talabalar formulani darslikda o'qiganda, ular ko'pincha uni **statik matematik ifoda** sifatida yodlab qolishadi — lekin parametrlar o'zgarganda tizim qanday **dinamik** javob berishini tasavvur qila olmaydi. Bu loyiha shu bo'shliqni to'ldiradi: formula endi qog'ozdagi harflar emas, balki jonli, boshqariladigan tizim.

### A.3 Manba material
Website **"Innova o'quv markazi" fizika test to'plami** (muallif: Sardor Berdiyev, 2023-yil, 357 sahifa) kitobiga asoslanadi. Kitob quyidagi 15 ta katta bo'limdan iborat, jami 145 ta mavzu:

1. KINEMATIKA (13 mavzu)
2. DINAMIKA ASOSLARI (16 mavzu)
3. STATIKA (4 mavzu)
4. ISH, ENERGIYA, QUVVAT (6 mavzu — Statika bo'limi ichida)
5. SUYUQLIK VA GAZLAR MEXANIKASI (7 mavzu)
6. TEBRANISH VA TO'LQINLAR (8 mavzu)
7. MOLEKULAR FIZIKA (14 mavzu)
8. TERMODINAMIKA ASOSLARI (6 mavzu)
9. ELEKTROSTATIKA (12 mavzu)
10. O'ZGARMAS TOK QONUNLARI (9 mavzu)
11. TURLI MUHITLARDA ELEKTR TOKI (6 mavzu)
12. ELEKTROMAGNIT HODISALAR (8 mavzu)
13. ELEKTROMAGNIT TEBRANISH VA TO'LQINLAR (11 mavzu)
14. OPTIKA (14 mavzu)
15. NISBIYLIK NAZARIYASI VA ATOM/YADRO FIZIKASI (7 mavzu)

Loyiha shu tuzilmaga to'liq mos, kengaytiriladigan arxitektura bilan qurilishi kerak — birinchi bosqichda kichik qism, keyin butun kitob qamrab olinadi.

---

## QISM B: MVP UCHUN TANLANGAN FORMULALAR (BOSQICH 1)

Quyidagi 15 ta formula birinchi bosqichda to'liq ishlab chiqilishi kerak. Har biri uchun aniq animatsiya kontseptsiyasi berilgan — buni AYNAN shunday amalga oshiring:

### B.1 KINEMATIKA
**1. Tekis o'zgaruvchan harakat** — `v = v₀ + at`, `x = x₀ + v₀t + at²/2`
- Animatsiya: gorizontal yo'lda harakatlanuvchi mashina/shar. Parametrlar: boshlang'ich tezlik v₀ (0–30 m/s), tezlanish a (−10 dan +10 m/s² gacha). Manfiy tezlanishda mashina sekinlashib to'xtasin.
- Grafiklar: x(t) va v(t) ikkita alohida grafik, real vaqtda chizilib borsin (trace).

**2. Erkin tushish va gorizontal otilgan jism** — `h = v₀t + gt²/2`, `x = v₀t`
- Animatsiya: balandlikdan tashlangan to'p, parabola traektoriyasi ko'rinsin. Parametrlar: boshlang'ich balandlik h₀ (1–50 m), gorizontal boshlang'ich tezlik v₀ (0–20 m/s).
- Vizual: yerga urilish nuqtasi aniq belgilansin, uchish vaqti va masofa ko'rsatilsin.

### B.2 DINAMIKA
**3. Nyutonning ikkinchi qonuni** — `F = ma`
- Animatsiya: massasi ko'rinadigan (kub o'lchami massaga proporsional o'zgaradi) jism, unga qo'yilgan kuch strelkasi. Parametrlar: massa m (0.5–20 kg), kuch F (0–100 N).
- Tezlanish natijasi jonli hisoblanib, jism mos tezlanish bilan harakatlansin.

**4. Ishqalanish kuchi** — `F_ishq = μN`
- Animatsiya: turli sirt (muz, yog'och, asfalt — vizual tekstura farqi bilan) ustida sirg'anuvchi quti. Parametrlar: ishqalanish koeffitsiyenti μ (0–1), normal kuch N.
- Qutining to'xtash masofasi real vaqtda o'zgarib ko'rinsin.

**5. Gorizontga burchak ostida otilgan jism** — to'liq parabolik harakat
- Animatsiya: to'p otish burchagi (0–90°) va boshlang'ich tezlik slayderlari. Maksimal balandlik va uchish masofasi jonli ko'rsatilsin. Turli burchaklarda parabolalarni "iz" sifatida solishtirish imkoniyati (ghost trail).

### B.3 ENERGIYA
**6. Mexanik energiyaning saqlanish qonuni** — `E_k + E_p = const`
- Animatsiya: tog' relslari (rollercoaster) tipidagi egri chiziqda harakatlanuvchi shar. Balandlik pasayganda kinetik energiya ortib, potensial energiya kamaysin — ikkala energiya bar-grafik shaklida yonma-yon ko'rsatilsin va yig'indisi doim bir xil (const chiziq) qolsin.
- Ishqalanish yoqilganda (checkbox) energiya asta kamayib, shar oxir-oqibat to'xtasin.

### B.4 TEBRANISHLAR
**7. Prujinali mayatnik** — `T = 2π√(m/k)`
- Animatsiya: vertikal osilgan prujina va uning uchidagi massa, tebranish jarayoni. Parametrlar: massa m (0.1–5 kg), prujina qattiqligi k (1–100 N/m).
- Davr T jonli hisoblanib ko'rsatilsin, vaqt-siljish grafigi sinusoida shaklida chizilsin.

**8. Rezonans** — tashqi majburlovchi chastota ω ni tabiiy chastota ω₀ ga yaqinlashtirish
- Animatsiya: mashhur Tacoma ko'prigi misoli — ko'prik tebranish amplitudasi majburlovchi chastota tabiiy chastotaga yaqinlashganda keskin oshib ketsin (real fizik rezonans egri chizig'i asosida, cheksizlikka intilmasin — real energiya yo'qotish hisobga olinsin).

### B.5 SUYUQLIK MEXANIKASI
**9. Arximed kuchi** — `F_A = ρ_suyuqlik · g · V`
- Animatsiya: suyuqlikka botirilayotgan jism (kub yoki shar). Parametrlar: jism zichligi ρ_jism, suyuqlik zichligi ρ_suyuqlik (suv/yog'/simob tanlovi), jism hajmi V.
- Jism zichligiga qarab: suzib chiqsin, muallaq tursin yoki cho'ksin — real fizik natija.

### B.6 MOLEKULAR FIZIKA
**10. Ideal gaz holat tenglamasi** — `pV = νRT` (Klapeyron-Mendeleyev)
- Animatsiya: qutida harakatlanuvchi zarrachalar (molekulalar), bosim va harorat ortganda zarrachalar tezroq harakatlansin va devorlarga ko'proq urilsin (vizual bosim ko'rsatkichi).
- Parametrlar: harorat T, hajm V — bosim p jonli hisoblanib chiqsin.

### B.7 ELEKTROSTATIKA
**11. Kulon qonuni** — `F = kq₁q₂/r²`
- Animatsiya: ikkita zaryad (musbat/manfiy tanlash imkoniyati bilan) orasidagi masofa va kuch strelkasi. Bir xil zaryadlarda itarilish, har xil zaryadlarda tortilish strelkasi ko'rsatilsin.
- Parametrlar: q₁, q₂ (zaryad miqdori va ishorasi), r (masofa).

### B.8 TOK QONUNLARI
**12. Om qonuni (zanjir qismi uchun)** — `I = U/R`
- Animatsiya: oddiy elektr zanjiri — batareya, rezistor, lampochka. Kuchlanish oshganda lampochka yorqinroq yonsin (vizual yorqinlik o'zgarishi), qarshilik oshganda tok kuchi kamaysin.
- Parametrlar: kuchlanish U (0–24 V), qarshilik R (1–100 Ω).

**13. To'liq zanjir uchun Om qonuni** — `I = ε/(R+r)`
- Kengaytirilgan versiya: ichki qarshilik r ham qo'shilgan, EYUK (ε) tushunchasi kiritilgan.

### B.9 ELEKTROMAGNETIZM
**14. Elektromagnit induksiya (Lens qoidasi)** — `ε = -dΦ/dt`
- Animatsiya: g'altak ichiga kirib-chiquvchi magnit, galvanometr ko'rsatkichi harakati bilan induksion tok yo'nalishini ko'rsatsin.

### B.10 OPTIKA
**15. Linza formulasi** — `1/F = 1/d + 1/f`
- Animatsiya: klassik optik sxema — predmet, linza, nur yo'llari (ray diagram), va hosil bo'lgan tasvir. Predmetni linzadan uzoqlashtirish/yaqinlashtirish orqali tasvir joyi va kattaligi real vaqtda o'zgarsin (haqiqiy/xayoliy, to'g'ri/teskari tasvir farqlansin).

---

## QISM C: HAR BIR SIMULYATSIYA SAHIFASINING ANIQ TUZILMASI

Har bir formula sahifasi quyidagi bo'limlardan iborat bo'lishi SHART, shu tartibda:

### C.1 Sarlavha bo'limi
- Formulaning nomi (o'zbek tilida, kitobdagi original nomlanish bilan)
- Formulaning o'zi katta, aniq shriftda (LaTeX/KaTeX render qilingan)
- Qaysi bo'lim/mavzu ostida ekanligi (breadcrumb: masalan "Dinamika asoslari → Nyutonning ikkinchi qonuni")
- 1–2 gaplik qisqa tavsif
- Sahifa header'i (butun saytdagi kabi) TT logotipi va "TASHKENT UNIVERSITY OF TECHNOLOGY — Physics Lab" brendini o'z ichiga olsin (Qism D.0 ga qarang)

### C.2 Daraja tanlash paneli
- Uchta aniq tugma/tab: **🟢 Oson (Easy) | 🟡 O'rta (Medium) | 🔴 Qiyin (Hard)**
- Tanlangan daraja vizual jihatdan aniq ajralib tursin (rang, chegara)
- Daraja almashtirilganda pastdagi simulyatsiya maydoni butunlay yangilanadi, sahifa qayta yuklanmaydi (SPA-uslubidagi almashish)

### C.3 Asosiy simulyatsiya maydoni (ikki ustunli layout, desktop uchun; mobil uchun bir ustun)
**Chap/markaziy ustun — Vizual animatsiya:**
- Canvas yoki SVG asosidagi 2D animatsiya, kamida 600×400 piksel
- Fon — och rangli, neytral (animatsiya obyektlariga e'tibor qaratilishi uchun)
- Animatsiya doimiy loop'da ishlasin (agar tizim dinamik bo'lsa) yoki parametr o'zgarganda darhol qayta chizilsin (agar statik hisoblash bo'lsa)

**O'ng ustun — Boshqaruv paneli:**
- Har bir parametr uchun: nomi, joriy qiymati (son), slider, va o'lchov birligi
- Slider harakatlanganda qiymat REAL VAQTDA yangilanadi (debounce yoki throttle kerak emas — to'g'ridan-to'g'ri javob)
- Parametr chegaralari fizik jihatdan mantiqiy bo'lsin (masalan, massa hech qachon manfiy bo'lmasin)

### C.4 Natija paneli
- Formuladan hisoblangan natija katta, aniq ko'rinadigan raqam sifatida (masalan, "Tezlanish: a = 4.5 m/s²")
- Agar bir nechta natija bo'lsa (masalan, uchish vaqti VA masofa) — barchasi kichik kartochkalarda

### C.5 Grafik bo'limi (Medium va Hard darajalarida majburiy, Easy'da ixtiyoriy)
- X va Y o'qlari aniq belgilangan (birlik bilan)
- Real vaqtda chiziladigan chiziq yoki egri chiziq
- Agar animatsiya davomiy bo'lsa (masalan, tebranish) — grafik ham vaqt bo'yicha "oqib" borsin

### C.6 Tushuntirish matni
- **Easy**: 2–3 gap, kundalik metafora bilan
- **Medium**: real texnik/amaliy misol (masalan, "avtomobil tormozlash masofasi qanday hisoblanadi")
- **Hard**: formulaning qisqa hosilasi (derivation), 3–5 qadamda matematik chiqarilishi

### C.7 Muhandislik qo'llanilishi (barcha darajalarda, pastda)
- "Bu qayerda ishlatiladi?" bo'limi — qaysi muhandislik sohasida (qurilish, energetika, mashinasozlik, elektronika) ushbu formula qo'llanilishi, 2–3 gap

### C.8 Navigatsiya
- Pastda: "← Oldingi mavzu" va "Keyingi mavzu →" tugmalari
- Yon panelda (yoki header'da): to'liq mavzular ro'yxatiga qaytish tugmasi

---

## QISM D: VIZUAL DIZAYN TIZIMI (Design System)

### D.0 BRENDING — Tashkent University of Technology (TT) korporativ uslubi

Bu sayt mustaqil loyiha emas, balki **Tashkent University of Technology (TT)** universitetining rasmiy fizika simulyatsiya platformasi sifatida taqdim etilishi kerak. Shuning uchun universitetning mavjud rasmiy websaytidagi (tashkenttech-edu.uz) vizual uslubga to'liq mos bo'lsin:

**Sayt nomi/brendi:**
- To'liq nom: **"TT Physics Lab"** yoki **"Tashkent Tech — Interaktiv Fizika Simulyatsiyalari"** (ikkalasidan birini tanlash mumkin, lekin header'da albatta "TASHKENT UNIVERSITY OF TECHNOLOGY" nomi va tegishli bo'lim nomi — masalan "Physics Simulation Lab" yoki "Fizika Simulyatsiya Markazi" — birga ko'rinishi kerak)
- Bu universitetning rasmiy bir bo'limi/loyihasi ekanligi header va footer'da aniq bildirilishi kerak

**Logo:**
- Yuqori chap burchakda universitet logotipiga o'xshash uslub: katta, qalin "TT" harflari (to'q apelsin/qizg'ish-to'q rangda) + yoniga "TASHKENT UNIVERSITY / OF TECHNOLOGY" matni (ikki qatorda, qalin sans-serif shrift, "TASHKENT" va "TECHNOLOGY" so'zlari apelsin rangda, qolgan so'zlar to'q ko'k/kulrang rangda — original saytdagi kabi)
- Logo yoniga kichik qo'shimcha belgi/teg qo'yish mumkin: masalan "PHYSICS LAB" so'zi kichikroq shriftda, logotip pastida yoki yonida

**Header tuzilmasi (asl saytga mos):**
- Yuqori qatorda: email va telefon kontakt (yoki shunga o'xshash joy egallovchi elementlar — bu yerda kerak bo'lmasa, "Qidiruv" va "Til tanlash" bilan almashtirilishi mumkin)
- Asosiy navigatsiya qatori: "Bosh sahifa | Mavzular | Bo'limlar | Progress | Biz haqimizda" kabi menyu, oq fonda, to'q ko'k matn
- Navigatsiya elementlarida hover holatida apelsin rang urg'usi

### D.1 Rang palitrasi (TT korporativ ranglariga mos)
Universitetning rasmiy saytidan olingan rang sxemasi asosida:

- **Asosiy aksent rang (Primary/Brand)**: to'q apelsin-qizil (`#F1592A` yoki shunga yaqin, ekrandagi "TT" logotipi va tugmalar rangiga mos) — barcha asosiy tugmalar, aktiv holat, muhim urg'ular uchun
- **Ikkilamchi rang (Secondary/Dark)**: to'q ko'k-kulrang/shifer (`#1E2A38` yoki `#2C3E50` atrofida) — header fon gradienti (och holatdan to'q holatgacha), sarlavha matnlari, footer fon
- **Fon ranglari**: 
  - Och sahifalar uchun: oq (`#FFFFFF`) va juda och kulrang (`#F7F8FA`)
  - "Hero" yoki alohida ajratib ko'rsatiladigan bo'limlar uchun: to'q ko'kdan ochga gradient (asl saytdagi bosh sahifa banneriga o'xshash)
- **Testimonial/kartochka fon**: apelsin gradienti (och apelsindan to'q apelsingacha) — masalan formulalar bo'yicha "eng mashhur simulyatsiyalar" kartochkalarida ishlatilishi mumkin
- **Easy daraja**: yashil ton (`#10B981`) — TT brend rangi bilan ziddiyatga kirmaydigan, alohida funksional rang sifatida saqlanadi
- **Medium daraja**: sariq/amber ton (`#F59E0B`)
- **Hard daraja**: to'q qizil ton (`#EF4444`) — apelsin brend rangidan farqlanishi uchun to'q qizilroq soya tanlansin
- **Kuch/vektor strelkalari**: qizil (kuch), ko'k (tezlik), yashil (tezlanish) — izchil ranglar tizimi butun saytda saqlanishi kerak
- Dark mode qo'shish tavsiya etiladi (ixtiyoriy, lekin CSS o'zgaruvchilar orqali oson qo'shiladigan qilib qurilsin)

### D.1.1 Tipografik brend uslubi
- Sarlavhalarda katta, qalin (bold/extra-bold), zamonaviy sans-serif shrift — asl saytdagi kabi yirik va dadil sarlavhalar ("Engineering the future. Build your future in technology." uslubidagi katta, bosqichma-bosqich qator-qator sarlavhalar formatidan ilhomlanish mumkin, masalan bosh sahifada: "Fizikani his qiling. Formulalarni jonlantiring.")
- Tugmalar: to'ldirilgan apelsin fon, oq matn, yumaloqlangan burchaklar (asl saytdagi "Explore programmes", "Open virtual tour" tugmalariga o'xshash uslub)

### D.2 Tipografiya
- Sarlavhalar uchun zamonaviy sans-serif shrift (masalan Inter, Manrope yoki Poppins — Google Fonts orqali)
- Formulalar uchun KaTeX yoki MathJax — bu matematik ifodalar odatiy matn sifatida emas, balki to'g'ri formatlangan formula sifatida ko'rinishi SHART
- Raqamli natijalar uchun monospace yoki tabular-nums shrift xususiyati (raqamlar o'zgarganda joy siljimasin)

### D.3 Animatsiya va o'tishlar
- Barcha holat o'zgarishlari CSS transition yoki JS animatsiya bilan yumshoq (250–400ms ease-in-out)
- Daraja almashtirilganda fade/slide o'tish effekti
- Slider harakatida hech qanday kechikish (lag) sezilmasligi kerak

### D.4 Responsive dizayn
- Desktop: ikki ustunli layout (animatsiya + boshqaruv yonma-yon)
- Planshet/mobil: bir ustunli, animatsiya yuqorida, boshqaruv pastda, sticky/collapsible panel bo'lishi mumkin
- Slider'lar mobilda barmoq bilan qulay boshqariladigan o'lchamda (min. 44×44px teginish maydoni)

---

## QISM E: TEXNIK ARXITEKTURA

### E.1 Texnologik stek
- **Frontend**: Vanilla JavaScript yoki React (agar React — komponentlar qayta ishlatiladigan bo'lsin)
- **Animatsiya**: HTML5 Canvas API (fizik simulyatsiyalar uchun eng mos, chunki har kadrda pozitsiyani qayta hisoblash kerak) yoki SVG (statik diagrammalar uchun, masalan linza sxemasi)
- **Grafiklar**: Chart.js (yengil va tez) yoki D3.js (murakkabroq, moslashuvchan vizualizatsiyalar uchun)
- **Formula render**: KaTeX (MathJax'dan tezroq)
- **Styling**: Tailwind CSS (tez, izchil dizayn tizimi uchun qulay) yoki toza CSS custom properties bilan

### E.2 Fayl/papka strukturasi (kengayishga moslashgan)
```
/src
  /simulations
    /kinematika
      tekis-ozgaruvchan-harakat.js
      erkin-tushish.js
    /dinamika
      nyuton-2-qonun.js
      ishqalanish.js
    /energiya
      energiya-saqlanish.js
    /tebranish
      prujinali-mayatnik.js
      rezonans.js
    /suyuqlik
      arximed-kuchi.js
    /molekulyar
      ideal-gaz.js
    /elektrostatika
      kulon-qonuni.js
    /tok
      om-qonuni.js
    /elektromagnit
      induksiya.js
    /optika
      linza-formulasi.js
  /components
    SimulationCanvas.js       // umumiy Canvas wrapper
    ParameterSlider.js        // qayta ishlatiladigan slider komponenti
    LevelTabs.js              // Easy/Medium/Hard almashtiruvchi
    FormulaDisplay.js         // KaTeX formula ko'rsatkichi
    ResultCard.js             // natija kartochkasi
    LiveChart.js              // Chart.js wrapper
  /physics
    engine.js                 // umumiy fizik hisoblash funksiyalari
    constants.js               // g=9.8, k=8.99e9 va h.k. fizik konstantalar
  /data
    topics.json                // barcha 145 mavzuning metama'lumoti (nomi, bo'limi, sahifa raqami, formula, MVP'da mavjud/yo'q)
  App.js
  index.html
```

### E.3 Har bir simulyatsiya moduli quyidagi interfeysga amal qilsin (izchillik uchun)
```javascript
// Har bir simulyatsiya fayli quyidagi strukturaga ega bo'lishi kerak:
export const simulationConfig = {
  id: "nyuton-2-qonun",
  title: "Nyutonning ikkinchi qonuni",
  section: "Dinamika asoslari",
  formula: "F = ma",
  formulaLatex: "F = m \\cdot a",
  levels: {
    easy: { params: [...], render: (ctx, state) => {...} },
    medium: { params: [...], render: (ctx, state) => {...} },
    hard: { params: [...], render: (ctx, state) => {...} }
  },
  calculate: (params) => {
    // FAQAT shu yerda fizik hisoblash bo'ladi — reference formuladan
    // Masalan: return { acceleration: params.force / params.mass };
  }
};
```

Bu struktura shuni ta'minlaydi: **vizual render logikasi va fizik hisoblash logikasi alohida** — bu esa fizik to'g'rilikni tekshirishni osonlashtiradi va dizaynerlar hisoblashga tegmasdan vizualni o'zgartira olishadi.

### E.4 Performance talablari
- 60 FPS'ni saqlash uchun `requestAnimationFrame` ishlatilsin, `setInterval` emas
- Canvas har kadrda to'liq tozalanib qayta chizilishi kerak (`clearRect`), lekin faqat kerakli qismi (agar optimallashtirish kerak bo'lsa)
- Ko'p zarrachali simulyatsiyalarda (masalan, ideal gaz — 50-100 ta zarracha) obyektlar pool qilinishi tavsiya etiladi (memory allocation minimallashtirish uchun)

---

## QISM F: FIZIK ANIQLIK — ENG YUQORI USTUVORLIK (QAYTA TA'KIDLASH)

Bu loyihaning eng muhim, murosasiz qoidasi. Har bir simulyatsiya kod yozilishidan oldin quyidagi tekshiruv ro'yxatidan o'tishi kerak:

1. **Formula manbai**: har bir hisoblash aniq, tekshirilgan fizik formuladan kelib chiqqan bo'lsin (kitobdagi formulalar bilan mos)
2. **Birlik izchilligi**: SI tizimi (kg, m, s, N, J, W, V, A, Ω, T, va h.k.) qat'iy saqlansin
3. **Saqlanish qonunlari buzilmasin**: energiya, impuls, zaryad saqlanish qonunlari har qanday simulyatsiyada avtomatik bajarilishi kerak (bu "tekshiruv" sifatida kod ichida assert/console.warn qilinishi mumkin dev rejimida)
4. **Chegara holatlar**: 
   - Parametr 0 bo'lganda tizim qulab tushmasin (masalan, bo'lish nolga — `division by zero` handling)
   - Parametr maksimal qiymatda ham realistic ko'rinishda qolsin
5. **Vaqt qadami (timestep)**: fizik simulyatsiyalarda `dt` (delta time) frame rate'ga bog'liq bo'lmasin — `requestAnimationFrame`dan kelgan haqiqiy vaqt farqidan foydalanilsin, bu turli qurilmalarda bir xil tezlikda ishlashini ta'minlaydi
6. **Test holatlari**: har bir `calculate()` funksiyasi uchun kamida 2–3 ta ma'lum natijali test yozilsin (masalan: erkin tushish — h=20m dan tushirilgan jism g=9.8 bilan taxminan t=2.02s da yerga tegishi kerak)

**Vizual effektlar (soyalar, gradientlar, animatsiya silliqligi) hech qachon bu hisoblashlarga ta'sir qilmasligi yoki ularni "yaxshiroq ko'rinish uchun" o'zgartirmasligi kerak.**

---

## QISM G: FOYDALANUVCHI TAJRIBASI (UX) QO'SHIMCHA TALABLARI

### G.1 Xatoliklardan himoya
- Slider chegaralari HTML `min`/`max` orqali qat'iy belgilangan, foydalanuvchi chegaradan chiqa olmaydi
- Agar formula matematik jihatdan aniqlanmagan holatga tushsa (masalan, `r=0` Kulon qonunida) — tizim chiroyli xabar bersin: "Masofa nolga teng bo'lganda kuch cheksizlikka intiladi — real vaziyatda bu mumkin emas", qulab tushmasin

### G.2 Onboarding
- Birinchi marta saytga kirgan foydalanuvchi uchun qisqa tooltip/tur ("Bu yerda slider'ni suring va natijani kuzating")

### G.3 Qidiruv va navigatsiya
- Header'da qidiruv maydoni — formula nomi yoki kalit so'z bo'yicha (masalan "Om" yozilganda "Om qonuni" chiqsin)
- Chap sidebar'da butun 15 bo'lim va ularning mavzulari ko'rinadigan, yig'iladigan (collapsible) ro'yxat

### G.4 Til
- Barcha interfeys matni o'zbek tilida (lotin yozuvi, kitobdagi imlo qoidalariga mos: o', g', va h.k.)
- Kelajakda til qo'shish oson bo'lishi uchun barcha matnlar alohida `i18n` fayl/obyektda saqlansin, hardcode qilinmasin

---

## QISM H: BIRINCHI BOSQICH — ANIQ BAJARILADIGAN TOPSHIRIQ

AI kod yozuvchisi quyidagi ketma-ketlikda ishlasin:

**1-qadam**: Loyiha skeletini yarat (yuqoridagi E.2 papka strukturasi bilan), asosiy `App.js`, routing (agar React bo'lsa — React Router; agar vanilla JS bo'lsa — oddiy hash-based routing)

**2-qadam**: Umumiy qayta ishlatiladigan komponentlarni yoz: `SimulationCanvas`, `ParameterSlider`, `LevelTabs`, `FormulaDisplay`, `ResultCard`, `LiveChart`

**3-qadam**: Birinchi to'liq simulyatsiyani yarat — **Nyutonning ikkinchi qonuni (F=ma)** — uch darajali (Easy/Medium/Hard) to'liq, yuqoridagi C qismidagi barcha 8 kichik bo'lim bilan

**4-qadam**: Ikkinchi simulyatsiyani qo'sh — **Erkin tushish va gorizontal otilgan jism** — bu birinchisidan farqli turdagi animatsiyani talab qiladi (parabolik harakat), shuning uchun arxitekturaning moslashuvchanligini sinaydi

**5-qadam**: Asosiy sahifa (home page) — TT brendida quyidagi tuzilma bilan:
   - **Header**: chap tomonda TT logotipi + "TASHKENT UNIVERSITY OF TECHNOLOGY" matni, yonida kichikroq "PHYSICS LAB" yorlig'i; o'ng tomonda til tanlash va "Kirish" (agar hisob tizimi bo'lsa)
   - **Hero bo'lim**: to'q ko'kdan ochga gradient fon (asl universitet saytining bosh banneriga o'xshash), katta va qalin sarlavha (masalan: "Fizikani his qiling. Formulalarni jonlantiring."), qisqa tavsif, va katta apelsin rangli "Simulyatsiyalarni boshlash" tugmasi
   - **Bo'limlar kartochkalari**: barcha 15 bo'limni ko'rsatuvchi, chiroyli grid-kartochkalar bilan, MVP'da tayyor bo'lgan mavzular alohida belgilangan ("Tayyor" / "Tez orada") holatda — kartochkalar hover holatida apelsin soya-effekt bilan
   - **Footer**: universitet uslubidagi to'q fon, aloqa ma'lumotlari va ijtimoiy tarmoq ikonkalari joy egallovchisi (placeholder) sifatida qo'yilishi mumkin

**6-qadam**: Qolgan 13 ta MVP formulasini (Qism B dagi ro'yxat) xuddi shu shablon asosida ketma-ket qo'sh

Har bir qadamdan keyin: (a) fizik hisoblashni kamida 2 ta ma'lum natija bilan tekshir, (b) barcha uch darajada slider'lar to'g'ri ishlashini tekshir, (c) mobil ko'rinishni tekshir.

---

*Manba: "Innova o'quv markazi" fizika test to'plami, muallif Sardor Berdiyev, 2023-yil, 357 sahifa, 145 mavzu — to'liq fizika kursi (Kinematikadan Yadro fizikasigacha).*

*Bu prompt universitet muhandislik talabalari uchun mo'ljallangan, shuning uchun matematik va fizik qat'iylik ustuvor, lekin taqdimot vizual jihatdan zamonaviy va yuqori sifatli bo'lishi shart.*
