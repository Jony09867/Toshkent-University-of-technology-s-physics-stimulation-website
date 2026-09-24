import { uz } from "./i18n/uz.js";
import { allConfigs, defaults } from "./data/configs.js";
import { sections, sectionFor } from "./data/sections.js";
import { icon } from "./components/icons.js";
import { formula } from "./components/FormulaDisplay.js";
import { parameterSlider } from "./components/ParameterSlider.js";
import { levelTabs } from "./components/LevelTabs.js";
import { resultCard, format } from "./components/ResultCard.js";
import { SimulationCanvas } from "./components/SimulationCanvas.js";
import { LiveChart } from "./components/LiveChart.js";
import { attachBorderGlow } from "./components/BorderGlow.js";
import { mountGalaxy } from "./components/Galaxy.js";
import "./components/BorderGlow.css";
import "./components/Galaxy.css";

const app = document.querySelector("#app");
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
  currentRoute = "",
  routeGeneration = 0;
const topics = await fetch(new URL("./data/topics.json", import.meta.url)).then(
  (r) => {
    if (!r.ok) throw new Error(uz.catalogError);
    return r.json();
  },
);
topics.forEach((t) => {
  t.section = sectionFor(t.number);
  t.sim = allConfigs.find((s) => s.topicNumbers.includes(t.number));
});
const brand = () =>
  `<a class="brand" href="#/" aria-label="${uz.homeBrand}"><svg class="tt-logo-mark" viewBox="11 10 53 37" aria-hidden="true"><path d="M11 10h27l-3 9h-6v28h-9V19h-9V10zM42 10h22l-4 9h-5v28H45V19h-6l3-9z" fill="#E54519"/></svg><span class="brand-name"><span class="brand-logo-text"><span class="line-1"><span class="solid">TASHKENT</span><span class="space">&nbsp;</span><span class="outline">UNIVERSITY</span></span><span class="line-2"><span class="outline">OF</span><span class="space">&nbsp;</span><span class="solid">TECH</span><span class="outline">NOLOGY</span></span></span><small class="brand-sub">PHYSICS LAB</small></span></a>`;
