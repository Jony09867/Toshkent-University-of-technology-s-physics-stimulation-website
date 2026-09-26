import { uz } from "./i18n/uz.js";
import { allConfigs, defaults } from "./data/configs.js";
import { sections, sectionFor } from "./data/sections.js";
import { icon } from "./components/icons.js";
import { formula } from "./components/FormulaDisplay.js";
import { parameterSlider } from "./components/ParameterSlider.js";
import { levelTabs } from "./components/LevelTabs.js";
import { resultCard, formatResult, NO_VALUE } from "./components/ResultCard.js";
import { SimulationCanvas } from "./components/SimulationCanvas.js";
import { LiveChart } from "./components/LiveChart.js";
import { attachBorderGlow } from "./components/BorderGlow.js";
import { mountPillNav } from "./components/PillNav.js";
import { mountParticleText } from "./components/ParticleText.js";
import { mountFloatingLines } from "./components/FloatingLines.js";
import "./components/BorderGlow.css";
import "./components/PillNav.css";
import "./components/ParticleText.css";
import "./components/FloatingLines.css";

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
let completed = new Set(read("tt-completed", [])),
  cleanup = () => {},
  pillCleanup = () => {},
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
const simLink = (c) => `#/sim/${c.id}`;
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
  return vectors[c.key]
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
              `<a href="${t.sim ? simLink(t.sim) : "#/topic/" + t.number}"><span>${escape(t.title)}</span><small>${t.sim ? uz.ready : uz.soon}</small></a>`,
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
function header(active = "home") {
  return `<div class="topbar"><div class="container"><span>${uz.brand}</span><a href="https://tashkenttech-edu.uz/" target="_blank" rel="noopener">${uz.university} ↗</a></div></div><header class="header"><div class="container header-inner">${brand()}<div class="pill-nav-slot" data-pill-nav></div><div class="header-actions"><button type="button" class="icon-button header-search-toggle" aria-label="${uz.searchLabel}" aria-controls="header-search-panel" aria-expanded="false">${icon("search")}</button><span class="language" lang="uz">UZ</span><a class="header-lab" href="${simLink(allConfigs.find((c) => c.key === "newton"))}" aria-label="${uz.start}">${icon("arrow")}</a></div></div></header>`;
}
function footer() {
  return `<footer><div class="container footer-top"><div>${brand()}<p>${uz.footerText}</p></div><div><span class="eyebrow">PHYSICS LAB</span><a href="#/topics">${uz.browse}</a><a href="#/about">${uz.nav[4]}</a></div><div><span class="eyebrow">TASHKENT TECH</span><a href="https://tashkenttech-edu.uz/" target="_blank" rel="noopener">${uz.university} ↗</a><a href="mailto:info@tashkenttech-edu.uz">info@tashkenttech-edu.uz</a></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} ${uz.footerSub}</span><span>${uz.source}</span></div></footer>`;
}
function shell(body, active = "home") {
  pillCleanup();
  pillCleanup = () => {};
  app.innerHTML =
    header(active) + `<main id="main" tabindex="-1">${body}</main>` + footer();
  try {
    pillCleanup = mountPillNav(document.querySelector("[data-pill-nav]"), {
      items: primaryNav,
      activeHref: navHref(active),
      className: "site-pill-nav",
      ariaLabel: uz.mainNav,
      baseColor: "#141a22",
      pillColor: "#202b37",
      hoveredPillTextColor: "#ffffff",
      pillTextColor: "#d7e0e8",
    });
  } catch (error) {
    console.error("Pill navigation failed to mount:", error);
  }
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
  return `<svg class="sim-art" viewBox="0 0 320 154" aria-hidden="true"><defs><pattern id="dots-${key}" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".6" fill="#bacad6"/></pattern></defs><rect width="320" height="154" fill="url(#dots-${key})"/>${art}</svg>`;
}
function card(c, index = 0, featured = false) {
  return `<a class="sim-card${featured ? " electric-card" : ""}" href="${simLink(c)}"><div class="sim-card-visual tint-${index % 4}"><span class="mini-index">${String(allConfigs.indexOf(c) + 1).padStart(2, "0")} / ${uz.experimentLabel}</span>${artwork(c.key)}<span class="ready-tag"><i></i>${uz.ready}</span></div><div class="sim-card-body"><span class="card-category">${sectionName(c.section)}</span><h3>${c.title}</h3><p>${c.description}</p><div class="card-foot"><span class="small-formula">${formula(c.formulaLatex)}</span><span class="card-arrow">${icon("arrow")}</span></div></div></a>`;
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
function home() {
  const newton = allConfigs.find((c) => c.key === "newton");
  shell(
    `<section class="hero dark-hero"><div id="floating-lines" class="floating-lines" aria-hidden="true"></div><div class="dark-hero-grid" aria-hidden="true"></div><div class="container dark-hero-content"><h1 id="particle-text" class="particle-text particle-headline"></h1><p>${uz.heroText}</p><div class="hero-buttons"><a class="button primary specular-button" href="${simLink(newton)}"><span>${uz.start}</span>${icon("arrow")}</a><a class="button ghost" href="#/topics">${icon("grid")}<span>${uz.browse}</span></a></div><div class="dark-hero-meta"><div class="hero-proof"><span class="proof-symbol">∑</span><span>${uz.proofTop}<br><strong>${uz.proofBottom}</strong></span></div><div class="hero-formula-chips" aria-label="Asosiy fizika formulalari"><span>F = ma</span><span>E = mc²</span><span>pV = nRT</span></div></div></div></section><section class="stat-strip"><div class="container stats"><div><b>15</b><span>${uz.simulations}</span></div><div><b>143</b><span>${uz.topics}</span></div><div><b>15</b><span>${uz.sections}</span></div><div><b>3</b><span>${uz.learningLevels}</span></div></div></section><section class="container section-space"><div class="section-heading"><div><span class="eyebrow orange">${uz.featuredTag}</span><h2>${uz.featured}</h2><p>${uz.featuredText}</p></div><a class="text-link" href="#/topics?ready=1">${uz.allSims}${icon("arrow")}</a></div><div class="sim-grid">${[
      "newton",
      "projectile",
      "spring",
      "energy",
      "ohm",
      "lens",
    ]
      .map((k, i) =>
        card(
          allConfigs.find((c) => c.key === k),
          i,
          i === 0,
        ),
      )
      .join(
        "",
      )}</div></section><section class="sections-band"><div class="container section-space"><div class="section-heading"><div><span class="eyebrow orange">${uz.mapLabel}</span><h2>${uz.sectionsTitle}</h2><p>${uz.sectionsText}</p></div><span class="count-label">15 ${uz.sections}</span></div><div class="sections-grid">${sectionCards()}</div></div></section><section class="container how section-space"><div><span class="eyebrow orange">${uz.howLabel}</span><h2>${uz.howTitle}</h2><p>${uz.howText}</p><a class="text-link" href="${simLink(newton)}">${uz.start}${icon("arrow")}</a></div><div class="how-steps">${uz.how.map(([n, title, body]) => `<div><span>${n}</span><section><h3>${title}</h3><p>${body}</p></section></div>`).join("")}</div></section>`,
  );
  const particleCleanup = mountParticleText(document.querySelector("#particle-text"), {
    text: `${uz.heroTitle}\n${uz.heroAccent}`,
    color: "#fff8f4",
    highlightColor: "#f1592a",
    align: "center",
    maxFontSize: 102,
    fontWeight: 520,
    lineHeight: 1.08,
    accentLine: 1,
    italicLine: -1,
    density: 3,
    particleSize: 2.1,
    maxParticles: 7000,
    duration: 1000,
    scatter: 90,
    replayOnHover: false,
  });
  const linesCleanup = mountFloatingLines(document.querySelector("#floating-lines"));
  cleanup = () => {
    particleCleanup();
    linesCleanup();
  };
}
function catalog(query) {
  const filter = new URLSearchParams(query),
    section = filter.get("section") || "",
    ready = filter.get("ready") === "1";
  shell(
    `<section class="page-heading container"><div class="breadcrumb"><a href="#/">${uz.home}</a><span>/</span>${uz.nav[1]}</div><span class="eyebrow orange">${uz.libraryLabel}</span><h1>${uz.catalogTitle}</h1><p>${uz.catalogText}</p></section><div class="container catalog-layout"><aside class="catalog-sidebar"><h3>${uz.nav[2]}</h3><a class="${!section ? "selected" : ""}" href="#/topics"${!section ? ' aria-current="page"' : ""}>${icon("grid")}${uz.all}<span>143</span></a>${sections
      .map(
        (s) =>
          `<details ${s.id === section ? "open" : ""}><summary><a href="#/topics?section=${s.id}"${s.id === section ? ' aria-current="page"' : ""}>${s.title}</a><span>${topics.filter((t) => t.section === s.id).length}</span></summary><div>${topics
            .filter((t) => t.section === s.id)
            .map(
              (t) =>
                `<a href="${t.sim ? simLink(t.sim) : "#/topic/" + t.number}">${t.number}. ${escape(t.title)}${t.sim ? '<i class="topic-dot"></i>' : ""}</a>`,
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
      ? `<div class="topic-list">${found.map((t) => `<a class="topic-row" href="${t.sim ? simLink(t.sim) : "#/topic/" + t.number}"><span class="topic-number">${String(t.number).padStart(2, "0")}</span><span class="topic-row-icon">${icon(t.sim?.icon || sections.find((s) => s.id === t.section).icon)}</span><div><span class="card-category">${sectionName(t.section)}</span><h3>${escape(t.title)}</h3></div><span class="status ${t.sim ? "available" : ""}">${t.sim ? (completed.has(t.sim.id) ? uz.completed : uz.ready) : uz.soon}</span>${icon("chevron")}</a>`).join("")}</div>`
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
function simPage(config, level = 0) {
  const restored = simSessions.get(config.id);
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
    disposed = false,
    levelSwitching = false;
  const c = config,
    params = c.params.filter((p) => p.level <= level),
    index = allConfigs.indexOf(allConfigs.find((s) => s.id === c.id));
  const extras =
    c.key === "friction"
      ? `<label class="select-label">${uz.surface}<select id="surface"><option value="0.03">${uz.surfaces[0]}</option><option value="0.2">${uz.surfaces[1]}</option><option value="0.7">${uz.surfaces[2]}</option><option value="custom">${uz.currentSurface}</option></select></label>`
      : c.key === "buoyancy"
        ? `<label class="select-label">${uz.fluid}<select id="fluid-choice"><option value="1000">${uz.fluids[0]}</option><option value="900">${uz.fluids[1]}</option><option value="13600">${uz.fluids[2]}</option><option value="custom">${uz.currentSurface}</option></select></label>`
        : c.key === "energy"
          ? `<label class="toggle-label"><input id="friction-toggle" type="checkbox">${uz.frictionToggle}</label>`
          : "";
  const chartVisible =
    level > 0 || ["motion", "spring", "energy"].includes(c.key);
  // Static models have no time axis: they must not expose a play/pause control
  // at all, and the explanation replaces the transport row.
  const transport = c.static
    ? `<div class="static-model-note" role="note">${icon("help")}<span>${uz.staticModel}</span></div>`
    : `<div class="transport"><div><button type="button" class="icon-button" id="play" aria-label="${playing ? uz.pause : uz.play}">${icon(playing ? "pause" : "play")}</button><button type="button" class="icon-button" id="reset" aria-label="${uz.reset}">${icon("reset")}</button><span class="time-display">t = <b id="sim-time">${t.toFixed(2)}</b> s</span></div><div>${c.key === "projectile" ? `<button type="button" id="save-trail" class="subtle-button">+ ${uz.saveTrail}</button><button type="button" id="clear-trail" class="icon-button" aria-label="${uz.clearTrail}">${icon("close")}</button>` : ""}<label class="speed-control"><span>${uz.speed}</span><select id="sim-speed" aria-label="${uz.animationSpeed}"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></div></div><label class="time-scrubber"><span>${uz.timeline}</span><input id="timeline" type="range" min="0" max="${c.duration}" step="any" value="${t}" aria-label="${uz.timeline}"></label>`;
  // The energy model swaps its banner when friction is on, so the formula has to
  // follow the live (or restored) state instead of the static config.
  const mainFormula = () =>
    formula(
      c.key === "energy" && p.friction
        ? "E_k+E_p+Q=\\mathrm{const}"
        : c.formulaLatex,
      true,
    );
  shell(
    `<div class="container sim-page"><div class="breadcrumb"><a href="#/topics">${uz.nav[1]}</a><span>/</span><a href="#/topics?section=${c.section}">${sectionName(c.section)}</a><span>/</span><span>${c.title}</span></div><div class="sim-title-row"><div><span class="eyebrow orange">${uz.experimentLabel} ${String(index + 1).padStart(2, "0")} / ${sectionName(c.section).toUpperCase()}</span><h1>${c.title}</h1><p>${c.description}</p></div><button type="button" class="icon-button help-button" aria-label="${uz.help}">${icon("help")}</button></div><div class="formula-banner"><div id="main-formula">${mainFormula()}</div><span>SI · ${uz.levels[level]}</span></div>${levelTabs(level)}<div id="experiment-panel" role="tabpanel" aria-labelledby="level-${level}"><div class="experiment-layout"><section class="experiment-card"><div class="panel-header"><h2>${icon("grid")}${uz.experiment}</h2><span class="live-label"><i></i>${uz.live}</span></div><canvas id="sim-canvas" role="img" aria-label="${uz.canvasLabel}: ${c.title}"></canvas>${transport}<div class="vector-legend">${legendFor(c)}<span id="sim-notice" role="status"></span></div></section><aside class="controls-card"><div class="panel-header"><h2>${uz.parameters}</h2><span>${params.length}</span></div>${extras}<div class="parameter-stack">${params.map((param) => parameterSlider(param, p[param.key])).join("")}</div><div class="controls-note">${icon("help")}<span>${uz.previewText}</span></div></aside></div><section class="results-section"><div class="minor-heading"><h2>${uz.results}</h2><span>SI</span></div><div class="result-grid">${c.results.map((r) => resultCard(r, state[r.key])).join("")}</div><p id="result-status" class="result-status" role="status"></p></section>${chartVisible ? `<section class="chart-section"><div class="minor-heading"><h2>${uz.chart}</h2><span>${["coulomb", "lens", "ohm", "circuit", "gas", "resonance"].includes(c.key) ? uz.relationsLabel : uz.timeRelationsLabel}</span></div><div id="charts" class="charts-grid"></div></section>` : ""}<div class="learning-grid"><section class="learning-card"><span class="section-icon">${icon("book")}</span><h2>${level === 2 ? uz.derivation : uz.explanation}</h2>${level === 2 ? `<ol class="derivation">${c.hard.map((s) => `<li>${formula(s, true)}</li>`).join("")}</ol>` : `<p>${level === 0 ? c.easy : c.medium}</p>`}</section><section class="learning-card engineering"><span class="section-icon">${icon("force")}</span><span class="eyebrow">${uz.engineeringLabel}</span><h2>${uz.engineering}</h2><p>${c.engineering}</p></section></div><details class="model-note"><summary>${uz.model}</summary><p>${c.model}</p></details></div><div class="sim-navigation"><a class="button secondary" href="${simLink(allConfigs[(index - 1 + allConfigs.length) % allConfigs.length])}">← ${uz.previous}</a><button type="button" id="complete" class="button ${completed.has(c.id) ? "completed" : "primary"}">${icon("check")}${completed.has(c.id) ? uz.completed : uz.complete}</button><a class="button secondary" href="${simLink(allConfigs[(index + 1) % allConfigs.length])}">${uz.next} →</a></div><a class="text-link back-link" href="#/topics">${icon("grid")}${uz.back}</a></div>`,
    "topics",
  );
  const canvas = new SimulationCanvas(document.querySelector("#sim-canvas")),
    chart = chartVisible
      ? new LiveChart(document.querySelector("#charts"), c, p)
      : null;
  const endTime = () => {
    let end = c.duration;
    if (["fall", "projectile"].includes(c.key)) end = state.duration;
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
  const update = (force) => {
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
    for (const r of c.results) {
      const output = document.querySelector(`[data-result="${r.key}"]`);
      if (output) {
        const formatted = formatResult(r, state[r.key]);
        output.textContent = formatted;
        const unit = output.parentElement?.querySelector("[data-result-unit]");
        if (unit) unit.hidden = formatted === NO_VALUE;
      }
    }
    const timeOutput = document.querySelector("#sim-time"),
      timeline = document.querySelector("#timeline"),
      end = endTime();
    if (timeOutput) timeOutput.textContent = t.toFixed(2);
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
    chart?.add(t, state, force);
  };
  const restart = () => {
    t = 0;
    document.querySelector("#sim-notice")?.replaceChildren();
    chart?.reset(p);
    update(true);
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
        return;
      }
      markValid(true);
      if (value >= Number(input.min) && value <= Number(input.max))
        sync(input.dataset.number, value);
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
      if (!playing && t >= endTime() - 1e-6) restart();
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
      t = Number.isFinite(value) ? (value >= max - 1e-6 ? max : value) : 0;
      update(true);
    };
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
      if (completed.has(c.id)) completed.delete(c.id);
      else completed.add(c.id);
      write("tt-completed", [...completed]);
      completeButton.className =
        "button " + (completed.has(c.id) ? "completed" : "primary");
      completeButton.innerHTML =
        icon("check") + (completed.has(c.id) ? uz.completed : uz.complete);
    };
  const onboarding = () => {
    const card = document.querySelector(".controls-card");
    document.querySelector(".onboarding")?.remove();
    if (!card) return;
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
  if (!read("tt-onboarded", false)) onboarding();
  const loop = (now) => {
    if (disposed) return;
    if (last && playing && !c.static && !document.hidden) {
      t += Math.min((now - last) / 1000, 0.25) * speed;
      const end = endTime();
      if (t >= end) {
        t = end;
        setPlayState(false);
        const notice = document.querySelector("#sim-notice");
        if (notice) notice.textContent = uz.finished;
      }
      update(false);
    }
    last = now;
    if (playing && !c.static) frame = requestAnimationFrame(loop);
    else frame = null;
  };
  update(true);
  if (playing && !c.static) frame = requestAnimationFrame(loop);
  cleanup = () => {
    if (disposed) return;
    disposed = true;
    simSessions.set(c.id, {
      p: { ...p },
      t,
      speed,
      playing,
      trails: trails.map((trail) => ({ ...trail })),
    });
    cancelAnimationFrame(frame);
    chart?.destroy();
    canvas.destroy();
  };
}
function progress() {
  const done = allConfigs.filter((c) => completed.has(c.id));
  shell(
    `<section class="container page-heading"><span class="eyebrow orange">${uz.personalLab}</span><h1>${uz.progressTitle}</h1><p>${uz.progressText}</p></section><section class="container progress-content"><div class="progress-summary"><div><strong>${done.length}<small> / 15</small></strong><p>${uz.progressLabel}</p></div><div class="progress-track"><span style="width:${(done.length / 15) * 100}%"></span></div><b>${Math.round((done.length / 15) * 100)}%</b></div>${done.length ? `<div class="sim-grid">${done.map(card).join("")}</div>` : `<div class="empty-state">${icon("book")}<h2>${uz.progressEmpty}</h2><a class="button primary" href="${simLink(allConfigs[2])}">${uz.start}${icon("arrow")}</a></div>`}</section>`,
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
  currentRoute = path;
  document.body.classList.toggle("home-dark", path === "/");
  if (catalogFailed) {
    shell(
      `<section class="container page-heading"><span class="eyebrow orange">${uz.catalogError}</span><h1>${uz.catalogError}</h1><p>${uz.simulationError}</p><a class="button primary" href="#/">${uz.home}</a></section>`,
      "home",
    );
    document.title = `${uz.catalogError} — TT Physics Lab`;
    return;
  }
  if (path === "/") home();
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
        const module = await import(`./simulations/${c.section}/${c.id}.js`);
        if (generation !== routeGeneration) return;
        simPage(module.simulationConfig);
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
  setTimeout(() => {
    if (generation !== routeGeneration) return;
    document.querySelectorAll('.sim-card, .section-card, .learning-card, .result-card').forEach((el) => {
      const isSection = el.classList.contains('section-card');
      attachBorderGlow(el, {
        edgeSensitivity: 30,
        glowColor: "14 88 55",
        backgroundColor: isSection || path === "/" ? "#111820" : el.classList.contains('learning-card') || el.classList.contains('result-card') ? "#f7f8fa" : "#ffffff",
        borderRadius: isSection ? 16 : 18,
        glowRadius: 35,
        glowIntensity: 1.0,
        colors: ['#F1592A', '#3883d9', '#19a378'],
      });
    });
  }, 50);
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
  if (currentRoute !== "/topics") {
    pendingRouteFocus = "#catalog-search";
    location.hash = "/topics";
  } else document.querySelector("#catalog-search")?.focus();
});
await route();
