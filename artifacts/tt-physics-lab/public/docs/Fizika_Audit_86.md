# 86 simulyatsiya: fizik model auditi

Tekshiruv: barcha 86 sahifa brauzerda ochildi va asosiy parametr boshqaruvi ishladi; har model uchun standart, barcha minimum/maksimum va 15 ta aralash parametr holati uch vaqtda tekshirildi. Natijalarda faqat fizik ma’noli cheksizliklar (ishqalanishsiz to‘xtash masofasi/vaqti va linzaning fokusidagi tasvir) qabul qilindi. Mustaqil fizik invariantlar, 35 avtomatik test, ishlab chiqarish yig‘ilishi va tur tekshiruvi o‘tdi.

Bu kod modeli auditi; har bir idealizatsiyani haqiqiy asbob bilan o‘lchab kalibrlash yoki barcha 86 tajribaning pedagogik samaradorligini isbotlash emas. Modellardagi farazlar interfeysdagi «Model» bo‘limida ko‘rsatilgan.

| # | Simulyatsiya | Saytda ko‘rsatilgan asosiy formula |
|---:|---|---|
| 1 | Tekis o‘zgaruvchan harakat | `v=v_0+at` |
| 2 | Erkin tushish va gorizontal otilgan jism | `x=v_0t,\quad y=h_0-\frac{gt^2}{2}` |
| 3 | Nyutonning ikkinchi qonuni | `\vec{F}_{net}=m\vec{a}` |
| 4 | Sirpanish ishqalanish kuchi | `F_{ishq}=\mu N` |
| 5 | Gorizontga burchak ostida otilgan jism | `L=\frac{v_0^2\sin 2\alpha}{g}\quad(h_0=0)` |
| 6 | Mexanik energiyaning saqlanishi | `E_k+E_p=\mathrm{const}` |
| 7 | Prujinali mayatnik | `T=2\pi\sqrt{\frac{m}{k}}` |
| 8 | Rezonans | `A=\frac{F_0/m}{\sqrt{(\omega_0^2-\omega^2)^2+(2\beta\omega)^2}}` |
| 9 | Arximed kuchi | `F_A=\rho_f gV_{botgan}` |
| 10 | Ideal gaz holat tenglamasi | `pV=nRT` |
| 11 | Kulon qonuni | `\|F\|=k\frac{\|q_1q_2\|}{r^2}` |
| 12 | Zanjir qismi uchun Om qonuni | `I=\frac{U}{R}` |
| 13 | To‘liq zanjir uchun Om qonuni | `I=\frac{\varepsilon}{R+r}` |
| 14 | Elektromagnit induksiya. Lens qoidasi | `\varepsilon=-N\frac{d\Phi}{dt}` |
| 15 | Linza formulasi | `\frac1F=\frac1d+\frac1f` |
| 16 | Impuls va to‘qnashuv | `m_1v_1+m_2v_2=m_1u_1+m_2u_2` |
| 17 | Gidravlik press | `\frac{F_1}{F_2}=\frac{S_1}{S_2}=\frac{l_2}{l_1}` |
| 18 | Matematik mayatnik | `\ddot\theta+2\beta\dot\theta+(g/l)\sin\theta=0` |
| 19 | Izojarayonlar | `pV=nRT` |
| 20 | Termodinamikaning birinchi qonuni | `Q=\Delta U+A` |
| 21 | Issiqlik dvigateli va Karno chegarasi | `\eta=1-\frac{T_2}{T_1}` |
| 22 | Rezistorlarni ulash | `R_{ket}=R_1+R_2,\quad R_{par}=R_1R_2/(R_1+R_2)` |
| 23 | Amper kuchi | `F=BIl\sin\alpha` |
| 24 | Lorens kuchi | `F=qvB\sin\alpha,\quad R=\frac{mv}{qB}` |
| 25 | LC tebranish konturi | `T=2\pi\sqrt{LC}` |
| 26 | Transformator | `\frac{U_1}{U_2}=\frac{N_1}{N_2}=\frac{I_2}{I_1}` |
| 27 | Yorug‘lik sinishi | `n_1\sin\alpha=n_2\sin\beta` |
| 28 | Ikki tirqish interferensiyasi | `d\sin\theta=k\lambda` |
| 29 | Fotoeffekt | `h\nu=A+E_{k\max}` |
| 30 | Massa va energiya | `E=mc^2` |
| 31 | Radioaktiv yemirilish | `N=N_0e^{-\lambda t},\quad T_{1/2}=\frac{\ln2}{\lambda}` |
| 32 | Tekis harakat va trayektoriya | `x=x_0+vt` |
| 33 | Harakatning nisbiyligi | `\vec v=\vec v_1+\vec v_2` |
| 34 | Ikki jismning harakati | `x_1=v_1t,\quad x_2=d+v_2t` |
| 35 | Aylana bo‘ylab harakat | `a_n=\omega^2R,\quad a_t=\alpha R` |
| 36 | Aylanma harakatni uzatish | `R_1\omega_1=-R_2\omega_2` |
| 37 | Massa va zichlik | `\rho=m/V` |
| 38 | Nyutonning uchinchi qonuni | `\vec F_{12}=-\vec F_{21}` |
| 39 | Gravitatsiya va sun’iy yo‘ldosh | `g=GM/r^2,\quad v=\sqrt{GM/r}` |
| 40 | Elastiklik kuchi va prujina energiyasi | `F=kx,\quad E_p=kx^2/2` |
| 41 | Vazn va vaznsizlik | `N=m(g+a)` |
| 42 | Bir necha kuch ta’siri | `\vec F=\vec F_1+\vec F_2` |
| 43 | Og‘irlik markazi va richag muvozanati | `m_1gl_1=m_2gl_2` |
| 44 | Mexanik ish, quvvat va FIK | `A=Fs\cos\alpha,\quad P=A/t` |
| 45 | Gidrostatik va atmosfera bosimi | `p=p_0+\rho gh` |
| 46 | Tutash idishlar | `\rho_1h_1=\rho_2h_2` |
| 47 | Bernulli qonuni | `p+\rho v^2/2+\rho gh=\mathrm{const}` |
| 48 | Mexanik va tovush to‘lqinlari | `y=A\sin(2\pi ft-2\pi x/\lambda)` |
| 49 | To‘yingan bug‘ va namlik | `\varphi=100p_v/p_{sat}` |
| 50 | Kapillarlik va sirt taranglik | `h=2\sigma\cos\theta/(\rho gr)` |
| 51 | Qattiq jismning elastik deformatsiyasi | `\sigma=F/S,\quad \varepsilon=\sigma/E` |
| 52 | Issiqlikdan kengayish | `\Delta l=\alpha l_0\Delta T` |
| 53 | Issiqlik miqdori | `Q=mc\Delta T` |
| 54 | Adiabatik jarayon | `pV^\gamma=\mathrm{const},\quad TV^{\gamma-1}=\mathrm{const}` |
| 55 | Zaryadning saqlanishi | `q_1+q_2=\mathrm{const}` |
| 56 | Nuqtaviy zaryad maydoni va potensiali | `E=kq/r^2,\quad \varphi=kq/r` |
| 57 | Zaryadlangan shar va tekislik | `E_{shar}=kq/r^2,\quad E_{tekislik}=\sigma/(2\varepsilon_0)` |
| 58 | Bir jinsli maydonning ishi | `A=qEd,\quad U=Ed` |
| 59 | Kondensator va dielektrik | `C=\varepsilon_0\varepsilon_rS/d,\quad W=CU^2/2` |
| 60 | Kondensatorlarni ulash | `C_{par}=C_1+C_2,\quad C_{ket}=\frac{C_1C_2}{C_1+C_2}` |
| 61 | Elektr toki va zaryad oqimi | `I=\Delta q/\Delta t` |
| 62 | Tokning ishi va Joul–Lens issiqligi | `P=U^2/R,\quad Q=Pt` |
| 63 | Ampermetr shunti va voltmetr qo‘shimcha qarshiligi | `R_{sh}=R_m/(n-1),\quad R_{q}=R_m(n-1)` |
| 64 | Tok manbalarini ulash | `I=\frac{\varepsilon_{eq}}{R+r_{eq}}` |
| 65 | Metall qarshiligining haroratga bog‘liqligi | `R=R_0(1+\alpha\Delta T)` |
| 66 | Yarimo‘tkazgich diod | `I=I_s(e^{qU/(nk_BT)}-1)` |
| 67 | Vakuumdagi termoelektron emissiya | `j=A_RT^2e^{-W/(k_BT)}` |
| 68 | Suyuqliklarda tok va elektroliz | `m=\frac{MIt}{zF}` |
| 69 | Gazlarda elektr razryadi | `E=U/d` |
| 70 | Tokli simning magnit maydoni | `B=\mu_0I/(2\pi r)` |
| 71 | Moddaning magnit xossalari | `B=\mu_0\mu_rH` |
| 72 | Magnit oqimi | `\Phi=BS\cos\alpha` |
| 73 | O‘zinduksiya va magnit energiya | `I=\frac UR(1-e^{-Rt/L}),\quad W=LI^2/2` |
| 74 | O‘zgaruvchan tok generatori | `\varepsilon=NBS\omega\sin(\omega t)` |
| 75 | O‘zgaruvchan tokning RLC zanjiri | `Z=\sqrt{R^2+(\omega L-1/(\omega C))^2}` |
| 76 | Elektromagnit to‘lqin va radiolokatsiya | `c=\lambda f,\quad d=c\Delta t/2` |
| 77 | Yorug‘likning qaytishi | `\alpha=\beta` |
| 78 | Lupa va astronomik teleskop | `M_{lupa}=D/f,\quad \|M_{tel}\|=f_{obj}/f_{ok}` |
| 79 | Bir tirqishdagi difraksiya | `I/I_0=(\sin u/u)^2,\quad u=\pi a\sin\theta/\lambda` |
| 80 | Yorug‘likning qutblanishi | `I=I_0\cos^2\theta` |
| 81 | Maxsus nisbiylik | `\gamma=1/\sqrt{1-v^2/c^2}` |
| 82 | Foton energiyasi va impulsi | `E=hf=hc/\lambda,\quad p=h/\lambda` |
| 83 | Rentgen nurlarining qisqa to‘lqin chegarasi | `\lambda_{min}=hc/(eU)` |
| 84 | Bor modeli va atom spektrlari | `E_n=-13.6Z^2/n^2\;\mathrm{eV}` |
| 85 | Yadro tarkibi, bog‘lanish energiyasi va reaksiya | `E_b=\Delta mc^2` |
| 86 | Rezerford tajribasi | `\theta=2\arctan(kZze^2/(2Eb))` |

Tuzatilgan holatlar:

- To‘qnashuvning asosiy hisobida impuls endi kamaytirilgan massa va nisbiy tezlikdan olinadi. Ajralayotgan jismlarga soxta impuls berilmaydi.
- Ishqalanish nol bo‘lganda to‘xtash masofasi va vaqti 0 emas, ∞ bo‘ladi.
- Bernulli tenglamasi yaroqsiz manfiy absolut bosim chiqarsa, u fizik natija deb ko‘rsatilmaydi; ogohlantirish beriladi.

Chegaraviy holatlar: yupqa linza predmet fokusda bo‘lsa tasvir cheksizlikda; Karno chegarasi oshsa dvigatel ishini hisoblash rad etiladi; fotoeffekt qizil chegaradan pastda elektron chiqarmaydi.
