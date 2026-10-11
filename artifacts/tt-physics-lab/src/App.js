import { coachMarkup, mountExperimentCoach } from "./components/ExperimentCoach.js";
import "./components/ExperimentCoach.css";
import { liveEquation } from "./components/LiveEquation.js";
import { everydayExamples, engineeringUses } from "./data/real-world.js";
import { uz, paramNames, resultNames } from "./i18n/uz.js";
import { allConfigs, defaults } from "./data/configs.js";
import { topicNavigation } from "./data/topic-navigation.js";
import { nuclearReactionVariant } from "./data/nuclear-reaction.js";
import { nuclearBindingVariant } from "./data/nuclear-binding.js";
import { nucleusRadioactivityVariant } from "./data/nucleus-radioactivity.js";
import { bohrSpectraVariant } from "./data/bohr-spectra.js";
import { centerOfMassVariant } from "./data/center-of-mass.js";
import { atmospherePressureVariant } from "./data/atmosphere-pressure.js";
import { heatEngineCycleVariant } from "./data/heat-engine-cycle.js";
import { transformerInductionVariant } from "./data/transformer-induction.js";
import { xrayTubeVariant } from "./data/xray-tube.js";
import { photoelectricVariant } from "./data/photoelectric.js";
import { waterVaporVariant } from "./data/water-vapor.js";
import { airHumidityVariant } from "./data/air-humidity.js";
import { lampCircuitVariant } from "./data/lamp-circuit.js";
import { isTopicCompleted, isConfigCompleted, isCurrentCompleted, toggleCompletion } from "./data/completion.js";
import { sections, sectionFor } from "./data/sections.js";
import { icon } from "./components/icons.js";
import { formula } from "./components/FormulaDisplay.js";
import { parameterSlider } from "./components/ParameterSlider.js";
import { levelTabs } from "./components/LevelTabs.js";
import { format, formatResult, NO_VALUE } from "./components/ResultCard.js";
import { SimulationCanvas } from "./components/SimulationCanvas.js";
import { LiveChart } from "./components/LiveChart.js";
import { attachMagnet } from "./components/Magnet.jsx";
import "./components/FloatingLines.css";
import { mountVirtualInstruments } from "./components/VirtualInstruments.js";
import "./components/VirtualInstruments.css";
import { mountEnergyBar } from "./components/EnergyBar.js";
import "./components/EnergyBar.css";
import { mountChallengeMode } from "./components/ChallengeMode.js";
import "./components/ChallengeMode.css";
import { mountReportExport } from "./components/ReportExport.js";
import "./components/ReportExport.css";

const app = document.querySelector("#app");
/**
 * Moves keyboard focus without yanking the viewport around. Used for the skip
 * link and for every client side route change so focus is never left on a
 * removed node.
 */
const focusTarget = (selector) => {
  const target =
    (selector && document.querySelector(selector)) || document.querySelector("#main");
  if (!target || typeof target.focus !== "function") return false;
  if (target.id === "main" && !target.hasAttribute("tabindex"))
    target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  return document.activeElement === target;
};
const replaceHash = (hash) => {
  try {
    history.replaceState(null, "", hash);
  } catch {
    location.hash = hash;
  }
};
/**
 * The skip link lives outside #app, so it survives every render. It targets the
 * router-managed #main element, which is not a route: without this the browser
 * would turn "#main" into a hash route and unmount the current page.
 */
function setupSkipLink() {
  const skip = document.querySelector(".skip");
  if (!skip || skip.dataset.ttSkipBound) return;
  skip.dataset.ttSkipBound = "1";
  skip.addEventListener("click", (event) => {
    if (!document.querySelector("#main")) return;
    event.preventDefault();
    focusTarget("#main");
    window.scrollTo(0, 0);
  });
}
setupSkipLink();
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/[‘’ʻʼ']/g, "")
    .normalize("NFKD");
const saved = {};
function read(key, fallback) {
  if (Object.hasOwn(saved, key)) return saved[key];
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return saved[key] ?? fallback;
  }
}
function write(key, value) {
  saved[key] = value;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* session fallback */
  }
}
const storedCompleted = read("tt-completed", []);
// Buzilgan yoki eski saqlash formati sahifaning ochilishiga to‘sqinlik qilmasin.
let completed = new Set(Array.isArray(storedCompleted) ? storedCompleted.filter(id => typeof id === "string") : []),
  cleanup = () => {},
  headerCleanup = () => {},
  currentRoute = "",
  routeGeneration = 0,
  firstRoute = true,
  pendingRouteFocus = "#main";
const simSessions = new Map();
let catalogFailed = false;
const topics = await fetch(new URL("./data/topics.json", import.meta.url))
  .then((r) => {
    if (!r.ok) throw new Error(uz.catalogError);
    return r.json();
  })
  .catch((error) => {
    catalogFailed = true;
    console.error("Catalog load failed:", error);
    return [];
  });
topics.forEach((t) => {
  t.section = sectionFor(t.number);
  t.sim = allConfigs.find((s) => s.topicNumbers.includes(t.number));
});
const brand = () =>
  `<a class="brand" href="#/" aria-label="${uz.homeBrand}"><svg class="tt-logo-mark" viewBox="11 10 53 37" aria-hidden="true"><path d="M11 10h27l-3 9h-6v28h-9V19h-9V10zM42 10h22l-4 9h-5v28H45V19h-6l3-9z" fill="#E54519"/></svg><span class="brand-name"><span class="brand-logo-text"><span class="line-1"><span class="solid">TASHKENT</span><span class="space">&nbsp;</span><span class="outline">UNIVERSITY</span></span><span class="line-2"><span class="outline">OF</span><span class="space">&nbsp;</span><span class="solid">TECH</span><span class="outline">NOLOGY</span></span></span><small class="brand-sub">PHYSICS LAB</small></span></a>`;
