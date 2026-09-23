# Fizik modellar va manbadagi aniqlashtirishlar

Hisoblash birliklari SI; UI’dagi litr va mikrokulonlar mos ravishda m³ va C ga o‘tkaziladi. g=9.8 m/s², k=8.9875517923×10⁹ N·m²/C², R=8.314462618 J/(mol·K). Rasm masshtabi fizik qiymatlarni o‘zgartirmaydi.

| Tajriba                          | Model va qo‘llanish chegarasi                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tekis o‘zgaruvchan harakat       | Bir o‘lchamli analitik yechim. Manfiy a tormozlash deb olinadi; v=0 dan keyin kuch olinib jism to‘xtaydi. Manfiy a ni cheksiz davom ettirishdagi teskari harakat bu rejimga kirmaydi.                             |
| Erkin tushish / gorizontal otish | Boshlang‘ich vertikal tezlik nol. y=h₀−gt²/2, x=v₀t; havoning qarshiligi yo‘q.                                                                                                                                    |
| Nyuton II                        | Qiyalik bo‘ylab F−mg sinθ va ishqalanish hisoblanadi. Statik va kinetik μ bir xil deb olingan. Grafikdagi v, x qiyalik bo‘ylab o‘lchanadi.                                                                        |
| Ishqalanish                      | F=μN. N tashqi vertikal bosim orqali mustaqil berilishi mumkin; shu sabab u har doim mg emas. μN=0 bo‘lsa to‘xtash vaqti/masofasi cheksiz.                                                                        |
| Burchak ostida otish             | h₀≠0 holatida umumiy kvadratik ildiz bilan uchish vaqti topiladi. L=v₀²sin2α/g faqat boshlanish va tugash sathlari tengligida amal qiladi.                                                                        |
| Energiya                         | y=q²/(2R) relsidagi nuqtaviy jism. Haqiqiy tezlik v=q̇√(1+(q/R)²). RK4 yordamida geometrik tezlanish va chiziqli qarshilik hisoblanadi. Aylanish energiyasi yo‘q. Ishqalanishda Eₖ+Eₚ kamayadi, Eₖ+Eₚ+Q saqlanadi. |
| Prujina                          | Massasiz chiziqli prujina, muvozanat atrofida garmonik tebranish, so‘nish yo‘q.                                                                                                                                   |
| Rezonans                         | Majburiy so‘nuvchi chiziqli osillyatorning barqarorlashgan rejimi. A chekli, maksimum ωpeak=√max(0,ω₀²−2β²). Ko‘prik shakli sxematik.                                                                             |
| Arximed                          | Botgan hajm Vbotgan dan foydalaniladi. Kvazistatik gidrostatik kuch, chiziqli qarshilik va qattiq idish tubi; qisman botish RK4 bilan hisoblanadi.                                                                |
| Ideal gaz                        | pV=nRT; RMS tezlik √(3RT/M). Izotermik siqilish bosimni oshiradi, tezlikni oshirmaydi. Ko‘rsatilgan molekulalar sxematik vakillar.                                                                                |
| Kulon                            | Vakuumdagi mahkamlangan nuqtaviy zaryadlar; kuch moduli va yo‘nalish alohida. r>0.                                                                                                                                |
| Om                               | Chiziqli ekvivalent yuk, ideal manba. Lampochka P=UI quvvat indikatori; alohida qo‘shimcha rezistor emas.                                                                                                         |
| To‘liq zanjir                    | I=ε/(R+r), U=IR, Pichki=I²r. Manba kimyosi va zaryadsizlanishi modellashtirilmagan.                                                                                                                               |
| Induksiya                        | Φ(x)=B₀S exp(−x²/2ℓ²), S=0.02 m², ℓ=0.65 m; x=1.5 cos(ωt). ε=−N(dΦ/dx)v analitik hisoblanadi. Tok I=ε/R; magnit yuritmasi tashqi, o‘zinduksiya kiritilmagan.                                                      |
| Linza                            | Yupqa yig‘uvchi linza. F — fokus, d — predmet masofasi, f — tasvir masofasi; ishorali kattalashtirish M=−f/d. d=F da alohida cheksizlik holati.                                                                   |

Boshlang‘ich promptdagi uch joy pedagogik aniqlik uchun tuzatildi: ishqalanishda yo‘qolgan mexanik energiya issiqlikka aylanishi ko‘rsatiladi; ideal gaz bosimi ortishi molekulalar tezligining doim ortishi degani emas; Arximed qonunida butun hajm emas, botgan hajm ishlatiladi.

Tacoma Narrows halokati oddiy tashqi chastotali rezonans tajribasi sifatida talqin qilinmaydi. Ko‘prikda aeroelastik torsion flutter yuz bergan. [Washington State Department of Transportation](https://wsdot.wa.gov/TNBhistory/bridges-failure.htm).

Asosiy tekshiruv manbalari:

- [OpenStax — Forced Oscillations](https://openstax.org/books/university-physics-volume-1/pages/15-6-forced-oscillations): so‘nish, majburiy chastota va amplituda modeli.
- [OpenStax — Molecular Model of an Ideal Gas](https://openstax.org/books/university-physics-volume-2/pages/2-1-molecular-model-of-an-ideal-gas): bosim, harorat va molekulyar tezlik bog‘lanishi.
- [OpenStax — Thin Lenses](https://openstax.org/books/university-physics-volume-3/pages/2-4-thin-lenses): nur diagrammalari, ishora qoidalari va fokus holati.

`topics.json` original yuborilgan ro‘yxatni saqlaydi. Keyingi bosqich mavzularining barcha formulalari kitob bilan birma-bir tasdiqlangan deb hisoblanmaydi; har yangi simulyatsiya yozilishida qo‘llanish shartlari va ishoralari tekshiriladi.
