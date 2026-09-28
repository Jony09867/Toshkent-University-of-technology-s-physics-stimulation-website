# INNOVA KITOBI — BARCHA 145 MAVZU BO'YICHA TO'LIQ FORMULALAR RO'YXATI

> Har bir mavzu uchun: formula(lar), o'zgaruvchilar izohi, va **[SIM]** — simulyatsiya uchun juda mos / **[QISM]** — boshqa formulaning bir qismi sifatida ko'rsatish mumkin / **[MATN]** — faqat tushuncha, formula yo'q yoki simulyatsiyaga unchalik mos emas belgisi qo'yilgan. Bu belgi AI kod yozuvchisiga qaysi mavzuni alohida interaktiv sahifa qilish, qaysini matn sifatida qoldirish kerakligini tanlashda yordam beradi.

---

## 1-BO'LIM: KINEMATIKA

**1. Mexanikadagi asosiy tushunchalar** [MATN]
- Trayektoriya, yo'l, ko'chish tushunchalari — formula yo'q, ta'rif asosida.

**2. To'g'ri chiziqli tekis harakat** [SIM]
- `x = x₀ + vt`
- v — tezlik (const), x₀ — boshlang'ich koordinata

**3. To'g'ri chiziqli tekis harakatni grafik tasvirlash** [QISM]
- x(t) — to'g'ri chiziq, v(t) — gorizontal chiziq. (#2 bilan birga ko'rsatiladi)

**4. Harakatning nisbiyligi** [SIM]
- `v₁₃ = v₁₂ + v₂₃` (tezliklarni qo'shish, klassik Galiley qonuni)
- Masalan qayiq tezligi + oqim tezligi

**5. Notekis harakat** [QISM]
- `v_o'rtacha = Δx/Δt` — o'rtacha tezlik

**6. Tekis o'zgaruvchan harakat. Tezlanish. Oniy tezlik** [SIM]
- `a = (v - v₀)/t`
- `v = v₀ + at`

**7. Tekis o'zgaruvchan harakatda ko'chish** [SIM]
- `x = v₀t + at²/2`
- `x = (v² - v₀²)/2a`
- `x = (v₀+v)/2 · t`

**8. Ikki jismning harakati** [SIM]
- Uchrashish masalalari: `x₁(t) = x₀₁ + v₁t`, `x₂(t) = x₀₂ + v₂t`, kesishish nuqtasi

**9. Tekis o'zgaruvchan harakatni grafik ravishda tasvirlash** [QISM]
- a(t), v(t), x(t) grafiklari — #6, #7 bilan birga

**10. Egri chiziqli harakat** [SIM]
- Vektor yig'indisi orqali traektoriya, tezlik vektori har nuqtada traektoriyaga urinma

**11. Egri chiziqli harakatda tezlanish** [SIM]
- `a = a_tang + a_norm` (to'liq tezlanish = tangensial + normal/markazga intilma)
- `a_norm = v²/R`

**12. Aylanma harakatni uzatish** [SIM]
- `v = ωR`, tishli g'ildiraklar/kasnaklar orasidagi uzatish nisbati `R₁ω₁ = R₂ω₂`

**13. Aylana bo'ylab notekis harakat** [SIM]
- `ω = Δφ/Δt`, `T = 2π/ω`, `ν = 1/T`, `a_markazga = ω²R = v²/R`

---

## 2-BO'LIM: DINAMIKA ASOSLARI

**14. Kuch. Nyutonning birinchi qonuni** [MATN/SIM]
- Inersiya qonuni — kuchlar yig'indisi 0 bo'lsa jism tinch yoki tekis to'g'ri chiziqli harakatda qoladi (vizual demo mumkin)

**15. Massa. Zichlik** [QISM]
- `ρ = m/V`

**16. Nyutonning ikkinchi qonuni** [SIM] ⭐ (asosiy MVP)
- `F = ma`, `a = F/m`

**17. Nyutonning uchinchi qonuni** [SIM]
- `F₁₂ = -F₂₁` — ikki jism o'zaro ta'sir kuchlari, teng va qarama-qarshi

**18. Butun olam tortishish qonuni** [SIM]
- `F = G·m₁m₂/r²`, G = 6.67×10⁻¹¹ N·m²/kg²

**19. Og'irlik kuchi** [QISM]
- `F_og' = mg`

**20. Elastiklik kuchi** [SIM]
- Guk qonuni: `F_elast = -kx`

**21. Vazn** [SIM]
- Tik tezlanishda: `P = m(g±a)` (liftda vazn o'zgarishi — yaxshi vizual misol)

**22. Vaznsizlik** [QISM]
- `a = g` bo'lganda `P = 0`

**23. Jismning og'irlik kuchi ta'siridagi vertikal harakati** [SIM]
- `h = v₀t - gt²/2`, `v = v₀ - gt` (erkin tushish/yuqoriga otilgan jism)

**24. Gorizontal otilgan jismning harakati** [SIM] ⭐
- `x = v₀t`, `y = gt²/2`, uchish vaqti `t = √(2h/g)`

**25. Gorizontga nisbatan burchak ostida otilgan jismning harakati** [SIM] ⭐
- `x = v₀cosα·t`, `y = v₀sinα·t - gt²/2`
- Uchish masofasi: `L = v₀²sin2α/g`, maksimal balandlik: `H = v₀²sin²α/2g`

**26. Yerning sun'iy yo'ldoshlari** [SIM]
- Birinchi kosmik tezlik: `v₁ = √(gR)`, aylanish davri `T = 2π√(R³/GM)`

**27. Ishqalanish kuchi. Tinchlikdagi ishqalanish** [QISM]
- `F_tinchlik ≤ μN` (maksimal chegara)

**28. Sirpanish ishqalanish kuchi** [SIM] ⭐
- `F_ishq = μN`

**29. Bir necha kuch ta'siridagi harakat** [SIM]
- `F_natija = ΣF = ma` (kuchlar yig'indisi, vektor qo'shish)

---

## 3-BO'LIM: STATIKA / ISH-ENERGIYA-QUVVAT

**30. Jismning og'irlik markazi** [MATN]
- Geometrik/massa markazi ta'rifi, formula: `x_c = Σ(mᵢxᵢ)/Σmᵢ`

**31. Muvozanat shartlari** [SIM]
- `ΣF = 0` va `ΣM = 0` (momentlar), richag qoidasi: `F₁l₁ = F₂l₂`

**32. Kuch va impuls** [SIM]
- `p = mv`, `Δp = FΔt` (impuls o'zgarishi teoremasi)

**33. Impulsning saqlanish qonuni** [SIM] ⭐
- `m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'` (to'qnashuv — ajoyib vizual simulyatsiya)

**34. Mexanik ish** [SIM]
- `A = F·s·cosα`

**35. Kinetik energiya** [QISM]
- `E_k = mv²/2`

**36. Potensial energiya** [QISM]
- `E_p = mgh`

**37. Deformatsiyalangan prujinaning potensial energiyasi** [QISM]
- `E_p(prujina) = kx²/2`

**38. To'liq mexanik energiyaning saqlanish qonuni** [SIM] ⭐
- `E_k + E_p = const`

**39. Jismga qo'yilgan kuchlarning ishi. Mexanik energiyaning issiqlikka aylanishi** [SIM]
- `A_ishq = μmg·s` (ishqalanishga sarflangan ish issiqlikka aylanadi)

**40. Quvvat** [QISM]
- `N = A/t = F·v`

**41. Foydali ish koeffitsienti** [QISM]
- `η = A_foydali/A_sarflangan × 100%`

---

## 4-BO'LIM: SUYUQLIK VA GAZLAR MEXANIKASI

**42. Bosim. Paskal qonuni** [SIM]
- `p = F/S`, Paskal qonuni — bosim barcha yo'nalishlarda bir xil uzatiladi

**43. Gidrostatik bosim** [SIM]
- `p = ρgh`

**44. Tutash idishlar** [SIM]
- Bir xil suyuqlikda sathlar tenglashadi; turli suyuqliklarda `ρ₁h₁ = ρ₂h₂`

**45. Atmosfera bosimi** [MATN]
- Normal atmosfera bosimi = 101325 Pa, balandlik bilan kamayishi (barometrik formula)

**46. Gidravlik press** [SIM] ⭐
- `F₁/S₁ = F₂/S₂` (Paskal qonuniga asoslangan kuch ko'paytirish)

**47. Arximed kuchi** [SIM] ⭐
- `F_A = ρ_suyuqlik·g·V`

**48. Suyuqliklarning naydagi harakati. Bernulli qonuni** [SIM]
- Uzluksizlik tenglamasi: `S₁v₁ = S₂v₂`
- Bernulli tenglamasi: `p + ρv²/2 + ρgh = const`

---

## 5-BO'LIM: TEBRANISH VA TO'LQINLAR

**49. Tebranma harakatni harakterlovchi asosiy tushunchalar** [MATN]
- Amplituda, davr, chastota, faza — `T = 1/ν`, `ω = 2π/T`

**50. Prujinali mayatnik** [SIM] ⭐
- `T = 2π√(m/k)`

**51. Matematik mayatnik** [SIM] ⭐
- `T = 2π√(l/g)`

**52. Garmonik tebranishlar tenglamasi** [SIM]
- `x(t) = A·cos(ωt + φ₀)` yoki `A·sin(ωt+φ₀)`

**53. Tebranma harakat qilayotgan jismning energiyasi** [QISM]
- `E = kA²/2 = mω²A²/2` (to'liq energiya, doim const)

**54. Rezonans** [SIM] ⭐
- Amplituda-chastota bog'liqligi, `ω_majburiy ≈ ω₀` da amplituda maksimal

**55. Mexanik to'lqinlar** [SIM]
- `v = λν` (to'lqin tezligi = uzunlik × chastota)

**56. Tovush to'lqinlari** [SIM]
- `v = λν`, tovush tezligi muhitga bog'liq (havoda ≈340 m/s)

---

## 6-BO'LIM: MOLEKULAR FIZIKA

**57. Modda tuzilishi va uning asosiy xossalari** [MATN]
- `N = νN_A` (zarrachalar soni), Avogadro soni N_A=6.02×10²³ 1/mol
- `ν = m/M` (mol miqdori)

**58. Ideal gaz. Gaz MKN ning asosiy tenglamasi** [SIM]
- `p = (1/3)nm₀v²` (MKN asosiy tenglamasi)

**59. Absolut temperatura. Molekulalarning o'rtacha kinetik energiyasi** [SIM]
- `E_k(o'rtacha) = (3/2)kT`, k — Boltsman doimiysi

**60. Gaz molekulalarining o'rtacha kvadratik tezligi** [QISM]
- `v_kv = √(3kT/m₀) = √(3RT/M)`

**61. Ideal gaz holatining tenglamasi** [SIM] ⭐
- `pV = νRT` (Klapeyron–Mendeleyev)

**62. Klapeyron tenglamasi** [QISM]
- `p₁V₁/T₁ = p₂V₂/T₂` (bir massa gaz uchun umumiy holat tenglamasi)

**63. Gaz massasining o'zgarishi** [QISM]
- `pV = (m/M)RT`

**64. Izojarayonlar** [SIM] ⭐
- Izoterma (Boyl–Mariott): `pV = const` (T=const)
- Izobara (Gey-Lyussak): `V/T = const` (p=const)
- Izoxora (Sharl): `p/T = const` (V=const)

**65. Grafikli masalalar** [QISM]
- p-V, p-T, V-T grafiklari — #64 bilan birga vizualizatsiya

**66. To'yingan bug'. Kritik temperatura** [MATN]
- Kritik holat tushunchasi — formula kam, ko'proq tushunchaviy

**67. Havoning namligi** [SIM]
- Nisbiy namlik: `φ = (p/p₀)×100%`

**68. Kapillarlik hodisalari. Sirt taranglik** [SIM]
- Sirt taranglik: `F = σ·l`
- Kapillyar ko'tarilish: `h = 2σ/(ρgr)`

**69. Qattiq jismning mexanik xossalari** [SIM]
- Guk qonuni (deformatsiya): `σ = Eε` (Yung moduli)

**70. Issiqlikdan kengayish** [SIM]
- Chiziqli kengayish: `l = l₀(1+αΔT)`
- Hajmiy kengayish: `V = V₀(1+βΔT)`

---

## 7-BO'LIM: TERMODINAMIKA ASOSLARI

**71. Ichki energiya** [QISM]
- Ideal bir atomli gaz uchun: `U = (3/2)νRT`

**72. Termodinamikada ish** [SIM]
- `A = pΔV` (izobarik jarayonda)

**73. Issiqlik miqdori** [SIM]
- `Q = cmΔT` (qizdirish/sovutish)
- Faza o'zgarishi: `Q = λm` (eritish), `Q = Lm` (bug'lanish)

**74. Termodinamikaning birinchi qonuni** [SIM] ⭐
- `Q = ΔU + A`

**75. Adiabatik jarayon. Termodinamikaning II qonuni** [SIM]
- Adiabatik: `Q=0`, `ΔU = -A`
- Puasson tenglamasi: `pV^γ = const`

**76. Issiqlik dvigatellari** [SIM] ⭐
- FIK: `η = (Q₁-Q₂)/Q₁ = A/Q₁`
- Karno sikli maksimal FIK: `η_karno = (T₁-T₂)/T₁`

---

## 8-BO'LIM: ELEKTROSTATIKA

**77. Elektr zaryad. Zaryadning saqlanish qonuni** [MATN]
- `Σq = const` (izolyatsiyalangan tizimda)

**78. Kulon qonuni** [SIM] ⭐
- `F = kq₁q₂/r²`, k = 9×10⁹ N·m²/Kl²

**79. Elektr maydon. Maydon kuchlanganligi** [SIM]
- `E = F/q = kQ/r²`

**80. Elektr maydondagi o'tkazgichlar. Zaryadlangan shar va tekislik maydonlari** [SIM]
- Tekislik maydoni: `E = σ/2ε₀ε`, shar tashqarisida: `E = kQ/r²`

**81. Elektr maydondagi dielektriklar** [QISM]
- `E = E₀/ε` (dielektrik kamaytirish koeffitsiyenti)

**82. Bir jinsli elektr maydonning ishi. Potensial** [SIM]
- `A = qEd = q(φ₁-φ₂)`

**83. Nuqtaviy zaryad va zaryadlangan sharning potensiali** [QISM]
- `φ = kQ/r`

**84. Ekvipotensial sirtlar** [SIM]
- `φ = const` sirtlar, E ga perpendikulyar — vizualizatsiya uchun juda mos

**85. E va φ orasidagi bog'lanish** [QISM]
- `E = -Δφ/Δd` (bir jinsli maydonda: `E = U/d`)

**86. Elektr sig'im. Kondensatorlar** [SIM]
- `C = q/U`, tekis kondensator: `C = ε₀εS/d`

**87. Kondensatorlarni parallel va ketma-ket ulash** [SIM] ⭐
- Parallel: `C = C₁+C₂+...`
- Ketma-ket: `1/C = 1/C₁+1/C₂+...`

**88. Zaryadlangan kondensator energiyasi** [QISM]
- `W = CU²/2 = qU/2 = q²/2C`

---

## 9-BO'LIM: O'ZGARMAS TOK QONUNLARI

**89. Elektr toki. Tok kuchi** [SIM]
- `I = q/t`

**90. Zanjirning bir qismi uchun Om qonuni. Qarshilik** [SIM] ⭐
- `I = U/R`, `R = ρl/S`

**91. Elektr zanjirlar. O'tkazgichlarni ketma-ket va parallel ulash** [SIM] ⭐
- Ketma-ket: `R = R₁+R₂+...`, `I` bir xil
- Parallel: `1/R = 1/R₁+1/R₂+...`, `U` bir xil

**92. Ampermetr va voltmetrga qo'shimcha qarshilik ulash** [SIM]
- Shunt (ampermetr): `R_shunt = R_A/(n-1)`
- Qo'shimcha qarshilik (voltmetr): `R_qo'sh = R_V(n-1)`

**93. O'zgarmas tokning ishi va quvvati** [SIM]
- `A = UIt`, `N = UI = I²R = U²/R`

**94. Joul–Lens qonuni** [QISM]
- `Q = I²Rt`

**95. Lampalarni ketma-ket va parallel ulash** [SIM]
- #91 ning amaliy qo'llanilishi — lampalar yorqinligi orqali vizualizatsiya

**96. To'liq zanjir uchun Om qonuni** [SIM] ⭐
- `I = ε/(R+r)`

**97. Tok manbalarini ketma-ket va parallel ulash** [SIM]
- Ketma-ket: `ε = ε₁+ε₂+...`, `r = r₁+r₂+...`
- Parallel (bir xil manbalar): `ε` bir xil, `r = r₁/n`

---

## 10-BO'LIM: TURLI MUHITLARDA ELEKTR TOKI

**98. Metallarda elektr toki** [SIM]
- `R = R₀(1+αΔT)` (haroratga bog'liq qarshilik)

**99. Yarimo'tkazgichlarda elektr toki** [MATN]
- p-n o'tish, elektron-kovak o'tkazuvchanligi — asosan tushunchaviy

**100. Vakuumdagi elektr toki** [MATN]
- Termoelektron emissiya, diod xarakteristikasi

**101. Suyuqliklarda elektr toki** [SIM]
- Faradey elektroliz qonuni: `m = kIt` (elektrokimyoviy ekvivalent)

**102. Gazlarda elektr toki** [MATN]
- Ionlanish, o'z-o'zidan va o'zi-o'zidan bo'lmagan razryad — tushunchaviy

**103. Aralash masalalar** [QISM]
- Yuqoridagi bo'limlar formulalari kombinatsiyasi

---

## 11-BO'LIM: ELEKTROMAGNIT HODISALAR

**104. Doimiy magnitlar. Magnit maydon. Toklarning magnit maydoni** [SIM]
- To'g'ri o'tkazgich: `B = μμ₀I/2πr`
- Halqa markazida: `B = μμ₀I/2R`

**105. Amper kuchi** [SIM] ⭐
- `F = BIl·sinα`

**106. Lorens kuchi** [SIM] ⭐
- `F = qvB·sinα`

**107. Moddaning magnit xossalari** [MATN]
- Dia-, para-, ferromagnitlar — tushunchaviy, magnit singdiruvchanlik μ

**108. Magnit oqimi** [QISM]
- `Φ = BS·cosα`

**109. Elektromagnit induksiya qonuni. Lens qoidasi** [SIM] ⭐
- `ε = -ΔΦ/Δt`

**110. O'zinduksiya. Induktivlik** [SIM]
- `ε_o'zind = -LΔI/Δt`, `Φ = LI`

**111. Tok magnit maydoni energiyasi** [QISM]
- `W = LI²/2`

---

## 12-BO'LIM: ELEKTROMAGNIT TEBRANISHLAR VA TO'LQINLAR

**112. Tebranishlar konturida zaryad, kuchlanish va tok kuchi** [SIM]
- `q(t) = q₀cos(ωt)`, `I(t) = -Iₘsin(ωt)`

**113. Ideal tebranishlar konturi uchun Tomson formulasi** [SIM] ⭐
- `T = 2π√(LC)`

**114. Tebranishlar konturida energiya** [QISM]
- `W = LI²/2 + q²/2C = const`

**115. O'zgaruvchan tok generatori** [SIM]
- `e(t) = e₀sin(ωt)` — magnit oqim o'zgarishidan hosil bo'lgan EYUK

**116. O'zgaruvchan tok zanjirida aktiv qarshilik** [SIM]
- `I = U/R` (o'zgaruvchan effektiv qiymatlar bilan)

**117. O'zgaruvchan tok zanjirida kondensator** [SIM]
- Sig'im qarshiligi: `X_C = 1/ωC`

**118. O'zgaruvchan tok zanjirida induktiv g'altak** [SIM]
- Induktiv qarshilik: `X_L = ωL`

**119. O'zgaruvchan tok zanjirida aktiv qarshilik, kondensator va induktiv g'altak** [SIM] ⭐
- To'liq qarshilik (impedans): `Z = √(R² + (X_L-X_C)²)`

**120. Transformator** [SIM] ⭐
- `U₁/U₂ = N₁/N₂ = I₂/I₁`

**121. Elektromagnit to'lqinlar** [QISM]
- `c = λν` (yorug'lik tezligi = to'lqin uzunligi × chastota)

**122. Radioaloqa. Radiolokatsiya** [MATN]
- Modulyatsiya tushunchasi, radar: `s = ct/2` (masofa)

---

## 13-BO'LIM: OPTIKA

**123. Yorug'likning qaytishi** [SIM]
- Qaytish qonuni: `∠tushish = ∠qaytish`

**124. Yorug'likning sinishi** [SIM] ⭐
- Snellius qonuni: `sin α/sin β = n₂/n₁ = v₁/v₂`

**125. Yorug'likning to'lqin tabiati** [QISM]
- `c = λν`, `n = c/v`

**126. To'la ichki qaytish** [SIM]
- Chegaraviy burchak: `sin α_chegara = n₂/n₁` (n₁>n₂)

**127. Linzalar** [SIM]
- Optik kuch: `D = 1/F`

**129. Linza formulasi** [SIM] ⭐
- `1/F = 1/d + 1/f`
- Kattalashtirish: `Γ = f/d = H/h`

**130. Optik asboblar** [QISM]
- Mikroskop/teleskop kattalashtirishi — linza formulalari kombinatsiyasi

**132. Interferensiya** [SIM] ⭐
- Yorqin polosalar sharti: `Δ = kλ`
- Yung tajribasi: `Δx = λL/d`

**133. Difraksiya** [SIM]
- Difraksion panjara: `d·sinφ = kλ`

**134. Qutblanish** [SIM]
- Malyus qonuni: `I = I₀cos²α`

**135. Nisbiylik nazariyasi elementlari** [SIM]
- Vaqt dilatatsiyasi: `t = t₀/√(1-v²/c²)`
- Uzunlik qisqarishi: `l = l₀√(1-v²/c²)`

**136. Massa va energiya orasidagi bog'lanish** [SIM] ⭐
- `E = mc²`

**137. Nurlanish va yutilish spektrlari** [MATN]
- Chiziqli/uzluksiz spektrlar — tushunchaviy

**138. Yorug'lik kvantlari. Fotonlar** [SIM]
- `E = hν = hc/λ`, foton impulsi: `p = h/λ`

**139. Rentgen nurlari** [MATN]
- Yuqori chastotali elektromagnit nurlanish — tushunchaviy

**140. Fotoeffekt** [SIM] ⭐
- Eynshteyn tenglamasi: `hν = A_chiqish + E_k(max)`
- To'xtatuvchi kuchlanish: `eU₀ = E_k(max)`

---

## 14-BO'LIM: ATOM VA YADRO FIZIKASI

**141. Rezerford tajribasi. Bor postulatlari** [SIM]
- Bor radiusi: `r_n = n²r₁`
- Energiya sathlari: `E_n = -E₁/n²`

**142. Atom yadrosining tuzilishi. Radioaktivlik** [MATN]
- `A = Z + N` (massa soni = proton + neytron)

**143. Radioaktiv yemirilish qonuni** [SIM] ⭐
- `N = N₀·2^(-t/T)` yoki `N = N₀e^(-λt)`

**144. Yadroning bog'lanish energiyasi** [SIM]
- `E_bog' = Δmc²` (massa defekti orqali)

**145. Yadro reaksiyalari** [MATN]
- Reaksiya balansi: `Σ(massa/zaryad) chapda = Σ(massa/zaryad) o'ngda` — saqlanish qonunlari

---

## XULOSA VA STATISTIKA

**Jami mavzular**: 145
**Formulaga ega, simulyatsiyaga juda mos [SIM]**: ~88 mavzu
**Boshqa formulaning qismi sifatida ko'rsatiladigan [QISM]**: ~35 mavzu
**Faqat tushunchaviy, formula yo'q yoki kam [MATN]**: ~22 mavzu

### ⭐ belgisi qo'yilgan "eng kuchli simulyatsiya nomzodlari" (yakuniy tanlov, 30 ta):
F=ma, gorizontal/burchak ostida otilgan jism, impuls saqlanish, energiya saqlanish, prujinali/matematik mayatnik, rezonans, gidravlik press, Arximed kuchi, izojarayonlar, termodinamikaning I qonuni, issiqlik dvigatellari, Kulon qonuni, kondensatorlar ulanishi, Om qonuni (ikkala turi), Amper kuchi, Lorens kuchi, elektromagnit induksiya, Tomson formulasi, o'zgaruvchan tok zanjiri (to'liq), transformator, yorug'lik sinishi, linza formulasi, interferensiya, E=mc², fotoeffekt, radioaktiv yemirilish.

### Tavsiya (bosqichma-bosqich rivojlantirish uchun)
- **1-bosqich (MVP, 15 ta)**: avvalgi promptdagi Qism B ro'yxati
- **2-bosqich (keyingi 20 ta)**: yuqoridagi ⭐ belgili qolganlar
- **3-bosqich (qolgan [SIM] va [QISM], ~90 ta)**: to'liq kurs yakunlanadi
- **4-bosqich ([MATN], ~22 ta)**: bular uchun simulyatsiya shart emas — matn+rasm+video formatida ma'lumot sahifasi sifatida qoldirish tavsiya etiladi (masalan Rentgen nurlari, yarimo'tkazgichlar tuzilishi va h.k.)

*Manba: "Innova o'quv markazi" fizika test to'plami, S. Berdiyev, 2023. Formulalar standart O'rta Osiyo/Rossiya fizika kursi dasturiga asoslangan va kitob mundarijasidagi 145 mavzu nomlariga mos ravishda tuzilgan.*