const sectionName = (id) => sections.find((s) => s.id === id)?.title || "";
const simLink = (c, topic) => `#/sim/${c.id}${topic ? '?topic='+topic : ''}`;
const resultLabel = (c, key) => c.results.find(r => r.key === key)?.label || resultNames[key] || key;
function topicConfig(c, number) {
  const topic = topics.find(t => t.number === Number(number) && t.sim?.key === c.key);
  if (!topic) return c;
  if (c.key === "vapor" && topic.number === 66) {
    return { ...waterVaporVariant(c), topicNumber: topic.number, topicTitle: topic.title, topicNotes: topic.notes };
  }
  if (c.key === "vapor" && topic.number === 67) {
    return { ...airHumidityVariant(c), topicNumber: topic.number, topicTitle: topic.title, topicNotes: topic.notes };
  }
  if (c.key === "binding" && topic.number === 145) {
    return { ...nuclearReactionVariant(c), topicNumber: topic.number, topicTitle: topic.title, topicNotes: topic.notes };
  }
  if (c.key === "binding" && topic.number === 144) {
    return { ...nuclearBindingVariant(c), topicNumber: topic.number, topicTitle: topic.title, topicNotes: topic.notes };
  }
  if (c.key === "binding" && topic.number === 142) {
    return { ...nucleusRadioactivityVariant(c), topicNumber: topic.number, topicTitle: topic.title, topicNotes: topic.notes };
  }
  if (c.key === "bohr" && topic.number === 137) {
    return { ...bohrSpectraVariant(c), topicNumber: topic.number, topicTitle: topic.title, topicNotes: topic.notes };
  }
  if (c.key === "lever" && topic.number === 30) {
    return { ...centerOfMassVariant(c), title: topic.title, topicNumber: topic.number, topicTitle: topic.title, topicNotes: topic.notes };
  }
  if (c.key === "pressure" && topic.number === 45) {
    return { ...atmospherePressureVariant(c), title: topic.title, topicNumber: topic.number, topicTitle: topic.title, topicNotes: topic.notes };
  }
  if (c.key === "heatEngine" && topic.number === 76) {
    return { ...heatEngineCycleVariant(c), title: topic.title, topicNumber: topic.number, topicTitle: topic.title, topicNotes: topic.notes };
  }
  if (c.key === "transformer" && topic.number === 120) {
    return { ...transformerInductionVariant(c), title: topic.title, topicNumber: topic.number, topicTitle: topic.title, topicNotes: topic.notes };
  }
  if (c.key === "xray" && topic.number === 139) {
    return { ...xrayTubeVariant(c), title: topic.title, topicNumber: topic.number, topicTitle: topic.title, topicNotes: topic.notes };
  }
  if (c.key === "photoelectric" && topic.number === 140) {
    return { ...photoelectricVariant(c), title: topic.title, topicNumber: topic.number, topicTitle: topic.title, topicNotes: topic.notes };
  }
  if (c.key === "network" && topic.number === 95) {
    return { ...lampCircuitVariant(c), topicNumber: topic.number, topicTitle: topic.title, topicNotes: topic.notes };
  }
  // Birgalikdagi laboratoriyada tanlangan mavzuga mos boshlang‘ich rejim ochiladi.
  const mode = {116:0,117:1,118:2,119:3,95:1}[topic.number];
  const initial = {...c.defaults};
  if (mode !== undefined) initial.mode = mode;
  if (topic.number === 72) initial.process = 1;
  if (c.key === "elevator") initial.a = topic.number === 22 ? -9.8 : 2;
  return {...c, defaults:initial, topicNumber:topic.number, topicTitle:topic.title, topicNotes:topic.notes};
}
const primaryNav = [
  { label: uz.nav[0], href: "#/" },
  { label: uz.nav[1], href: "#/topics" },
  { label: uz.nav[2], href: "#/sections" },
  { label: uz.nav[3], href: "#/progress" },
  { label: uz.nav[4], href: "#/about" },
];
const navHref = (active) => `#/${active === "home" ? "" : active}`;
function legendFor(c) {
  const red = "#e05757",
    blue = "#3883d9",
    green = "#19a378",
    orange = "#F1592A";
  const vectors = {
    motion: [
      [blue, uz.velocity],
      [green, uz.acceleration],
    ],
    newton: [
      [red, uz.force],
      [blue, uz.velocity],
      [green, uz.acceleration],
    ],
    friction: [
      [red, uz.force],
      [blue, uz.velocity],
      [green, uz.acceleration],
    ],
    fall: [[blue, uz.velocity]],
    projectile: [[blue, uz.velocity]],
    energy: [
      [orange, uz.energyLabels[0]],
      [blue, uz.energyLabels[1]],
      ["#b18b4d", uz.energyLabels[2]],
    ],
    spring: [[blue, uz.displacement]],
    resonance: [[red, uz.force]],
    buoyancy: [
      [blue, uz.buoyancyForce],
      [red, uz.gravityForce],
    ],
    gas: [[blue, uz.molecules]],
    coulomb: [[red, uz.force]],
    ohm: [[orange, uz.currentDirection]],
    circuit: [[orange, uz.currentDirection]],
    induction: [
      [blue, uz.velocity],
      [red, uz.inducedCurrent],
    ],
    lens: [
      [orange, uz.parallelRay],
      [green, uz.centralRay],
      [blue, uz.image],
    ],
  };
  return (vectors[c.key] || [[orange, 'Model'], [blue, 'O‘lchov / maydon']])
    .map(
      ([color, label]) =>
        `<span><i style="background:${color}"></i>${label}</span>`,
    )
    .join("");
}
function setupHeaderSearch() {
  const toggle = document.querySelector(".header-search-toggle");
  toggle.onclick = () => {
    const previous = document.querySelector(".header-search-panel");
    if (previous) {
      previous.remove();
      toggle.setAttribute("aria-expanded", "false");
      return;
    }
    const panel = document.createElement("form");
    panel.className = "header-search-panel";
    panel.id = "header-search-panel";
    panel.setAttribute("role", "search");
    panel.innerHTML = `<div class="search-field">${icon("search")}<input type="search" aria-label="${uz.searchLabel}" placeholder="${uz.search}"><button type="button" class="icon-button close-search" aria-label="${uz.closeSearch}">${icon("close")}</button></div><div class="header-search-results"></div>`;
    document.querySelector(".header").append(panel);
    toggle.setAttribute("aria-expanded", "true");
    const input = panel.querySelector("input"),
      results = panel.querySelector(".header-search-results");
    const search = () => {
      const q = normalize(input.value),
        matches = topics
          .filter((t) => normalize(t.title + " " + t.notes).includes(q))
          .slice(0, 6);
      results.innerHTML =
        matches
          .map(
            (t) =>
              `<a href="${t.sim ? simLink(t.sim, t.number) : "#/topic/" + t.number}"><span>${escape(t.title)}</span><small>${t.sim ? uz.ready : uz.soon}</small></a>`,
          )
          .join("") || `<p>${uz.noResults}</p>`;
    };
    panel.onsubmit = (e) => {
      e.preventDefault();
      location.hash = "/topics?q=" + encodeURIComponent(input.value);
      panel.remove();
      toggle.setAttribute("aria-expanded", "false");
    };
    panel.querySelector(".close-search").onclick = () => {
      panel.remove();
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    };
    input.oninput = search;
    input.onkeydown = (e) => {
      if (e.key === "Escape") panel.querySelector(".close-search").click();
    };
    search();
    input.focus();
  };
}
function setupHeaderNavigation() {
  const toggle = document.querySelector(".menu-button"),
    nav = document.querySelector(".nav");
  if (!toggle || !nav) return () => {};
  const close = () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = icon("menu");
  };
  const clickToggle = () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.innerHTML = icon(open ? "close" : "menu");
  };
  const clickOutside = (event) => {
    const path = event.composedPath();
    if (!nav.classList.contains("open") || path.includes(toggle) || path.includes(nav)) return;
    close();
  };
  const keydown = (event) => {
    if (event.key !== "Escape" || !nav.classList.contains("open")) return;
    close();
    toggle.focus();
  };

  toggle.onclick = clickToggle;
  nav.addEventListener("click", close);
  document.addEventListener("click", clickOutside);
  document.addEventListener("keydown", keydown);
  return () => {
    toggle.onclick = null;
    nav.removeEventListener("click", close);
    document.removeEventListener("click", clickOutside);
    document.removeEventListener("keydown", keydown);
  };
}
function header(active = "home") {
  const currentHref = navHref(active),
    navigation = primaryNav
      .map(({ label, href }) => `<a href="${href}"${href === currentHref ? ' class="active" aria-current="page"' : ""}>${label}</a>`)
      .join("");
  return `<div class="topbar"><div class="container"><span>${uz.brand}</span><a href="https://tashkenttech-edu.uz/" target="_blank" rel="noopener">${uz.university} ↗</a></div></div><header class="header"><div class="container header-inner">${brand()}<nav class="nav" id="primary-navigation" aria-label="${uz.mainNav}">${navigation}</nav><div class="header-actions"><button type="button" class="icon-button header-search-toggle" aria-label="${uz.searchLabel}" aria-controls="header-search-panel" aria-expanded="false">${icon("search")}</button><span class="language" lang="uz">UZ</span><span class="header-lab-magnet"><a class="header-lab" href="${simLink(allConfigs.find((c) => c.key === "newton"))}"><span>${uz.start}</span>${icon("arrow")}</a></span><button type="button" class="icon-button menu-button" aria-label="Menyuni ochish" aria-controls="primary-navigation" aria-expanded="false">${icon("menu")}</button></div></div></header>`;
}
function footer() {
  return `<footer><div class="container footer-top"><div>${brand()}<p>${uz.footerText}</p></div><div><span class="eyebrow">PHYSICS LAB</span><a href="#/topics">${uz.browse}</a><a href="#/about">${uz.nav[4]}</a></div><div><span class="eyebrow">TASHKENT TECH</span><a href="https://tashkenttech-edu.uz/" target="_blank" rel="noopener">${uz.university} ↗</a><a href="mailto:info@tashkenttech-edu.uz">info@tashkenttech-edu.uz</a></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} ${uz.footerSub}</span><span>${uz.source}</span></div></footer>`;
}
function shell(body, active = "home") {
  headerCleanup();
  headerCleanup = () => {};
  app.innerHTML =
    header(active) + `<main id="main" tabindex="-1">${body}</main>` + footer();
  const navigationCleanup = setupHeaderNavigation();
  const magnetCleanup = attachMagnet(
    document.querySelector(".header-lab-magnet"),
    { padding: 50, magnetStrength: 32 },
  );
  headerCleanup = () => {
    navigationCleanup();
    magnetCleanup();
  };
  setupHeaderSearch();
}
function artwork(key) {
  let art = "";
  if (["newton", "motion", "friction"].includes(key))
    art =
      '<path d="M20 112H300" stroke="#a4b5c1"/><path d="M56 112V60h53v52" fill="#F1592A"/><path d="M115 86h100m-12-10 12 10-12 10" stroke="#e3594a" stroke-width="3"/><path d="M44 68H20m21 13H10m28 14H24" stroke="#b4c2ce"/><text x="78" y="93" fill="white">m</text><text x="227" y="90" fill="#F1592A">F</text>';
  else if (["projectile", "fall"].includes(key))
    art =
      '<path d="M24 123h275" stroke="#a4b5c1"/><path d="M35 120Q153-74 282 120" fill="none" stroke="#F1592A" stroke-width="2.5" stroke-dasharray="5 5"/><path d="M35 120Q92 36 130 30" fill="none" stroke="#F1592A" stroke-width="3"/><circle cx="132" cy="31" r="11" fill="#F1592A"/><path d="m133 31 48-14m-10-3 10 3-6 8" fill="none" stroke="#3883d9" stroke-width="2"/>';
  else if (["spring", "resonance"].includes(key))
    art =
      '<path d="M62 18h65m-32 0v15l-14 6 27 10-27 10 27 10-27 10 14 6v14" fill="none" stroke="#7d93a5" stroke-width="2.5"/><rect x="74" y="99" width="44" height="33" rx="4" fill="#F1592A"/><path d="M160 80q16-70 32 0t32 0t32 0t32 0" fill="none" stroke="#F1592A" stroke-width="2"/><path d="M148 80h158" stroke="#bdc9d2" stroke-dasharray="3 4"/>';
  else if (key === "energy")
    art =
      '<path d="M20 36Q160 226 300 36" fill="none" stroke="#95aabd" stroke-width="4"/><circle cx="88" cy="105" r="12" fill="#F1592A"/><path d="M160 135v16M70 98v53M250 98v53" stroke="#becbd4"/><rect x="128" y="20" width="15" height="42" rx="3" fill="#F1592A"/><rect x="152" y="35" width="15" height="27" rx="3" fill="#3883d9"/>';
  else if (key === "lens")
    art =
      '<ellipse cx="160" cy="80" rx="12" ry="65" fill="#3883d915" stroke="#3883d9"/><path d="M20 90h280" stroke="#9db1bf"/><path d="M65 90V44m-6 8 6-8 6 8M65 44h95l120 74" fill="none" stroke="#F1592A" stroke-width="2"/><path d="M65 44 280 118" stroke="#19a378" stroke-width="2"/><path d="M250 90v15" stroke="#3883d9" stroke-width="3"/>';
  else if (["ohm", "circuit", "induction"].includes(key))
    art =
      '<path d="M70 73V32h182v89H70V87" fill="none" stroke="#8096a8" stroke-width="2.5"/><path d="M59 73h22m-17 14h12" stroke="#F1592A" stroke-width="3"/><rect x="145" y="22" width="45" height="20" rx="3" fill="#F1592A"/><circle cx="252" cy="79" r="22" fill="#ffc65733" stroke="#d6a346"/><path d="m241 68 22 22m-22 0 22-22" stroke="#d6a346"/>';
  else if (key === "buoyancy")
    art =
      '<path d="M70 25v108h180V25" fill="none" stroke="#8aa5ba" stroke-width="3"/><path d="M70 65h180v68H70z" fill="#3883d921"/><rect x="130" y="43" width="53" height="53" rx="4" fill="#F1592A"/><path d="M105 98V53m-6 8 6-8 6 8" fill="none" stroke="#3883d9" stroke-width="2.5"/>';
  else if (key === "coulomb")
    art =
      '<circle cx="89" cy="80" r="28" fill="#F1592A"/><circle cx="230" cy="80" r="28" fill="#3883d9"/><path d="M77 80h24m-12-12v24m129-12h24" stroke="white" stroke-width="3"/><path d="M120 80h32m-7-7 7 7-7 7m54-7h-32m7-7-7 7 7 7" stroke="#e3594a" fill="none" stroke-width="2"/>';
  else
    art =
      '<rect x="73" y="20" width="176" height="115" rx="5" fill="#3883d908" stroke="#91aabd" stroke-width="2"/>' +
      Array.from(
        { length: 20 },
        (_, i) =>
          `<circle cx="${89 + ((i * 37) % 145)}" cy="${35 + ((i * 29) % 85)}" r="4" fill="${i % 3 ? "#6093b7" : "#F1592A"}"/>`,
      ).join("");
  return `<svg class="sim-art" viewBox="0 0 320 154" aria-hidden="true">${art}</svg>`;
}
function card(c, index = 0, featured = false) {
  return `<a class="sim-card${featured ? " electric-card" : ""}" href="${simLink(c)}"><div class="sim-card-visual tint-${index % 4}"><span class="mini-index">${String(allConfigs.indexOf(c) + 1).padStart(2, "0")} / ${uz.experimentLabel}</span>${artwork(c.key)}<span class="ready-tag"><i></i>${uz.ready}</span></div><div class="sim-card-body"><span class="card-category">${sectionName(c.section)}</span><h3>${c.title}</h3><p>${c.key === "electrolysis" ? "Tok kuchi va vaqt ajralgan modda miqdoriga qanday ta’sir qilishini kuzating." : c.description}</p><div class="card-foot"><span class="small-formula">${formula(c.formulaLatex)}</span><span class="card-arrow">${icon("arrow")}</span></div></div></a>`;
}
function sectionCards() {
  return sections
    .map((s) => {
      const count = topics.filter((t) => t.section === s.id).length,
        ready = allConfigs.filter((c) => c.section === s.id).length;
      return `<a class="section-card" href="#/topics?section=${s.id}"><span class="section-icon">${icon(s.icon)}</span><div><h3>${s.title}</h3><p>${count} ${uz.topics} <span>·</span> ${ready ? `${ready} ${uz.simulations}` : uz.soon}</p></div>${icon("chevron")}</a>`;
    })
    .join("");
}
async function home(generation) {
  const newton = allConfigs.find((c) => c.key === "newton");
  const featuredKeys = ["newton", "projectile", "spring", "energy", "ohm", "lens"];
  const stories = [
    {
      key: "newton",
      heading: "Kuchdan harakatgacha",
      description: "Kuch, massa va ishqalanishni bir maydonda boshqaring. Har bir o‘zgarish tezlanish va natijaviy kuchda darhol ko‘rinadi.",
      params: ["Massa", "Kuch", "Ishqalanish"],
    },
    {
      key: "projectile",
      heading: "Trayektoriyani oldindan ko‘ring",
      description: "Tezlik va burchakni taqqoslab, uchish vaqti, maksimal balandlik va masofaning qanday bog‘lanishini kuzating.",
      params: ["Otish burchagi", "Boshlang‘ich tezlik", "Balandlik"],
    },
    {
      key: "energy",
      heading: "Energiya shaklini o‘zgartiradi",
      description: "Kinetik va potensial energiya almashinuvini animatsiya hamda grafik orqali bitta vaqt chizig‘ida tahlil qiling.",
      params: ["Boshlang‘ich balandlik", "Massa", "Ishqalanish"],
    },
    {
      key: "resonance",
      heading: "Tebranishni chuqurroq tushuning",
      description: "Chastota va so‘nishni o‘zgartirib, rezonans cho‘qqisi qachon va nima sababdan paydo bo‘lishini aniqlang.",
      params: ["Chastota", "Tabiiy chastota", "So‘nish"],
    },
  ].map((story, index) => {
    const config = allConfigs.find((item) => item.key === story.key);
    return {
      ...story,
      index,
      lab: config.title,
      eyebrow: sectionName(config.section).toUpperCase(),
      href: simLink(config),
      formula: formula(config.formulaLatex),
      art: artwork(config.key),
    };
  });

  shell(`<div id="linear-home-root"></div>`);
  const homeProps = {
    copy: {
      heroTitle: uz.heroTitle,
      heroAccent: uz.heroAccent,
      heroText: uz.heroText,
      start: uz.start,
      browse: uz.browse,
      how: uz.how,
    },
    links: {
      start: simLink(newton),
      topics: "#/topics",
      ready: "#/topics?ready=1",
    },
    preview: {
      href: simLink(newton),
      formula: formula(newton.formulaLatex),
      art: artwork(newton.key),
    },
    stats: [
      [String(allConfigs.length), uz.simulations],
      ["143", uz.topics],
      ["15", uz.sections],
      ["3", uz.learningLevels],
    ],
    features: stories,
    featuredCardsHtml: featuredKeys
      .map((key, index) => card(allConfigs.find((item) => item.key === key), index, false))
      .join(""),
  };
  try {
    const { mountHomeExperience } = await import("./components/HomeExperience.jsx");
    if (generation !== routeGeneration) return;
    cleanup = mountHomeExperience(document.querySelector("#linear-home-root"), homeProps);
  } catch (error) {
    console.error("Bosh sahifa yuklanmadi:", error);
    if (generation === routeGeneration) {
      shell(`<section class="container page-heading"><h1>Sahifa yuklanmadi</h1><p>Qayta yuklab ko‘ring.</p><a class="button primary" href="#/topics">Mavzularga o‘tish</a></section>`, "home");
    }
  }
}
function catalog(query) {
  const filter = new URLSearchParams(query),
    section = sections.some(s => s.id === filter.get("section")) ? filter.get("section") : "",
    ready = filter.get("ready") === "1";
  shell(
    `<section class="page-heading container"><div class="breadcrumb"><a href="#/">${uz.home}</a><span>/</span>${uz.nav[1]}</div><span class="eyebrow orange">${uz.libraryLabel}</span><h1>${uz.catalogTitle}</h1><p>${uz.catalogText}</p></section><div class="container catalog-layout"><aside class="catalog-sidebar"><h3>${uz.nav[2]}</h3><a class="${!section ? "selected" : ""}" href="#/topics"${!section ? ' aria-current="page"' : ""}>${icon("grid")}${uz.all}<span>143</span></a>${sections
      .map(
        (s) =>
          `<details ${s.id === section ? "open" : ""}><summary><a href="#/topics?section=${s.id}"${s.id === section ? ' aria-current="page"' : ""}>${s.title}</a><span>${topics.filter((t) => t.section === s.id).length}</span></summary><div>${topics
            .filter((t) => t.section === s.id)
            .map(
              (t) =>
                `<a href="${t.sim ? simLink(t.sim, t.number) : "#/topic/" + t.number}">${t.number}. ${escape(t.title)}${t.sim ? '<i class="topic-dot"></i>' : ""}</a>`,
            )
            .join("")}</div></details>`,
      )
      .join(
        "",
      )}</aside><section class="catalog-main"><div class="catalog-tools"><div class="search-field">${icon("search")}<input id="catalog-search" type="search" placeholder="${uz.search}" aria-label="${uz.searchLabel}" value="${escape(filter.get("q") || "")}"><kbd>/</kbd></div><label class="ready-filter"><input id="ready-filter" type="checkbox" ${ready ? "checked" : ""}>${uz.onlyReady}</label></div><div class="catalog-sub"><h2>${section ? sectionName(section) : uz.browse}</h2><span id="search-count"></span></div><div id="catalog-results"></div></section></div>`,
    "topics",
  );
  const render = () => {
    const q = normalize(document.querySelector("#catalog-search").value),
      only = document.querySelector("#ready-filter").checked;
    // Orqaga qaytilganda qidiruv va filtrlar havoladan qayta tiklanadi.
    const search = new URLSearchParams();
    if (section) search.set("section", section);
    const text = document.querySelector("#catalog-search").value;
    if (text) search.set("q", text);
    if (only) search.set("ready", "1");
    currentRoute = "/topics" + (search.size ? "?" + search.toString() : "");
    replaceHash("#" + currentRoute);
    const found = topics.filter(
      (t) =>
        (!section || t.section === section) &&
        (!only || t.sim) &&
        normalize(
          t.title + " " + t.notes + " " + (t.sim?.formulaLatex || ""),
        ).includes(q),
    );
    document.querySelector("#search-count").textContent =
      `${found.length} ${uz.topics}`;
    document.querySelector("#catalog-results").innerHTML = found.length
      ? `<div class="topic-list">${found.map((t) => `<a class="topic-row" href="${t.sim ? simLink(t.sim, t.number) : "#/topic/" + t.number}"><span class="topic-number">${String(t.number).padStart(2, "0")}</span><span class="topic-row-icon">${icon(t.sim?.icon || sections.find((s) => s.id === t.section).icon)}</span><div><span class="card-category">${sectionName(t.section)}</span><h3>${escape(t.title)}</h3></div><span class="status ${t.sim ? "available" : ""}">${t.sim ? (isTopicCompleted(t, completed) ? uz.completed : uz.ready) : uz.soon}</span>${icon("chevron")}</a>`).join("")}</div>`
      : `<div class="empty-state">${icon("search")}<h2>${uz.noResults}</h2><p>${uz.trySearch}</p><button class="button secondary" id="clear-search">${uz.clearFilters}</button></div>`;
    document.querySelector("#clear-search")?.addEventListener("click", () => {
      document.querySelector("#catalog-search").value = "";
      document.querySelector("#ready-filter").checked = false;
      render();
    });
  };
  document.querySelector("#catalog-search").oninput = render;
  document.querySelector("#ready-filter").onchange = render;
  render();
}
const experimentTasks = {
  motion: "Tezlanishni o‘zgartiring va tezlik bilan koordinata grafigini taqqoslang.",
  fall: "Balandlik yoki boshlang‘ich tezlikni o‘zgartirib, tushish vaqti va masofani kuzating.",
  newton: "Kuch yoki massani o‘zgartirib, tezlanish qaysi nisbatda o‘zgarishini toping.",
  friction: "Sirtni almashtiring va qutining to‘xtash masofasini solishtiring.",
  projectile: "Otish burchagini o‘zgartirib, eng uzoq trayektoriyani toping.",
  energy: "Balandlikni o‘zgartiring va energiyaning bir turdan boshqasiga o‘tishini kuzating.",
  spring: "Massa yoki qattiqlikni o‘zgartirib, tebranish davrini taqqoslang.",
  resonance: "Majburlovchi chastotani tabiiy chastotaga yaqinlashtirib, cho‘qqini toping.",
  buoyancy: "Jism va suyuqlik zichligini o‘zgartirib, suzish holatini aniqlang.",
  gas: "Harorat yoki hajmni o‘zgartirib, bosim qanday javob berishini kuzating.",
  coulomb: "Zaryadlar masofasini o‘zgartirib, kuchning kamayish tezligini tekshiring.",
  ohm: "Kuchlanish yoki qarshilikni o‘zgartirib, tok kuchini taqqoslang.",
  circuit: "Tashqi qarshilikni o‘zgartirib, tok va foydali ish koeffitsiyentini kuzating.",
  induction: "Magnit tezligi yoki o‘ramlar sonini o‘zgartirib, EYUKni kuzating.",
  lens: "Predmetni fokusga yaqinlashtirib, tasvir masofasi va turini kuzating.",
};
const experimentFocus = {
  motion: "a",
  fall: "h",
  newton: "force",
  friction: "mu",
  projectile: "angle",
  energy: "h",
  spring: "m",
  resonance: "frequency",
  buoyancy: "rho",
  gas: "temperature",
  coulomb: "r",
  ohm: "voltage",
  circuit: "resistance",
  induction: "speed",
  lens: "object",
};

