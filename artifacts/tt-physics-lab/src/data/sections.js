export const sections = [
  ["kinematika", "Kinematika", "Harakat, tezlik va trayektoriyalar", "motion"],
  ["dinamika", "Dinamika asoslari", "Kuchlar va ularning ta’siri", "force"],
  ["statika", "Statika", "Muvozanat va impuls", "balance"],
  [
    "energiya",
    "Ish, energiya, quvvat",
    "Energiya va uning almashinuvi",
    "energy",
  ],
  [
    "suyuqlik",
    "Suyuqlik va gazlar mexanikasi",
    "Bosim, oqim va ko‘taruvchi kuch",
    "fluid",
  ],
  [
    "tebranish",
    "Tebranish va to‘lqinlar",
    "Davriy harakat va rezonans",
    "wave",
  ],
  ["molekulyar", "Molekular fizika", "Zarrachalar va gaz qonunlari", "atom"],
  [
    "termodinamika",
    "Termodinamika asoslari",
    "Issiqlik va ichki energiya",
    "heat",
  ],
  ["elektrostatika", "Elektrostatika", "Zaryadlar va elektr maydon", "charge"],
  [
    "tok",
    "O‘zgarmas tok qonunlari",
    "Elektr zanjirlari va qarshilik",
    "circuit",
  ],
  [
    "muhit",
    "Turli muhitlarda elektr toki",
    "O‘tkazuvchanlik va materiallar",
    "material",
  ],
  [
    "elektromagnit",
    "Elektromagnit hodisalar",
    "Magnit maydon va induksiya",
    "magnet",
  ],
  [
    "elektro-tebranish",
    "Elektromagnit tebranishlar",
    "Konturlar, to‘lqinlar va aloqa",
    "signal",
  ],
  ["optika", "Optika", "Yorug‘lik, nurlar va linzalar", "lens"],
  [
    "yadro",
    "Nisbiylik, atom va yadro fizikasi",
    "Mikroolam va energiya",
    "nucleus",
  ],
].map(([id, title, description, icon], i) => ({
  id,
  title,
  description,
  icon,
  index: i + 1,
}));
export function sectionFor(n) {
  if (n <= 13) return "kinematika";
  if (n <= 29) return "dinamika";
  if (n <= 33) return "statika";
  if (n <= 41) return "energiya";
  if (n <= 48) return "suyuqlik";
  if (n <= 56) return "tebranish";
  if (n <= 70) return "molekulyar";
  if (n <= 76) return "termodinamika";
  if (n <= 88) return "elektrostatika";
  if (n <= 97) return "tok";
  if (n <= 103) return "muhit";
  if (n <= 111) return "elektromagnit";
  if (n <= 122) return "elektro-tebranish";
  if (n <= 134 || n === 137 || n === 139) return "optika";
  return "yadro";
}
