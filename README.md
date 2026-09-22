# TT Physics Lab

Tashkent University of Technology uchun o‘zbek tilidagi interaktiv fizika laboratoriyasi. Dastlabki texnik topshiriqdagi **15 ta MVP simulyatsiya**, uch daraja, Canvas animatsiyalar, KaTeX formulalar va Chart.js grafiklar.

## Ishga tushirish

Node.js 20 yoki undan yangi versiya bilan:

```sh
node scripts/serve.js
```

Manzil: **http://127.0.0.1:5173**. Windows’da `start.ps1` ham ishlaydi; u o‘rnatilgan Node.js yoki ushbu ish maydonining `.tools/node.exe` faylini topadi.

`npm start` va `npm run dev` ham shu serverni ishga tushiradi. Runtime uchun `npm install` shart emas: shrift, KaTeX va Chart.js lokal saqlangan. Internet bo‘lmasa ham barcha tajribalar ishlaydi. `index.html` faylini `file://` orqali ochish o‘rniga HTTP serverdan foydalaning.

## Tayyor funksiyalar

- Bosh sahifadagi jonli F=ma tajribasi va TT uslubidagi navigatsiya.
- 143 ta manba mavzusi, 15 ta bo‘lim, qidiruv, bo‘lim va tayyorlik filtrlari.
- 15 ta to‘liq tajriba; har birida Oson / O‘rta / Qiyin darajalari. Murakkabroq darajalar qo‘shimcha parametr, grafik va matematik chiqarilishni ochadi; sodda elektr modellarda darajalar tushuntirish va tahlil chuqurligi bilan farqlanadi.
- Slayder va sonli kiritish, birliklar, natijalar, pauza, tezlik va qayta boshlash.
- Gorizontal va burchak ostida otish, 4 tagacha saqlanadigan trayektoriya.
- Ishqalanish, energiyaning issiqlikka aylanishi, qisman botish, so‘nuvchi rezonans, linza fokusidagi maxsus holat.
- Lokal progress, birinchi foydalanish yo‘riqnomasi, klaviatura navigatsiyasi, mobil ko‘rinish.
- Keyingi bosqichdagi mavzularda manba formulalari va “Tez orada” holati. Ular tayyor simulyatsiya sifatida ko‘rsatilmaydi.

## Tekshirish

```sh
node --test tests/physics.test.js
```

47 test: har bir MVP hisoblash uchun kamida uchta ma’lum natija/chegara holati, energiya balansi, slayder chegaralari va katalog yaxlitligi.

Brauzer sinovlari uchun Playwright va Chrome kerak:

```sh
npm install --no-save playwright@1.55.0
node tests/browser.mjs
```

Server oldindan ishlayotgan bo‘lishi kerak. `BASE_URL`, `PLAYWRIGHT_MODULE` va `BROWSER_CHANNEL` muhit o‘zgaruvchilari orqali sozlash mumkin. Skript 45 daraja kombinatsiyasi, 320/390 px mobil o‘lchamlar, qidiruv, progress, izlar, fokus, animatsiya boshqaruvlari va runtime xatolarini tekshiradi. Tasvirlar `test-results/` ga yoziladi; bu katalog Git’ga kirmaydi.

## Tuzilma

```text
src/
  App.js                 # hash routing va sahifalar
  components/            # Canvas, slayder, daraja, formula, natija, grafik
  simulations/           # 15 modul; render.js da Canvas tasvirlari
  physics/               # UI’dan mustaqil hisoblash va SI konstantalar
  data/configs.js        # parametrlar, birliklar, darajalar va modul fabrikasi
  data/topics.json       # berilgan ro‘yxatdagi 143 mavzu
  data/sections.js        # 15 bo‘limga moslashtirish
  i18n/uz.js             # o‘zbekcha matnlar va pedagogik mazmun
  styles.css             # responsive TT dizayn tizimi
public/vendor/           # lokal, versiyasi belgilangan kutubxonalar
docs/                    # asl topshiriqlar va model izohlari
tests/                   # fizik va brauzer tekshiruvlari
```

Har bir modul `simulationConfig` eksport qiladi: `id`, `title`, `section`, `formulaLatex`, `levels`, `calculate`. Fizik holatni `calculate(params, time)` beradi; tasvirlash ushbu natijadan foydalanadi. Analitik yechimi yo‘q rels va qisman botish modellarida RK4 integratsiyasi qo‘llangan. Kadrlar vaqti `requestAnimationFrame` orqali olinadi; yashirin tabdagi vaqt sakrashlari cheklanadi.

## Manba va ko‘lam

Foydalanuvchi yuborgan ikkala Markdown fayl `docs/` ichida o‘zgartirilmagan holda saqlangan. Asl ro‘yxatda 128 va 131 raqamlar yo‘q: 145 deb yozilgan bo‘lsa ham 143 ta yozuv mavjud. Kitob sahifalari berilmaganligi sabab `page: null` saqlangan. Yulduzli mavzular soni 32 ta.

Fizik modelning shartlari har tajribada hamda [model izohlarida](docs/PHYSICS.md) yozilgan. Tashqi dizayn manbasi — [universitet sayti](https://tashkenttech-edu.uz/). TT belgisi matn va CSS bilan chizilgan; yuklab olingan rasmiy logo aktivi emas.

Login/serverdagi hisoblar, qolgan mavzularning yangi simulyatsiyalari, boshqa tillar va dark mode bu bosqichga kirmaydi. Sayt statik hostingga tayyor; hozircha GitHub’ga push va internetga deploy bajarilmagan.

Kutubxona litsenziyalari: [THIRD_PARTY.md](THIRD_PARTY.md).