const experimentTools = (c, params) => {
  const focus =
      params.find((param) => param.key === experimentFocus[c.key]) || params[0],
    span = focus ? focus.max - focus.min : 0,
    presets = focus
      ? [
          ["Standart", focus.value],
          ["Past", focus.min + span * 0.25],
          ["Yuqori", focus.min + span * 0.75],
        ]
      : [];
  // Generate prediction-based insight
  let predictionInsight = "";
  if (focus) {
    predictionInsight = `<div class="lab-insight"><strong>${uz.predictionInsight}:</strong> ${
      focus.key === "mu"
        ? uz.frictionMuInsight
        : focus.key === "g"
          ? uz.gravityInsight
          : focus.key === "v0"
            ? uz.velocityInsight
            : focus.key === "h"
              ? uz.heightInsight
              : ""
    }</div>`;
  }
  return `<section class="lab-tools" aria-label="Tajriba yordamchilari"><div class="lab-tool preset-tool"><div><span class="eyebrow orange">TAYYOR HOLATLAR</span><p>${focus ? `${focus.label} uchun tez sozlamalar` : "Tayyor sozlamalar"}</p></div><div class="tool-actions">${presets.map(([label, value]) => `<button type="button" class="tool-chip" data-preset-key="${focus.key}" data-preset-value="${value}">${label}</button>`).join("")}</div></div><div class="lab-tool prediction-tool"><div><span class="eyebrow">AVVAL TAXMIN QILING</span><p>${resultLabel(c, c.results[0]?.key)} qanday o‘zgaradi?</p></div><div class="tool-actions"><button type="button" class="tool-chip" data-prediction="up">Ortadi</button><button type="button" class="tool-chip" data-prediction="down">Kamayadi</button><button type="button" class="tool-chip" data-prediction="same">O‘zgarmaydi</button></div><strong id="prediction-feedback" class="tool-feedback" aria-live="polite"></strong>${predictionInsight}</div><div class="lab-tool compare-tool"><div><span class="eyebrow">SOLISHTIRISH</span><p>Joriy natija va grafikni saqlang</p></div><div class="tool-actions"><button type="button" class="tool-chip active" id="save-snapshot">+ Natijani saqlash</button><button type="button" class="tool-chip" id="clear-snapshots">Tozalash</button></div><div id="snapshot-list" class="snapshot-list" aria-live="polite"></div></div><div class="lab-tool real-example"><span class="eyebrow">REAL HAYOTDA</span><p>${(c.visual === "lampCircuit" ? c.example : everydayExamples[c.key] || c.example)}</p><strong id="auto-insight" class="tool-feedback" aria-live="polite">Parametrni o‘zgartiring — xulosa shu yerda chiqadi.</strong></div></section>`;
};