const sectionName = (id) => sections.find((s) => s.id === id)?.title || "";
const simLink = (c) => `#/sim/${c.id}`;
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
  return `<div class="topbar"><div class="container"><span>${uz.brand}</span><a href="https://tashkenttech-edu.uz/" target="_blank" rel="noopener">${uz.university} ↗</a></div></div><header class="header"><div class="container header-inner">${brand()}<nav class="nav" aria-label="${uz.mainNav}">${["home", "topics", "sections", "progress", "about"].map((id, i) => `<a href="#/${id === "home" ? "" : id}" class="${active === id ? "active" : ""}" ${active === id ? 'aria-current="page"' : ""}>${uz.nav[i]}</a>`).join("")}</nav><div class="header-actions"><button class="icon-button header-search-toggle" aria-label="${uz.searchLabel}" aria-expanded="false">${icon("search")}</button><span class="language" lang="uz">UZ</span><a class="header-lab" href="${simLink(allConfigs.find((c) => c.key === "newton"))}">${icon("arrow")}</a><button class="menu-button icon-button" aria-label="${uz.openMenu}" aria-expanded="false">${icon("menu")}</button></div></div></header>`;
}
function footer() {
  return `<footer><div class="container footer-top"><div>${brand()}<p>${uz.footerText}</p></div><div><span class="eyebrow">PHYSICS LAB</span><a href="#/topics">${uz.browse}</a><a href="#/about">${uz.nav[4]}</a></div><div><span class="eyebrow">TASHKENT TECH</span><a href="https://tashkenttech-edu.uz/" target="_blank" rel="noopener">${uz.university} ↗</a><a href="mailto:info@tashkenttech-edu.uz">info@tashkenttech-edu.uz</a></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} ${uz.footerSub}</span><span>${uz.source}</span></div></footer>`;
}
function shell(body, active = "home") {
  app.innerHTML =
    header(active) + `<main id="main" tabindex="-1">${body}</main>` + footer();
  const menu = document.querySelector(".menu-button");
  menu.onclick = () => {
    const open = document.querySelector(".nav").classList.toggle("open");
    menu.setAttribute("aria-expanded", open);
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
  return `<svg class="sim-art" viewBox="0 0 320 154" aria-hidden="true"><defs><pattern id="dots-${key}" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".6" fill="#bacad6"/></pattern></defs><rect width="320" height="154" fill="url(#dots-${key})"/>${art}</svg>`;
}
function card(c, index = 0) {
  return `<a class="sim-card" href="${simLink(c)}"><div class="sim-card-visual tint-${index % 4}"><span class="mini-index">${String(allConfigs.indexOf(c) + 1).padStart(2, "0")} / ${uz.experimentLabel}</span>${artwork(c.key)}<span class="ready-tag"><i></i>${uz.ready}</span></div><div class="sim-card-body"><span class="card-category">${sectionName(c.section)}</span><h3>${c.title}</h3><p>${c.description}</p><div class="card-foot"><span class="small-formula">${formula(c.formulaLatex)}</span><span class="card-arrow">${icon("arrow")}</span></div></div></a>`;
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
    `<section class="hero"><div class="hero-galaxy" aria-hidden="true"></div><div class="container hero-grid"><div class="hero-copy"><span class="eyebrow"><i></i>${uz.heroTag}</span><h1>${uz.heroTitle}<br><em>${uz.heroAccent}</em></h1><p>${uz.heroText}</p><div class="hero-buttons"><a class="button primary" href="${simLink(newton)}">${uz.start}${icon("arrow")}</a><a class="button ghost" href="#/topics">${icon("grid")}${uz.browse}</a></div><div class="hero-proof"><span class="proof-symbol">∑</span><span>${uz.proofTop}<br><strong>${uz.proofBottom}</strong></span></div></div><div class="hero-experiment"><div class="preview-top"><span class="live-label"><i></i>${uz.live}</span><span>01 — NYUTON II</span></div><div class="preview-formula">${formula("F=m\\cdot a")}<span>${uz.previewSentence}</span></div><canvas id="hero-canvas" aria-label="${uz.previewAria}" role="img"></canvas><div class="preview-controls"><label for="hero-force">${uz.force} <b><span id="hero-force-value">20</span> N</b></label><input type="range" id="hero-force" min="0" max="100" value="20" step="1" style="--fill:20%"><span class="preview-result">a = <b id="hero-accel">4.00</b> m/s²</span></div><div class="preview-bottom">${icon("help")} ${uz.previewText}<span>m = 5 kg</span></div></div></div></section><section class="stat-strip"><div class="container stats"><div><b>15</b><span>${uz.simulations}</span></div><div><b>143</b><span>${uz.topics}</span></div><div><b>15</b><span>${uz.sections}</span></div><div><b>3</b><span>${uz.learningLevels}</span></div></div></section><section class="container section-space"><div class="section-heading"><div><span class="eyebrow orange">${uz.featuredTag}</span><h2>${uz.featured}</h2><p>${uz.featuredText}</p></div><a class="text-link" href="#/topics?ready=1">${uz.allSims}${icon("arrow")}</a></div><div class="sim-grid">${[
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
        ),
      )
      .join(
        "",
      )}</div></section><section class="sections-band"><div class="container section-space"><div class="section-heading"><div><span class="eyebrow orange">${uz.mapLabel}</span><h2>${uz.sectionsTitle}</h2><p>${uz.sectionsText}</p></div><span class="count-label">15 ${uz.sections}</span></div><div class="sections-grid">${sectionCards()}</div></div></section><section class="container how section-space"><div><span class="eyebrow orange">${uz.howLabel}</span><h2>${uz.howTitle}</h2><p>${uz.howText}</p><a class="text-link" href="${simLink(newton)}">${uz.start}${icon("arrow")}</a></div><div class="how-steps">${uz.how.map(([n, title, body]) => `<div><span>${n}</span><section><h3>${title}</h3><p>${body}</p></section></div>`).join("")}</div></section>`,
  );
  const galaxyCleanup = mountGalaxy(document.querySelector(".hero-galaxy"), {
    disableAnimation: matchMedia("(prefers-reduced-motion: reduce)").matches,
  });
  const canvas = new SimulationCanvas(document.querySelector("#hero-canvas"));
  const p = defaults(newton);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let time = 0,
    last = 0,
    frame;
  const update = () =>
    canvas.update({
      config: newton,
      p,
      s: newton.calculate(p, time),
      t: time,
      hero: true,
    });
  const loop = (now) => {
    if (last && !document.hidden && !reduceMotion)
      time += Math.min((now - last) / 1000, 0.1);
    last = now;
    if (time > 4.2) time = 0;
    update();
    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);
  document.querySelector("#hero-force").oninput = (e) => {
    p.force = Number(e.target.value);
    time = 0;
    e.target.style.setProperty("--fill", p.force + "%");
    document.querySelector("#hero-force-value").textContent = p.force;
    document.querySelector("#hero-accel").textContent = (p.force / p.m).toFixed(
      2,
    );
    update();
  };
  cleanup = () => {
    galaxyCleanup();
    cancelAnimationFrame(frame);
    canvas.destroy();
  };
}
function catalog(query) {
  const filter = new URLSearchParams(query),
    section = filter.get("section") || "",
    ready = filter.get("ready") === "1";
  shell(
    `<section class="page-heading container"><div class="breadcrumb"><a href="#/">${uz.home}</a><span>/</span>${uz.nav[1]}</div><span class="eyebrow orange">${uz.libraryLabel}</span><h1>${uz.catalogTitle}</h1><p>${uz.catalogText}</p></section><div class="container catalog-layout"><aside class="catalog-sidebar"><h3>${uz.nav[2]}</h3><a class="${!section ? "selected" : ""}" href="#/topics">${icon("grid")}${uz.all}<span>143</span></a>${sections
      .map(
        (s) =>
          `<details ${s.id === section ? "open" : ""}><summary><a href="#/topics?section=${s.id}">${s.title}</a><span>${topics.filter((t) => t.section === s.id).length}</span></summary><div>${topics
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
  let p = defaults(config, level),
    state = config.calculate(p, 0),
    t = 0,
    speed = 1,
    playing = !matchMedia("(prefers-reduced-motion: reduce)").matches,
    frame,
    last = 0,
    trails = [];
  const c = config,
    params = c.params.filter((p) => p.level <= level),
    index = allConfigs.indexOf(allConfigs.find((s) => s.id === c.id));
  const extras =
    c.key === "friction"
      ? `<label class="select-label">${uz.surface}<select id="surface"><option value="0.03">${uz.surfaces[0]}</option><option value="0.2" selected>${uz.surfaces[1]}</option><option value="0.7">${uz.surfaces[2]}</option></select></label>`
      : c.key === "buoyancy"
        ? `<label class="select-label">${uz.fluid}<select id="fluid-choice"><option value="1000">${uz.fluids[0]}</option><option value="900">${uz.fluids[1]}</option><option value="13600">${uz.fluids[2]}</option></select></label>`
        : c.key === "energy"
          ? `<label class="toggle-label"><input id="friction-toggle" type="checkbox">${uz.frictionToggle}</label>`
          : "";
  const chartVisible =
    level > 0 || ["motion", "spring", "energy"].includes(c.key);
  shell(
    `<div class="container sim-page"><div class="breadcrumb"><a href="#/topics">${uz.nav[1]}</a><span>/</span><a href="#/topics?section=${c.section}">${sectionName(c.section)}</a><span>/</span><span>${c.title}</span></div><div class="sim-title-row"><div><span class="eyebrow orange">${uz.experimentLabel} ${String(index + 1).padStart(2, "0")} / ${sectionName(c.section).toUpperCase()}</span><h1>${c.title}</h1><p>${c.description}</p></div><button class="icon-button help-button" aria-label="${uz.help}">${icon("help")}</button></div><div class="formula-banner"><div id="main-formula">${formula(c.formulaLatex, true)}</div><span>SI · ${uz.levels[level]}</span></div>${levelTabs(level)}<div id="experiment-panel" role="tabpanel" aria-labelledby="level-${level}"><div class="experiment-layout"><section class="experiment-card"><div class="panel-header"><h2>${icon("grid")}${uz.experiment}</h2><span class="live-label"><i></i>${uz.live}</span></div><canvas id="sim-canvas" role="img" aria-label="${uz.canvasLabel}: ${c.title}"></canvas><div class="transport"><div><button class="icon-button" id="play" aria-label="${playing ? uz.pause : uz.play}">${icon(playing ? "pause" : "play")}</button><button class="icon-button" id="reset" aria-label="${uz.reset}">${icon("reset")}</button><span class="time-display">t = <b id="sim-time">0.00</b> s</span></div><div>${c.key === "projectile" ? `<button id="save-trail" class="subtle-button">+ ${uz.saveTrail}</button><button id="clear-trail" class="icon-button" aria-label="${uz.clearTrail}">${icon("close")}</button>` : ""}<label class="speed-control"><span>${uz.speed}</span><select id="sim-speed" aria-label="${uz.animationSpeed}"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label></div></div><div class="vector-legend">${legendFor(c)}<span id="sim-notice" role="status"></span></div></section><aside class="controls-card"><div class="panel-header"><h2>${uz.parameters}</h2><span>${params.length}</span></div>${extras}<div class="parameter-stack">${params.map((param) => parameterSlider(param, p[param.key])).join("")}</div><div class="controls-note">${icon("help")}<span>${uz.previewText}</span></div></aside></div><section class="results-section"><div class="minor-heading"><h2>${uz.results}</h2><span>SI</span></div><div class="result-grid">${c.results.map((r) => resultCard(r, state[r.key])).join("")}</div><p id="result-status" class="result-status" role="status"></p></section>${chartVisible ? `<section class="chart-section"><div class="minor-heading"><h2>${uz.chart}</h2><span>${["coulomb", "lens", "ohm", "circuit", "gas", "resonance"].includes(c.key) ? uz.relationsLabel : uz.timeRelationsLabel}</span></div><div id="charts" class="charts-grid"></div></section>` : ""}<div class="learning-grid"><section class="learning-card"><span class="section-icon">${icon("book")}</span><h2>${level === 2 ? uz.derivation : uz.explanation}</h2>${level === 2 ? `<ol class="derivation">${c.hard.map((s) => `<li>${formula(s, true)}</li>`).join("")}</ol>` : `<p>${level === 0 ? c.easy : c.medium}</p>`}</section><section class="learning-card engineering"><span class="section-icon">${icon("force")}</span><span class="eyebrow">${uz.engineeringLabel}</span><h2>${uz.engineering}</h2><p>${c.engineering}</p></section></div><details class="model-note"><summary>${uz.model}</summary><p>${c.model}</p></details></div><div class="sim-navigation"><a class="button secondary" href="${simLink(allConfigs[(index - 1 + allConfigs.length) % allConfigs.length])}">← ${uz.previous}</a><button id="complete" class="button ${completed.has(c.id) ? "completed" : "primary"}">${icon("check")}${completed.has(c.id) ? uz.completed : uz.complete}</button><a class="button secondary" href="${simLink(allConfigs[(index + 1) % allConfigs.length])}">${uz.next} →</a></div><a class="text-link back-link" href="#/topics">${icon("grid")}${uz.back}</a></div>`,
    "topics",
  );
  const canvas = new SimulationCanvas(document.querySelector("#sim-canvas")),
    chart = chartVisible
      ? new LiveChart(document.querySelector("#charts"), c, p)
      : null;
  const update = (force) => {
    state = c.calculate(p, t);
    canvas.update({ config: c, p, s: state, t, trails, level });
    for (const r of c.results)
      document.querySelector(`[data-result="${r.key}"]`).textContent = format(
        state[r.key] * r.scale,
      );
    document.querySelector("#sim-time").textContent = t.toFixed(2);
    if (c.key === "lens")
      document.querySelector("#result-status").textContent = state.atFocus
        ? uz.focus
        : state.real
          ? uz.real
          : uz.virtual;
    if (c.key === "buoyancy")
      document.querySelector("#result-status").textContent =
        uz.floating[state.status];
    chart?.add(t, state, force);
  };
  const restart = () => {
    t = 0;
    chart?.reset(p);
    update(true);
  };
  function sync(key, value) {
    p[key] = value;
    const range = document.querySelector(`[data-param="${key}"]`),
      number = document.querySelector(`[data-number="${key}"]`);
    if (range) {
      range.value = value;
      range.style.setProperty(
        "--fill",
        ((value - Number(range.min)) /
          (Number(range.max) - Number(range.min))) *
          100 +
          "%",
      );
      number.value = value;
    }
    restart();
  }
  document
    .querySelectorAll("[data-param]")
    .forEach(
      (input) =>
        (input.oninput = () => sync(input.dataset.param, Number(input.value))),
    );
  document.querySelectorAll("[data-number]").forEach((input) => {
    input.oninput = () => {
      if (input.value === "" || !Number.isFinite(Number(input.value))) return;
      const value = Number(input.value);
      if (value >= Number(input.min) && value <= Number(input.max))
        sync(input.dataset.number, value);
    };
    input.onchange = () => {
      const n = Number(input.value);
      sync(
        input.dataset.number,
        Number.isFinite(n)
          ? Math.max(Number(input.min), Math.min(Number(input.max), n))
          : p[input.dataset.number],
      );
    };
  });
  const play = document.querySelector("#play");
  if (c.static) {
    play.disabled = true;
    document.querySelector("#sim-speed").disabled = true;
  }
  play.onclick = () => {
    playing = !playing;
    play.innerHTML = icon(playing ? "pause" : "play");
    play.setAttribute("aria-label", playing ? uz.pause : uz.play);
  };
  document.querySelector("#reset").onclick = restart;
  document.querySelector("#sim-speed").onchange = (e) =>
    (speed = Number(e.target.value));
  document
    .querySelector("#surface")
    ?.addEventListener("change", (e) => sync("mu", Number(e.target.value)));
  document
    .querySelector("#fluid-choice")
    ?.addEventListener("change", (e) => sync("fluid", Number(e.target.value)));
  document
    .querySelector("#friction-toggle")
    ?.addEventListener("change", (e) => {
      p.friction = e.target.checked;
      document.querySelector("#main-formula").innerHTML = formula(
        p.friction ? "E_k+E_p+Q=\\mathrm{const}" : c.formulaLatex,
        true,
      );
      restart();
    });
  document.querySelector("#save-trail")?.addEventListener("click", () => {
    trails.push({ ...p });
    if (trails.length > 4) trails.shift();
    document.querySelector("#sim-notice").textContent =
      uz.trailSaved + ` (${trails.length}/4)`;
    update(true);
  });
  document.querySelector("#clear-trail")?.addEventListener("click", () => {
    trails = [];
    document.querySelector("#sim-notice").textContent = "";
    update(true);
  });
  document.querySelectorAll("[data-level]").forEach(
    (button) =>
      (button.onclick = () => {
        const scroll = window.scrollY;
        cleanup();
        simPage(c, Number(button.dataset.level));
        window.scrollTo(0, scroll);
        document
          .querySelector(`[data-level="${button.dataset.level}"]`)
          .focus({ preventScroll: true });
      }),
  );
  document.querySelector(".level-tabs").onkeydown = (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? 2
          : (level + (e.key === "ArrowRight" ? 1 : 2)) % 3;
    document.querySelector(`[data-level="${next}"]`).click();
  };
  document.querySelector("#complete").onclick = (e) => {
    if (completed.has(c.id)) completed.delete(c.id);
    else completed.add(c.id);
    write("tt-completed", [...completed]);
    const b = document.querySelector("#complete");
    b.className = "button " + (completed.has(c.id) ? "completed" : "primary");
    b.innerHTML =
      icon("check") + (completed.has(c.id) ? uz.completed : uz.complete);
  };
  const onboarding = () => {
    document.querySelector(".onboarding")?.remove();
    const box = document.createElement("div");
    box.className = "onboarding";
    box.setAttribute("role", "status");
    box.innerHTML = `${icon("help")}<p>${uz.onboarding}</p><button class="button primary">${uz.gotIt}</button>`;
    document.querySelector(".controls-card").append(box);
    box.querySelector("button").onclick = () => {
      box.remove();
      write("tt-onboarded", true);
    };
  };
  document.querySelector(".help-button").onclick = onboarding;
  if (!read("tt-onboarded", false)) onboarding();
  const loop = (now) => {
    if (last && playing && !c.static && !document.hidden) {
      t += Math.min((now - last) / 1000, 0.1) * speed;
      let end = c.duration;
      if (["fall", "projectile"].includes(c.key)) end = state.duration + 1;
      if (["motion", "friction"].includes(c.key) && Number.isFinite(state.stop))
        end = Math.min(end, state.stop + 1);
      if (t > end) {
        t = 0;
        chart?.reset(p);
      }
      update(false);
    }
    last = now;
    frame = requestAnimationFrame(loop);
  };
  update(true);
  frame = requestAnimationFrame(loop);
  cleanup = () => {
    cancelAnimationFrame(frame);
    canvas.destroy();
    chart?.destroy();
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
  const generation = ++routeGeneration;
  cleanup();
  cleanup = () => {};
  const raw = location.hash.slice(1) || "/",
    [path, query = ""] = raw.split("?");
  currentRoute = path;
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
      const module = await import(`./simulations/${c.section}/${c.id}.js`);
      if (generation !== routeGeneration) return;
      simPage(module.simulationConfig);
    } else planned(-1);
  } else planned(-1);
  setTimeout(() => {
    document.querySelectorAll('.sim-card, .hero-experiment, .learning-card, .result-card').forEach((el) => {
      attachBorderGlow(el, {
        edgeSensitivity: 30,
        glowColor: "14 88 55",
        backgroundColor: el.classList.contains('learning-card') || el.classList.contains('result-card') ? "#f7f8fa" : "#ffffff",
        borderRadius: 18,
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
}
window.addEventListener("hashchange", route);
window.addEventListener("keydown", (e) => {
  if (
    e.key === "/" &&
    !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
  ) {
    e.preventDefault();
    if (currentRoute !== "/topics") {
      location.hash = "/topics";
      setTimeout(() => document.querySelector("#catalog-search")?.focus(), 100);
    } else document.querySelector("#catalog-search")?.focus();
  }
});
await route();
