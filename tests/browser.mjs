// Run with PLAYWRIGHT_MODULE pointing to an installed playwright package, or install it locally.
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { allConfigs } from "../src/data/configs.js";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || "chrome",
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const errors = [],
  badResponses = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("response", (r) => {
  if (r.status() >= 400) badResponses.push(r.url() + " " + r.status());
});
await mkdir("test-results", { recursive: true });
const base = process.env.BASE_URL || "http://127.0.0.1:5173";
await page.goto(base);
await page.waitForSelector("#hero-canvas");
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
  path: "test-results/home-desktop.png",
  fullPage: true,
});
await page.locator("#hero-force").fill("50");
assert.equal(await page.locator("#hero-accel").textContent(), "10.00");
const audit = [],
  scenes = [];
for (const c of allConfigs) {
  await page.goto(base + "/#/sim/" + c.id);
  await page.waitForFunction(
    (title) => document.querySelector("h1")?.textContent.trim() === title,
    c.title,
  );
  await page.waitForSelector("#sim-canvas");
  if (
    await page.getByRole("button", { name: "Tushunarli", exact: true }).count()
  )
    await page.getByRole("button", { name: "Tushunarli", exact: true }).click();
  for (let level = 0; level < 3; level++) {
    await page.locator(`[data-level="${level}"]`).click();
    await page.waitForSelector("#sim-canvas");
    const sliders = page.locator("[data-param]");
    for (let i = 0; i < (await sliders.count()); i++) {
      const slider = sliders.nth(i);
      for (const end of ["min", "max"])
        await slider.fill(await slider.getAttribute(end));
    }
    const numbers = await page.locator("[data-result]").allTextContents();
    assert.ok(
      numbers.every((s) => !s.includes("NaN")),
      "NaN in " + c.id,
    );
    if (level > 0)
      assert.ok(
        (await page.locator("#charts canvas").count()) > 0,
        "Chart missing in " + c.id,
      );
    assert.equal(
      await page.locator(".katex-error").count(),
      0,
      "KaTeX error in " + c.id,
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "Desktop overflow in " + c.id,
    );
    audit.push({
      id: c.id,
      level,
      sliders: await sliders.count(),
      results: numbers,
    });
  }
  if (c.key === "newton")
    await page.screenshot({
      path: "test-results/newton-desktop.png",
      fullPage: true,
    });
  await page.locator('[data-level="1"]').click();
  if (!c.static) {
    await page.locator("#play").click();
    await page.waitForFunction(
      () => Number(document.querySelector("#sim-time")?.textContent) > 0.7,
    );
    await page.locator("#play").click();
  }
  scenes.push({
    title: c.title,
    png: (await page.locator("#sim-canvas").screenshot()).toString("base64"),
  });
}
const board = await browser.newPage({
  viewport: { width: 1440, height: 1550 },
});
await board.setContent(
  `<html><style>body{margin:0;padding:20px;background:#eef2f5;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font:14px Arial}section{background:white;border-radius:8px;overflow:hidden}h3{font-size:13px;padding:12px;margin:0;color:#24394b}img{width:100%;display:block}</style>${scenes.map((s) => `<section><h3>${s.title}</h3><img src="data:image/png;base64,${s.png}"></section>`).join("")}</html>`,
);
await board.screenshot({
  path: "test-results/simulations-board.png",
  fullPage: true,
});
await board.close();
await page.goto(base + "/#/sim/nyuton-2-qonun");
await page.waitForSelector("#sim-canvas");
await page.locator('[data-level="1"]').click();
await page.locator('[data-level="1"]').press("ArrowRight");
assert.equal(
  await page.locator('[data-level="2"]').getAttribute("aria-selected"),
  "true",
);
await page.locator("#play").click();
await page.waitForFunction(
  () => Number(document.querySelector("#sim-time")?.textContent) > 0.3,
);
await page.locator("#play").click();
const paused = await page.locator("#sim-time").textContent();
await page.waitForTimeout(150);
assert.equal(await page.locator("#sim-time").textContent(), paused);
await page.locator("#reset").click();
assert.equal(await page.locator("#sim-time").textContent(), "0.00");
await page.locator('[data-number="m"]').fill("-10");
await page.locator('[data-number="m"]').blur();
assert.equal(await page.locator('[data-param="m"]').inputValue(), "0.5");
await page.locator(".header-search-toggle").click();
await page.locator(".header-search-panel input").fill("Kulon");
await page.locator(".header-search-results a").first().click();
await page.waitForSelector('[data-param="q1"]');
await page.goto(base + "/#/sim/linza-formulasi");
await page.waitForSelector("#sim-canvas");
await page.locator('[data-param="focal"]').fill("0.5");
await page.locator('[data-param="object"]').fill("0.5");
assert.ok(
  (await page.locator("#result-status").textContent()).includes("fokusda"),
);
await page.goto(base + "/#/sim/burchak-ostida-otish");
await page.waitForSelector("#save-trail");
await page.locator("#save-trail").click();
await page.locator('[data-param="angle"]').fill("60");
assert.ok((await page.locator("#sim-notice").textContent()).includes("1/4"));
await page.locator("#clear-trail").click();
assert.equal(await page.locator("#sim-notice").textContent(), "");
await page.locator("#complete").click();
await page.reload();
await page.waitForSelector("#complete");
assert.ok(
  (await page.locator("#complete").textContent()).includes("O‘rganildi"),
);
await page.goto(base + "/#/topics");
await page.waitForSelector("#catalog-search");
await page.locator("#catalog-search").fill("Om");
assert.ok(
  (await page.locator(".topic-row h3").allTextContents()).some((s) =>
    s.includes("Om qonuni"),
  ),
);
await page.locator("#catalog-search").fill("zzzz_nonexistent");
assert.equal(await page.locator(".topic-row").count(), 0);
await page.locator("#clear-search").click();
assert.equal(await page.locator(".topic-row").count(), 143);
await page.goto(base + "/#/topic/2");
await page.waitForSelector(".source-notes");
for (const width of [390, 320]) {
  await page.setViewportSize({ width, height: 844 });
  for (const route of [
    "/",
    "/topics",
    "/sections",
    "/progress",
    "/about",
    ...allConfigs.map((c) => "/sim/" + c.id),
  ]) {
    await page.goto(base + "/#" + route);
    await page.waitForSelector("h1");
    if (route.startsWith("/sim/")) {
      await page.waitForSelector("#sim-canvas");
      await page.locator('[data-level="2"]').click();
    }
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `Mobile overflow: ${width} ${route}`,
    );
  }
  if (width === 390) {
    await page.goto(base);
    await page.waitForSelector("#hero-canvas");
    await page.screenshot({
      path: "test-results/home-mobile.png",
      fullPage: true,
    });
    await page.goto(base + "/#/sim/nyuton-2-qonun");
    await page.waitForSelector("#sim-canvas");
    await page.locator('[data-level="1"]').click();
    await page.screenshot({
      path: "test-results/newton-mobile.png",
      fullPage: true,
    });
  }
}
await writeFile(
  "test-results/browser-audit.json",
  JSON.stringify({ audit, errors, badResponses }, null, 2),
);
assert.deepEqual(errors, []);
assert.deepEqual(badResponses, []);
console.log(
  `PASS: ${audit.length} simulation-level combinations, 2 mobile widths, search, progress, focus singularity, ghost trails, no runtime or asset errors.`,
);
await browser.close();