function simPage(config, level = 0) {
  const sessionKey = config.id + (config.topicNumber ? ':' + config.topicNumber : '');
  const restored = simSessions.get(sessionKey);
  let p = { ...defaults(config, level), ...(restored?.p || {}) },
    t = Number.isFinite(restored?.t) ? restored.t : 0,
    state;
  try {
    state = config.calculate(p, t);
  } catch (error) {
    console.error("Initial simulation calculation failed:", error);
    p = defaults(config, level);
    t = 0;
    state = config.calculate(p, t);
  }
  let speed =
      Number.isFinite(restored?.speed) && restored.speed > 0 ? restored.speed : 1,
    // Static models have no time axis, so they never autoplay.
    playing = config.static
      ? false
      : (restored?.playing ??
        !matchMedia("(prefers-reduced-motion: reduce)").matches),
    frame,
    last = 0,
    trails = restored?.trails ? restored.trails.map((trail) => ({ ...trail })) : [],
    snapshots = restored?.snapshots
      ? restored.snapshots.map((snapshot) => ({ ...snapshot }))
      : [],
    milestonePaused = false,
    disposed = false,
    levelSwitching = false;
  const c = config,
    params = c.params.filter((p) => p.level <= level);
  const navigation = topicNavigation(c, topics, allConfigs);
  const previousControl = navigation.previous
    ? `<a class="button secondary" href="${navigation.previous}">← ${uz.previous}</a>`
    : `<span class="button secondary" aria-disabled="true">← ${uz.previous}</span>`;
  const nextControl = navigation.next
    ? `<a class="button secondary" href="${navigation.next}">${uz.next} →</a>`
    : `<span class="button secondary" aria-disabled="true">${uz.next} →</span>`;
  const comparisonTime = c.static ? 0 : Math.min(c.duration, c.timeScale || 1);
  const guideStart = { p: { ...p }, result: c.calculate(p, comparisonTime)[c.results[0]?.key] },
    guideParam =
      params.find((param) => param.key === experimentFocus[c.key]) || params[0],
    guideResult = c.results[0];
  let comparisonResult = guideStart.result;
  let prediction = null,
    predictionBaseline = guideStart.result,
    predictionParams = { ...p };
  const extras =
    c.key === "friction"
      ? `<label class="select-label">${uz.surface}<select id="surface"><option value="0.03">${uz.surfaces[0]}</option><option value="0.2">${uz.surfaces[1]}</option><option value="0.7">${uz.surfaces[2]}</option><option value="custom">${uz.currentSurface}</option></select></label>`
      : c.key === "buoyancy"
        ? `<label class="select-label">${uz.fluid}<select id="fluid-choice"><option value="1000">${uz.fluids[0]}</option><option value="900">${uz.fluids[1]}</option><option value="13600">${uz.fluids[2]}</option><option value="custom">${uz.currentSurface}</option></select></label>`
        : c.key === "energy"
          ? `<label class="toggle-label"><input id="friction-toggle" type="checkbox">${uz.frictionToggle}</label>`
          : "";
  const chartVisible = Boolean(c.series?.length);
  const stepLabel = c.key === "rutherford"
    ? (0.1 * c.timeScale).toExponential(1)
    : format(0.1 * (c.timeScale || 1));
  // Static models have no time axis: they must not expose a play/pause control
  // at all, and the explanation replaces the transport row.
  const transport = c.static
    ? `<div class="static-model-note" role="note">${icon("help")}<span>${uz.staticModel}</span></div>`
    : `<div class="transport"><div><button type="button" class="icon-button" id="play" aria-label="${playing ? uz.pause : uz.play}">${icon(playing ? "pause" : "play")}</button><button type="button" class="icon-button" id="reset" aria-label="${uz.reset}">${icon("reset")}</button><button type="button" class="time-step" id="step-back" aria-label="${stepLabel} soniya orqaga">−${stepLabel}</button><button type="button" class="time-step" id="step-forward" aria-label="${stepLabel} soniya oldinga">+${stepLabel}</button><span class="time-display">t = <b id="sim-time">${format(t)}</b> s</span></div><div>${c.key === "projectile" ? `<button type="button" id="save-trail" class="subtle-button">+ ${uz.saveTrail}</button><button type="button" id="clear-trail" class="icon-button" aria-label="${uz.clearTrail}">${icon("close")}</button>` : ""}<label class="speed-control"><span>${uz.speed}</span><select id="sim-speed" aria-label="${uz.animationSpeed}"><option value="0.1">0.1×</option><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></div></div>${c.timeScale ? `<p class="static-model-note">Animatsiya vaqti koeffitsiyenti: ${c.timeScale} · t fizik vaqtni ko‘rsatadi. Qadam: ${stepLabel} s.</p>` : ""}<label class="time-scrubber"><span>${uz.timeline}</span><input id="timeline" type="range" min="0" max="${c.duration}" step="any" value="${t}" aria-label="${uz.timeline}"></label>`;
  // The energy model swaps its banner when friction is on, so the formula has to
  // follow the live (or restored) state instead of the static config.
  const mainFormula = () =>
    formula(
      c.key === "energy" && p.friction
        ? "E_k+E_p+Q=\\mathrm{const}"
        : ["fall", "projectile"].includes(c.key) && p.drag > 0
          ? "m\\dot{\\vec v}=m\\vec g-b\\vec v"
          : c.key === "spring" && p.damping > 0
            ? "x=Ae^{-\\beta t}\\cos(\\omega_dt+\\varphi_0)"
        : c.formulaLatex,
      true,
    );
  shell(
    `<div class="container sim-page"><div class="breadcrumb"><a href="#/topics">${uz.nav[1]}</a><span>/</span><a href="#/topics?section=${c.section}">${sectionName(c.section)}</a><span>/</span><span>${escape(navigation.title)}</span></div><div class="sim-title-row"><div><span class="eyebrow orange">${navigation.label} / ${sectionName(c.section).toUpperCase()}</span><h1>${escape(navigation.title)}</h1><p>${c.key === "electrolysis" ? "Tok kuchi va vaqt ajralgan modda miqdoriga qanday ta’sir qilishini kuzating." : c.key === "uniform" ? "Tezlikni o‘zgartirib, aravachaning o‘rni va bosib o‘tgan yo‘lini solishtiring." : c.description}</p>${c.topicTitle && c.topicTitle !== c.title ? `<p class="model-note">Umumiy laboratoriya: ${c.title}</p>` : ""}</div><button type="button" class="icon-button help-button" aria-label="${uz.help}">${icon("help")}</button></div><div class="formula-banner"><div id="main-formula">${mainFormula()}</div><span>SI · ${uz.levels[level]}</span></div><details class="live-calculation"><summary>Hisobni ko‘rish</summary><strong id="live-equation">${liveEquation(c, p, state, t)}</strong></details>${levelTabs(level)}<div id="experiment-panel" role="tabpanel" aria-labelledby="level-${level}"><div class="experiment-layout"><section class="experiment-card engineering-console"><div class="panel-header"><h2>${icon("grid")}${uz.experiment}</h2><span class="live-label"><i></i>${["airHumidity", "waterVapor", "meterRange", "lampCircuit", "batteryCircuit", "centerOfMass"].includes(c.visual) ? "INTERAKTIV MODEL" : uz.live}</span></div><div class="engineering-console-grid"><div class="simulation-stage"><div id="safeguard-banner" class="safeguard-banner" hidden role="alert"></div><canvas id="sim-canvas" role="img" aria-label="${uz.canvasLabel}: ${c.title}"></canvas>${c.key === "electrolysis" ? '<p class="stage-caption">Musbat ionlar katodga boradi; qoplama miqdori tok va vaqt bilan ortadi. Chizma sxematik.</p>' : ""}${transport}<div class="vector-legend">${legendFor(c)}<span id="sim-notice" role="status"></span></div></div><aside class="telemetry-panel"><div class="telemetry-heading"><span>${c.visual === "batteryCircuit" ? "Manbalar toki" : c.visual === "lampCircuit" ? "Lampalar quvvati" : c.visual === "meterRange" ? "Shunt grafigi" : ["airHumidity", "waterVapor"].includes(c.visual) ? "Harorat grafigi" : uz.chart}</span></div><div id="charts" class="charts-grid telemetry-charts"></div><div class="telemetry-results">${c.results.map((r) => `<div><span>${resultLabel(c, r.key)}</span><p><strong data-telemetry-result="${r.key}">${formatResult(r, state[r.key])}</strong><small data-telemetry-unit${formatResult(r, state[r.key]) === NO_VALUE ? " hidden" : ""}>${r.unit}</small></p></div>`).join("")}<p id="result-status" class="result-status telemetry-status" role="status"></p></div></aside></div></section><aside class="controls-card"><div class="panel-header"><h2>${uz.parameters}</h2><span>${params.length}</span></div><section class="experiment-guide"><div><span class="eyebrow orange">${uz.experimentTask}</span><p>${(experimentTasks[c.key] || c.task)}</p></div><ol><li data-guide-step="change"><i></i>${guideParam.label || paramNames[guideParam.key] || guideParam.key}: ${uz.changeParameter}</li><li data-guide-step="observe"><i></i>${uz.observeMotion}</li><li data-guide-step="compare"><i></i>${resultLabel(c, guideResult.key)}: ${uz.compareResult}</li></ol></section>${extras}<div class="parameter-stack">${params.map((param) => parameterSlider(param, p[param.key])).join("")}</div><div class="controls-note">${icon("help")}<span>${(experimentTasks[c.key] || c.task)}</span></div></aside></div>${coachMarkup(c, params)}${experimentTools(c, params)}<div class="learning-grid"><section class="learning-card"><span class="section-icon">${icon("book")}</span><h2>${level === 2 ? uz.derivation : uz.explanation}</h2>${level === 2 ? `<ol class="derivation">${c.hard.map((s) => `<li>${formula(s, true)}</li>`).join("")}</ol>` : `<p>${level === 0 ? c.easy : c.medium}</p>`}</section><section class="learning-card engineering"><span class="section-icon">${icon("force")}</span><span class="eyebrow">${uz.engineeringLabel}</span><h2>${uz.engineering}</h2><p>${c.visual === "lampCircuit" ? c.engineering : engineeringUses[c.key] || c.engineering}</p></section></div><details class="model-note"><summary>${uz.model}</summary><p>${c.model}</p></details></div><div class="sim-navigation">${previousControl}<button type="button" id="complete" class="button ${isCurrentCompleted(c, completed) ? "completed" : "primary"}">${icon("check")}${isCurrentCompleted(c, completed) ? uz.completed : uz.complete}</button>${nextControl}</div><a class="text-link back-link" href="#/topics">${icon("grid")}${uz.back}</a></div>`,
    "topics",
  );
  const canvas = new SimulationCanvas(
      document.querySelector("#sim-canvas"),
      (key, val) => sync(key, val)
    ),
    chart = chartVisible
      ? new LiveChart(document.querySelector("#charts"), level === 0 && ["electrolysis", "uniform"].includes(c.key) ? { ...c, series: c.series.slice(0, 1) } : c, p, (time) => {
          setPlayState(false);
          t = Math.max(0, Math.min(c.duration, time));
          update(true, "seek");
        })
      : null,
    stageEl = document.querySelector(".simulation-stage"),
    virtualInstruments = mountVirtualInstruments(stageEl, c, () => ({ state, p, t, trails })),
    telemetryPanel = document.querySelector(".telemetry-panel"),
    energyBar = mountEnergyBar(telemetryPanel, c),
    controlsCard = document.querySelector(".controls-card"),
    challengeHost = document.createElement("div"),
    challengeMode = mountChallengeMode(challengeHost, c, () => ({ state, p })),
    reportExport = mountReportExport(telemetryPanel, c, () => ({ state, p, t })),
    coach = mountExperimentCoach(document.querySelector(".experiment-coach"), c, () => ({ p, t }));
  const telemetrySummary = document.createElement("div");
  telemetrySummary.className = "telemetry-summary";
  telemetrySummary.append(
    telemetryPanel.querySelector(".telemetry-results"),
    telemetryPanel.querySelector(".report-export-toolbar"),
  );
  telemetryPanel.append(telemetrySummary);
  document.querySelector(".experiment-layout")?.append(telemetryPanel);
  const optionalContent = document.createElement("details");
  optionalContent.className = "experiment-extras";
  const optionalSummary = document.createElement("summary");
  optionalSummary.textContent = "Tushuntirish va qo‘shimcha vazifalar";
  const optionalBody = document.createElement("div");
  optionalBody.className = "experiment-extras-body";
  for (const selector of [".experiment-coach", ".lab-tools", ".learning-grid", ".model-note"]) {
    const section = document.querySelector(`#experiment-panel ${selector}`);
    if (section) optionalBody.append(section);
  }
  optionalBody.append(challengeHost);
  optionalContent.append(optionalSummary, optionalBody);
  document.querySelector(".experiment-layout")?.after(optionalContent);
  controlsCard.querySelector(".experiment-guide")?.remove();
  controlsCard.querySelector(".controls-note")?.remove();
  document.querySelector(".sim-page")?.classList.toggle("electrolysis-page", c.key === "electrolysis");
  const focusedCharts = ["electrolysis", "uniform"].includes(c.key);
  telemetryPanel?.classList.toggle("single-chart", focusedCharts);
  if (focusedCharts && level > 0 && chart) {
    const chartContainer = telemetryPanel.querySelector("#charts");
    const chartCards = [...chartContainer.querySelectorAll(".chart-wrap")];
    if (chartCards.length >= 2) {
      const switcher = document.createElement("div");
      switcher.className = "electrolysis-chart-switch";
      switcher.setAttribute("role", "group");
      switcher.setAttribute("aria-label", "Grafik turi");
      const labels = c.key === "uniform" ? ["Koordinata", "Tezlik"] : ["Modda (mg)", "Zaryad (C)"];
      const buttons = labels.map((label, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.addEventListener("click", () => selectChart(index));
        switcher.append(button);
        return button;
      });
      const selectChart = (selected) => {
        chartCards.forEach((card, index) => { card.hidden = index !== selected; });
        buttons.forEach((button, index) => button.setAttribute("aria-pressed", String(index === selected)));
        requestAnimationFrame(() => chart.charts[selected]?.resize());
      };
      chartContainer.before(switcher);
      selectChart(0);
    }
  }
  const endTime = () => {
    let end = c.duration;
    if (["fall", "projectile", "rutherford"].includes(c.key)) end = state.duration;
    if (["motion", "friction"].includes(c.key) && Number.isFinite(state.stop))
      end = Math.min(end, state.stop);
    if (c.key === "spring" && Number.isFinite(state.period)) {
      const cycles = Math.max(1, Math.floor(c.duration / state.period));
      end = cycles * state.period;
    }
    return Number.isFinite(end) && end > 0 ? end : Math.max(0.01, c.duration);
  };
  const setPlayState = (next) => {
    if (c.static) {
      // Static models never run, so there is no control to reflect.
      playing = false;
      return;
    }
    playing = next;
    const button = document.querySelector("#play");
    if (!button) return;
    button.innerHTML = icon(playing ? "pause" : "play");
    button.setAttribute("aria-label", playing ? uz.pause : uz.play);
    if (next && !c.static && frame == null) {
      last = 0;
      frame = requestAnimationFrame(loop);
    } else if (!next && frame != null) {
      cancelAnimationFrame(frame);
      frame = null;
      last = 0;
    }
  };
  const update = (force, chartMode = "add") => {
    if (disposed || !document.querySelector("#sim-canvas")) return;
    try {
      state = c.calculate(p, t);
    } catch (error) {
      console.error("Simulation calculation failed:", error);
      setPlayState(false);
      const notice = document.querySelector("#sim-notice");
      if (notice) notice.textContent = uz.simulationError;
      return;
    }
    canvas.update({ config: c, p, s: state, t, trails, level });
    virtualInstruments?.update(state, t, p);
    energyBar?.update(state, p);
    challengeMode?.update(state, p);
    reportExport?.update(state, p, t);
    const safeguardBanner = document.querySelector('#safeguard-banner');
    if (safeguardBanner) {
      if (state.warning) {
        safeguardBanner.hidden = false;
        safeguardBanner.innerHTML = `<span class="safeguard-icon">⚠️</span><span class="safeguard-text">${state.warning}</span>`;
      } else {
        safeguardBanner.hidden = true;
        safeguardBanner.replaceChildren();
      }
    }
    const modelNotice = document.querySelector('#sim-notice');
    if (modelNotice && (state.warning || modelNotice.dataset.modelWarning)) {
      modelNotice.textContent = state.warning || '';
      modelNotice.dataset.modelWarning = state.warning ? '1' : '';
    }
    for (const r of c.results) {
      const output = document.querySelector(`[data-result="${r.key}"]`);
      const formatted = formatResult(r, state[r.key]);
      if (output) {
        output.textContent = formatted;
        const unit = output.parentElement?.querySelector("[data-result-unit]");
        if (unit) unit.hidden = formatted === NO_VALUE;
      }
      const telemetryOutput = document.querySelector(
        `[data-telemetry-result="${r.key}"]`,
      );
      if (telemetryOutput) {
        telemetryOutput.textContent = formatted;
        const unit = telemetryOutput.parentElement?.querySelector(
          "[data-telemetry-unit]",
        );
        if (unit) unit.hidden = formatted === NO_VALUE;
      }
    }
    const timeOutput = document.querySelector("#sim-time"),
      timeline = document.querySelector("#timeline"),
      end = endTime();
    if (timeOutput) timeOutput.textContent = c.timeScale && t > 0 && t < 1 ? t.toExponential(3) : format(t);
    if (timeline) {
      timeline.max = end;
      timeline.value = Math.min(t, end);
      timeline.style.setProperty("--fill", `${(Math.min(t, end) / end) * 100}%`);
    }
    const status = document.querySelector("#result-status");
    if (c.key === "lens" && status)
      status.textContent = state.atFocus ? uz.focus : state.real ? uz.real : uz.virtual;
    if (c.key === "buoyancy" && status)
      status.textContent = uz.floating[state.status] || "";
    if (c.key === "discharge" && status)
      status.textContent = state.breakdown ? "Razryad bor · ionlar va elektronlar harakatda" : "Razryad yo‘q · gaz izolyator";
    const equation = document.querySelector("#live-equation");
    if (equation) equation.textContent = liveEquation(c, p, state, t);
    if (force) comparisonResult = c.calculate(p, comparisonTime)[c.results[0]?.key];
    const changed = params.some(
        (param) =>
          Math.abs(Number(p[param.key]) - Number(guideStart.p[param.key])) >
          1e-9,
      ),
      firstResult = c.results[0]?.key,
      startResult = guideStart.result,
      currentResult = comparisonResult,
      resultChanged =
        changed &&
        ((Number.isFinite(startResult) &&
          Number.isFinite(currentResult) &&
          Math.abs(currentResult - startResult) > 1e-9) ||
          comparisonResult !== guideStart.result),
      observed = c.static ? changed : c.key === "rutherford" ? t > 0 : t > 0.35;
    document
      .querySelector('[data-guide-step="change"]')
      ?.classList.toggle("done", changed);
    document
      .querySelector('[data-guide-step="observe"]')
      ?.classList.toggle("done", observed);
    document
      .querySelector('[data-guide-step="compare"]')
      ?.classList.toggle("done", resultChanged);
    const insight = document.querySelector("#auto-insight");
    if (insight && force) {
      if (!changed) insight.textContent = "Bitta parametrni o‘zgartiring — xulosa shu yerda chiqadi.";
      else if (!Number.isFinite(startResult) || !Number.isFinite(currentResult))
        insight.textContent = "Bu holatda natija chekli son bilan ifodalanmaydi. Model shartlarini tekshiring.";
      else {
        const delta = currentResult - startResult;
        const tolerance = Math.max(Number.MIN_VALUE, Math.abs(startResult), Math.abs(currentResult)) * 1e-8;
        const direction = Math.abs(delta) <= tolerance ? "o‘zgarmadi" : delta > 0 ? "ortdi" : "kamaydi";
        insight.textContent = resultLabel(c, firstResult) + " " + direction + ". " + (c.static ? "Dastlabki sozlamalar bilan solishtirildi." : "Ikkala holat t = " + format(comparisonTime) + " s da solishtirildi.") + " Bitta parametr ta’sirini ajratish uchun yuqoridagi taqqoslashdan foydalaning.";
      }
    }
    const predictionFeedback = document.querySelector("#prediction-feedback"),
      predictionParamChanged = params.some(
        (param) =>
          Math.abs(
            Number(p[param.key]) - Number(predictionParams[param.key]),
          ) > 1e-9,
      );
    if (prediction && predictionFeedback && predictionParamChanged) {
      let predictionCurrent = NaN;
      try {
        const referenceTime = comparisonTime;
        predictionCurrent = c.calculate(p, referenceTime)[guideResult.key];
      } catch {
        predictionCurrent = NaN;
      }
      const delta = predictionCurrent - predictionBaseline,
        tolerance = Math.max(Number.MIN_VALUE, Math.abs(predictionBaseline), Math.abs(predictionCurrent)) * 1e-8,
        actual = Math.abs(delta) <= tolerance ? "same" : delta > 0 ? "up" : "down";
      if (Number.isFinite(predictionCurrent) && Number.isFinite(predictionBaseline))
        predictionFeedback.textContent =
          actual === prediction
            ? "Taxminingiz to‘g‘ri chiqdi."
            : `Natija ${actual === "up" ? "oshdi" : actual === "down" ? "kamaydi" : "o‘zgarmadi"}.`;
    }
    if (chartMode === "seek") chart?.seek(t, state);
    else chart?.add(t, state, force);
  };
  const restart = () => {
    t = 0;
    milestonePaused = false;
    document.querySelector("#sim-notice")?.replaceChildren();
    chart?.reset(p);
    update(true);
  };
  const renderSnapshots = () => {
    const list = document.querySelector("#snapshot-list");
    if (!list) return;
    list.innerHTML = snapshots.length
      ? snapshots
          .map(
            (snapshot, index) =>
              `<article><span>#${index + 1} · ${paramNames[snapshot.focusKey] || snapshot.focusKey}: ${format(snapshot.focusValue)}</span>${c.results.map((result) => `<strong>${resultLabel(c, result.key)}: ${formatResult(result, snapshot.results[result.key])} ${result.unit}</strong>`).join("")}</article>`,
          )
          .join("")
      : "";
  };
  const decimals = (step) => (String(step).split(".")[1] || "").length;
  /**
   * Clamps a raw value into the input range and snaps it to the step, so the
   * slider, the number field and the engine can never disagree. Non numeric
   * input falls back to the low bound instead of poisoning the state with NaN.
   */
  const normalizeValue = (input, raw) => {
    const min = Number(input.min),
      max = Number(input.max),
      step = Math.abs(Number(input.step)) || 1,
      lo = Number.isFinite(min) ? min : -Infinity,
      hi = Number.isFinite(max) ? max : Infinity,
      value = Number(raw);
    const clamped = Number.isFinite(value)
      ? Math.max(lo, Math.min(hi, value))
      : lo;
    if (!Number.isFinite(lo)) return clamped;
    const snapped = lo + Math.round((clamped - lo) / step) * step;
    const result = Number(snapped.toFixed(decimals(step) + 2));
    return Number.isFinite(result) ? result : clamped;
  };
  const fillFor = (value, min, max) => {
    const span = max - min;
    const percent = Number.isFinite(span) && span > 0 ? ((value - min) / span) * 100 : 100;
    return `${Math.max(0, Math.min(100, percent))}%`;
  };
  /** Preset dropdowns that mirror a numeric parameter. */
  const presetSelectors = { mu: "#surface", fluid: "#fluid-choice" };
  /** Returns null for empty / half typed / non numeric values. */
  const toNumber = (raw) => {
    if (typeof raw === "string" && raw.trim() === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };
  const syncPreset = (key, value) => {
    const selector = presetSelectors[key];
    if (!selector) return;
    const select = document.querySelector(selector);
    if (!select) return;
    const tolerance = Math.max(1e-9, Math.abs(Number(value)) * 1e-9);
    const match = [...select.options].find(
      (option) =>
        option.value !== "custom" &&
        Math.abs(Number(option.value) - Number(value)) <= tolerance,
    );
    const next = match?.value ?? "custom";
    if (select.value !== next) select.value = next;
  };
  /**
   * Single entry point for parameter changes: normalises the value, mirrors it
   * into every control (range, number field, preset select) and re-runs the
   * model. Returns the value that was actually applied.
   */
  function sync(key, raw) {
    const range = document.querySelector(`[data-param="${key}"]`),
      number = document.querySelector(`[data-number="${key}"]`),
      source = range || number;
    // Empty / unparseable input keeps the last applied value instead of
    // snapping the parameter to 0 (Number("") === 0).
    const usable = toNumber(raw) ?? Number(p[key]);
    const normalized = source
      ? normalizeValue(source, usable)
      : Number.isFinite(usable)
        ? usable
        : 0;
    p[key] = normalized;
    if (range) {
      range.value = normalized;
      range.style.setProperty(
        "--fill",
        fillFor(normalized, Number(range.min), Number(range.max)),
      );
    }
    // Never rewrite the field being typed in: that would move the caret.
    if (number && document.activeElement !== number) number.value = normalized;
    syncPreset(key, normalized);
    restart();
    return normalized;
  }
  /** Returns null for empty / half typed / non numeric field content. */
  const parseNumber = (input) => toNumber(input.value);
  document
    .querySelectorAll("[data-param]")
    .forEach(
      (input) =>
        (input.oninput = () => sync(input.dataset.param, Number(input.value))),
    );
  document.querySelectorAll("[data-number]").forEach((input) => {
    const markValid = (valid) => {
      input.setAttribute("aria-invalid", valid ? "false" : "true");
      input.closest(".parameter")?.classList.toggle("is-invalid", !valid);
    };
    input.oninput = () => {
      const value = parseNumber(input);
      if (value === null) {
        // Empty or half typed: keep the last applied value, flag the field.
        markValid(false);
        const notice = document.querySelector("#sim-notice");
        if (notice) notice.textContent = "Raqam kiriting.";
        return;
      }
      const inRange = value >= Number(input.min) && value <= Number(input.max);
      markValid(inRange);
      if (inRange) {
        const notice = document.querySelector("#sim-notice");
        if (notice) notice.textContent = "";
        sync(input.dataset.number, value);
      } else {
        const definition = params.find(
          (param) => param.key === input.dataset.number,
        );
        const notice = document.querySelector("#sim-notice");
        if (notice)
          notice.textContent = `${paramNames[input.dataset.number] || definition?.label || input.dataset.number} ${input.min}–${input.max} oralig‘ida bo‘lishi kerak.`;
      }
    };
    input.onchange = () => {
      const value = parseNumber(input);
      // Commit: clamp/snap out of range input, or restore the model value when
      // the field was cleared. `sync` skips the focused field, so echo it back.
      input.value = sync(
        input.dataset.number,
        value === null ? p[input.dataset.number] : value,
      );
      markValid(true);
    };
    input.onkeydown = (e) => {
      if (e.key === "Enter") input.blur();
    };
  });
  const play = document.querySelector("#play");
  if (play && !c.static)
    play.onclick = () => {
      if (!playing && t >= endTime() * (1 - 1e-9)) restart();
      setPlayState(!playing);
    };
  const reset = document.querySelector("#reset"),
    speedInput = document.querySelector("#sim-speed"),
    timeline = document.querySelector("#timeline");
  if (reset) reset.onclick = restart;
  if (speedInput) {
    speedInput.value = String(speed);
    speedInput.onchange = (e) => {
      const value = Number(e.target.value);
      if (Number.isFinite(value) && value > 0) speed = value;
    };
  }
  if (timeline)
    timeline.oninput = (e) => {
      setPlayState(false);
      const value = Number(e.target.value),
        max = Number(e.target.max);
      t = Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : 0;
      update(true, "seek");
    };
  const stepTime = (amount) => {
    if (c.static) return;
    setPlayState(false);
    t = Math.max(0, Math.min(endTime(), t + amount * (c.timeScale || 1)));
    update(true, "seek");
  };
  const stepBack = document.querySelector("#step-back"),
    stepForward = document.querySelector("#step-forward");
  if (stepBack) stepBack.onclick = () => stepTime(-0.1);
  if (stepForward) stepForward.onclick = () => stepTime(0.1);
  // Preset dropdowns: reflect the restored/current value, and push the chosen
  // preset back through `sync` so range + number + select stay in lockstep.
  syncPreset("mu", p.mu);
  syncPreset("fluid", p.fluid);
  Object.entries(presetSelectors).forEach(([key, selector]) => {
    const select = document.querySelector(selector);
    if (!select) return;
    select.onchange = (e) => {
      const value = Number(e.target.value);
      // "custom" only marks the current value as user defined; it changes nothing.
      if (e.target.value === "custom" || !Number.isFinite(value)) return;
      sync(key, value);
    };
  });
  document.querySelectorAll("[data-preset-key]").forEach((button) => {
    button.onclick = () => {
      document
        .querySelectorAll("[data-preset-key]")
        .forEach((item) => item.classList.toggle("selected", item === button));
      sync(button.dataset.presetKey, Number(button.dataset.presetValue));
    };
  });
  document.querySelectorAll("[data-prediction]").forEach((button) => {
    button.onclick = () => {
      setPlayState(false);
      t = 0;
      chart?.reset(p);
      update(true, "seek");
      prediction = button.dataset.prediction;
      predictionParams = { ...p };
      try {
        const referenceTime = comparisonTime;
        predictionBaseline = c.calculate(predictionParams, referenceTime)[guideResult.key];
      } catch {
        predictionBaseline = NaN;
      }
      document
        .querySelectorAll("[data-prediction]")
        .forEach((item) => item.classList.toggle("selected", item === button));
      const feedback = document.querySelector("#prediction-feedback");
      if (feedback) feedback.textContent = "Taxmin saqlandi. Endi parametrni o‘zgartiring.";
    };
  });
  const frictionToggle = document.querySelector("#friction-toggle");
  if (frictionToggle) {
    // Restored sessions can carry `friction: true`, so seed the control.
    frictionToggle.checked = Boolean(p.friction);
    frictionToggle.onchange = (e) => {
      p.friction = e.target.checked;
      const banner = document.querySelector("#main-formula");
      if (banner) banner.innerHTML = mainFormula();
      restart();
    };
  }
  document.querySelector("#save-trail")?.addEventListener("click", () => {
    trails.push({ ...p });
    if (trails.length > 4) trails.shift();
    const notice = document.querySelector("#sim-notice");
    if (notice) notice.textContent = uz.trailSaved + ` (${trails.length}/4)`;
    update(true);
  });
  document.querySelector("#clear-trail")?.addEventListener("click", () => {
    trails = [];
    const notice = document.querySelector("#sim-notice");
    if (notice) notice.textContent = "";
    update(true);
  });
  document.querySelector("#save-snapshot")?.addEventListener("click", () => {
    const snapshot = {
      focusKey: guideParam.key,
      focusValue: p[guideParam.key],
      results: Object.fromEntries(c.results.map((result) => [result.key, state[result.key]])),
    };
    snapshots.push(snapshot);
    if (snapshots.length > 4) snapshots.shift();
    chart?.saveSnapshot(`#${snapshots.length}`);
    renderSnapshots();
  });
  document.querySelector("#clear-snapshots")?.addEventListener("click", () => {
    snapshots = [];
    chart?.clearSnapshots();
    renderSnapshots();
  });
  document.querySelectorAll("[data-level]").forEach(
    (button) =>
      (button.onclick = () => {
        if (levelSwitching || Number(button.dataset.level) === level) return;
        levelSwitching = true;
        const scroll = window.scrollY;
        cleanup();
        simPage(c, Number(button.dataset.level));
        window.scrollTo(0, scroll);
        document
          .querySelector(`[data-level="${button.dataset.level}"]`)
          ?.focus({ preventScroll: true });
      }),
  );
  const levelTabsEl = document.querySelector(".level-tabs");
  if (levelTabsEl)
    levelTabsEl.onkeydown = (e) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      const next =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? 2
            : (level + (e.key === "ArrowRight" ? 1 : 2)) % 3;
      document.querySelector(`[data-level="${next}"]`)?.click();
    };
  const completeButton = document.querySelector("#complete");
  if (completeButton)
    completeButton.onclick = () => {
      const isDone = toggleCompletion(c, completed);
      write("tt-completed", [...completed]);
      completeButton.className =
        "button " + (isDone ? "completed" : "primary");
      completeButton.innerHTML =
        icon("check") + (isDone ? uz.completed : uz.complete);
      // Show insight after marking complete
      showCompletionInsight(c);
    };
  const showCompletionInsight = (c) => {
    const insightEl = document.querySelector("#auto-insight");
    if (insightEl) insightEl.textContent = (c.lesson || c.easy || c.model) + " Xulosangizni parametrlar va o‘lchov natijalari bilan asoslang.";
  };

const onboarding = () => {
    const card = optionalBody;
    document.querySelector(".onboarding")?.remove();
    if (!card) return;
    optionalContent.open = true;
    const box = document.createElement("div");
    box.className = "onboarding";
    box.setAttribute("role", "status");
    box.innerHTML = `${icon("help")}<p>${uz.onboarding}</p><button type="button" class="button primary">${uz.gotIt}</button>`;
    card.append(box);
    box.querySelector("button").onclick = () => {
      box.remove();
      write("tt-onboarded", true);
    };
  };
  const helpButton = document.querySelector(".help-button");
  if (helpButton) helpButton.onclick = onboarding;
  const loop = (now) => {
    if (disposed) return;
    if (last && playing && !c.static && !document.hidden) {
      const previousVy = Number(state?.vy);
      t += Math.min((now - last) / 1000, 0.25) * speed * (c.timeScale || 1);
      const end = endTime();
      if (t >= end) {
        t = end;
        setPlayState(false);
        const notice = document.querySelector("#sim-notice");
        if (notice) notice.textContent = uz.finished;
      }
      update(false);
      if (
        c.key === "projectile" &&
        !milestonePaused &&
        previousVy > 0 &&
        Number(state?.vy) <= 0 &&
        t < end - 1e-6
      ) {
        milestonePaused = true;
        setPlayState(false);
        const notice = document.querySelector("#sim-notice");
        if (notice)
          notice.textContent = "Jism maksimal balandlikka yetdi. Davom ettirish uchun Play tugmasini bosing.";
      }
    }
    last = now;
    if (playing && !c.static) frame = requestAnimationFrame(loop);
    else frame = null;
  };
  // Daraja almashtirilganda tekis harakat grafigi bitta yakuniy nuqtaga aylanmasin.
  if (c.key === "uniform" && chart && t > 0) {
    const sampleCount = Math.min(120, Math.max(2, Math.ceil(t / 0.1)));
    for (let i = 0; i < sampleCount; i++) {
      const sampleTime = (t * i) / sampleCount;
      chart.add(sampleTime, c.calculate(p, sampleTime), true);
    }
  }
  update(true);
  renderSnapshots();
  if (playing && !c.static) frame = requestAnimationFrame(loop);
  cleanup = () => {
    if (disposed) return;
    disposed = true;
    simSessions.set(sessionKey, {
      p: { ...p },
      t,
      speed,
      playing,
      trails: trails.map((trail) => ({ ...trail })),
      snapshots: snapshots.map((snapshot) => ({
        ...snapshot,
        results: { ...snapshot.results },
      })),
    });
    cancelAnimationFrame(frame);
    virtualInstruments?.destroy();
    energyBar?.destroy();
    challengeMode?.destroy();
    reportExport?.destroy();
    coach?.destroy();
    chart?.destroy();
    canvas.destroy();
  };
}
function progress() {
  const done = allConfigs.filter((c) => isConfigCompleted(c, completed));
  shell(
    `<section class="container page-heading"><span class="eyebrow orange">${uz.personalLab}</span><h1>${uz.progressTitle}</h1><p>${uz.progressText}</p></section><section class="container progress-content"><div class="progress-summary"><div><strong>${done.length}<small> / ${allConfigs.length}</small></strong><p>tajriba o‘rganildi</p></div><div class="progress-track"><span style="width:${(done.length / allConfigs.length) * 100}%"></span></div><b>${Math.round((done.length / allConfigs.length) * 100)}%</b></div>${done.length ? `<div class="sim-grid">${done.map(card).join("")}</div>` : `<div class="empty-state">${icon("book")}<h2>${uz.progressEmpty}</h2><a class="button primary" href="${simLink(allConfigs[2])}">${uz.start}${icon("arrow")}</a></div>`}</section>`,
    "progress",
  );
}
function about() {
  shell(
    `<section class="container page-heading"><span class="eyebrow orange">TASHKENT UNIVERSITY OF TECHNOLOGY</span><h1>${uz.aboutTitle}</h1><p>${uz.aboutText}</p></section><section class="container about-grid"><article class="learning-card"><h2>${uz.source}</h2><p>${uz.aboutSource}</p><a class="text-link" href="./docs/Innova_Barcha_Formulalar_Royxati.md">${uz.formulaList} ↗</a></article><article class="learning-card"><h2>${uz.model}</h2><p>${uz.aboutModel}</p><a class="text-link" href="https://openstax.org/subjects/science" target="_blank" rel="noopener">OpenStax · ${uz.physicsSources} ↗</a></article></section>`,
    "about",
  );
}
function planned(number) {
  const t = topics.find((t) => t.number === number);
  if (t?.sim) {
    simPage(topicConfig(t.sim, number));
    return;
  }
  if (!t) {
    shell(
      `<section class="container empty-state"><h1>${uz.notFound}</h1><a class="button primary" href="#/topics">${uz.back}</a></section>`,
      "topics",
    );
    return;
  }
  shell(
    `<section class="container page-heading"><div class="breadcrumb"><a href="#/topics">${uz.nav[1]}</a><span>/</span>${sectionName(t.section)}</div><span class="eyebrow orange">${uz.topicLabel} ${t.number} · ${uz.soon.toUpperCase()}</span><h1>${escape(t.title)}</h1><p>${uz.plannedText}</p></section><section class="container planned-content"><article class="learning-card"><h2>${uz.notes}</h2><div class="source-notes">${t.notes
      .split("\n")
      .filter(Boolean)
      .map(
        (line) =>
          `<p>${escape(line.replace(/^- /, "")).replace(/`([^`]+)`/g, "<code>$1</code>")}</p>`,
      )
      .join(
        "",
      )}</div></article><a class="button primary" href="${simLink(allConfigs.find((c) => c.section === t.section) || allConfigs[2])}">${uz.tryReady}${icon("arrow")}</a></section>`,
    "topics",
  );
}
async function route() {
  const raw = location.hash.slice(1) || "/";
  let [path, query = ""] = raw.split("?");
  // "#main" is the skip link target rendered by the shell, not a route. Bail out
  // to the mounted page (and keep focus on #main) instead of unmounting it.
  if (path === "main" || path === "/main") {
    replaceHash("#" + (currentRoute || "/"));
    if (currentRoute) {
      focusTarget("#main");
      return;
    }
    [path, query] = ["/", ""];
  }
  const generation = ++routeGeneration;
  cleanup();
  cleanup = () => {};
  currentRoute = path + (query ? "?" + query : "");
  document.body.classList.add("home-dark");
  document.body.classList.toggle("is-home", path === "/");
  if (catalogFailed) {
    shell(
      `<section class="container page-heading"><span class="eyebrow orange">${uz.catalogError}</span><h1>${uz.catalogError}</h1><p>${uz.simulationError}</p><a class="button primary" href="#/">${uz.home}</a></section>`,
      "home",
    );
    document.title = `${uz.catalogError} — TT Physics Lab`;
    return;
  }
  if (path === "/") await home(generation);
  else if (path === "/topics") catalog(query);
  else if (path === "/sections")
    shell(
      `<section class="container page-heading"><span class="eyebrow orange">${uz.mapLabel}</span><h1>${uz.sectionsTitle}</h1><p>${uz.sectionsText}</p></section><section class="container section-space sections-grid standalone-sections">${sectionCards()}</section>`,
      "sections",
    );
  else if (path === "/progress") progress();
  else if (path === "/about") about();
  else if (path.startsWith("/topic/")) planned(Number(path.split("/")[2]));
  else if (path.startsWith("/sim/")) {
    const c = allConfigs.find((c) => c.id === path.split("/")[2]);
    if (c) {
      try {
        if (generation !== routeGeneration) return;
        simPage(topicConfig(c, new URLSearchParams(query).get('topic')));
      } catch (error) {
        console.error("Simulation route failed:", error);
        if (generation === routeGeneration) {
          shell(
            `<section class="container page-heading"><span class="eyebrow orange">${uz.simulationLoadError}</span><h1>${uz.simulationLoadError}</h1><p>${uz.simulationError}</p><a class="button primary" href="#/topics">${uz.back}</a></section>`,
            "topics",
          );
        }
      }
    } else planned(-1);
  } else planned(-1);
  if (generation !== routeGeneration) return;
  window.scrollTo(0, 0);
  document.title =
    (path === "/"
      ? uz.labTitle
      : document.querySelector("h1")?.textContent || "Mavzular") +
    " — TT Physics Lab";
  // Move focus into the freshly rendered page: the previously focused node is
  // gone, so keyboard users would otherwise restart from <body>.
  const focus = pendingRouteFocus;
  pendingRouteFocus = "#main";
  if (!firstRoute) focusTarget(focus);
  firstRoute = false;
}
window.addEventListener("hashchange", route);
window.addEventListener("keydown", (e) => {
  if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
  const active = document.activeElement;
  const typing =
    !!active?.isContentEditable ||
    !!active?.closest?.("input, textarea, select, [contenteditable]");
  if (typing) return;
  e.preventDefault();
  if (currentRoute.split("?")[0] !== "/topics") {
    pendingRouteFocus = "#catalog-search";
    location.hash = "/topics";
  } else document.querySelector("#catalog-search")?.focus();
});
await route();
