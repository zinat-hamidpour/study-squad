// Smoke tests for Study Squad. Run: npm test   (or: node tests/smoke.cjs)
// Opens the real index.html in headless Chromium. Firebase is never contacted:
//  - "demo" pages block the Firebase SDK, so the app falls back to its demo data;
//  - "db" pages get tests/fake-firebase/, which enforces the live database rules.
// Exits 1 on any failed check, page error, or database write the rules would refuse.
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");

const ROOT = path.join(__dirname, "..");
const FAKE = path.join(__dirname, "fake-firebase");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png" };
let failed = 0;
const ok = (cond, msg) => { console.log(`${cond ? "  ✓" : "  ✗"} ${msg}`); if (!cond) failed++; };

// ---- static checks (no browser) ----
function staticChecks() {
  console.log("versions");
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const appV = (html.match(/const APP_VERSION = "([^"]+)"/) || [])[1];
  const fileV = JSON.parse(fs.readFileSync(path.join(ROOT, "version.json"), "utf8")).version;
  const assetsV = (html.match(/<script src="assets\.js\?v=([^"]+)"/) || [])[1];
  ok(appV && appV === fileV, `APP_VERSION (${appV}) = version.json (${fileV})`);
  ok(appV && appV === assetsV, `assets.js?v= (${assetsV}) = APP_VERSION (${appV})`);
}

// ---- helpers ----
function serve() {
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split("?")[0]);
    const f = path.join(ROOT, u === "/" ? "index.html" : u);
    if (!f.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
    fs.readFile(f, (e, d) => {
      if (e) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); r.end(d);
    });
  });
  return new Promise(res => srv.listen(0, () => res(srv)));
}

async function openPage(browser, base, { mode, when, me, db }) {
  const ctx = await browser.newContext({ viewport: { width: 400, height: 860 } });
  if (mode === "db") {
    await ctx.route(/firebase-app\.js/, r => r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(path.join(FAKE, "firebase-app.js"), "utf8") }));
    await ctx.route(/firebase-database\.js/, r => r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(path.join(FAKE, "firebase-database.js"), "utf8") }));
    await ctx.addInitScript(s => { window.__FAKE_DB__ = JSON.parse(s); }, JSON.stringify(db || {}));
  } else {
    await ctx.route(/gstatic\.com|firebaseio|firebasedatabase|googleapis/, r => r.abort());
  }
  if (me) await ctx.addInitScript(id => { if (!localStorage.getItem("squad-me")) { localStorage.setItem("squad-me", id); localStorage.setItem("squad-trusted", JSON.stringify([id])); } }, me);
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", e => page.errors.push(e.message));
  await page.clock.install({ time: new Date(when) });
  await page.goto(base + "/");
  await page.clock.runFor(2500);
  return page;
}
const nav = async (page, screen) => { await page.evaluate(s => document.querySelector(`[data-nav="${s}"]`)?.click(), screen); await page.clock.runFor(400); };
const pickMe = async (page, id) => { await page.evaluate(i => document.querySelector(`#tiles [data-id="${i}"]`)?.click(), id); await page.clock.runFor(600); };
const denied = page => page.evaluate(() => window.__DENIED__ || []);
const finish = async (page, label) => {
  ok(page.errors.length === 0, `${label}: no page errors${page.errors.length ? " → " + page.errors.join(" | ") : ""}`);
  await page.context().close();
};

// ---- browser checks ----
// Tehran times. Week of 7 Nov 2026: Sat 7 … Thu 12, Fri 13 (party day).
const DAYS = { "Saturday": "2026-11-07T10:00:00+03:30", "Wednesday": "2026-11-11T21:00:00+03:30",
               "Friday": "2026-11-13T20:00:00+03:30", "next Saturday": "2026-11-14T10:00:00+03:30" };

async function screensEveryDay(browser, base) {
  console.log("all screens on different days (demo data)");
  for (const [name, when] of Object.entries(DAYS)) {
    const page = await openPage(browser, base, { mode: "demo", when, me: "niloufar" });
    await pickMe(page, "niloufar");
    for (const s of ["home", "race", "hall", "me"]) await nav(page, s);
    await nav(page, "hall");
    await page.evaluate(() => document.querySelector(".cupbtn")?.click()); await page.clock.runFor(300);
    const cups = await page.$$eval("#cupList .cup-row", r => r.length);
    ok(cups >= 1, `${name}: the first cup is on the shelf (${cups} in the list)`);
    await finish(page, name);
  }
}

async function lanternGift(browser, base) {
  console.log("lantern: give one to a friend (demo data, Wednesday)");
  const page = await openPage(browser, base, { mode: "demo", when: DAYS.Wednesday, me: "niloufar" });
  await pickMe(page, "niloufar"); await nav(page, "race");
  const before = await page.$$eval(".cl-spot", x => x.length);
  ok(before > 0, `a friend's missed day can be lit (${before} spot${before === 1 ? "" : "s"})`);
  if (before) {
    await page.click(".cl-spot"); await page.clock.runFor(300);
    await page.click("[data-lgive]"); await page.clock.runFor(600);
    ok(await page.$$eval(".cl-spot", x => x.length) === 0, "after giving, no lantern is left to give");
  }
  await finish(page, "lantern");
}

async function writesUnderRules(browser, base) {
  console.log("writes against the live database rules (fake Firebase)");
  const prof = { goal: 150 };
  const db = { squad: { profiles: { zinat: prof, milad: prof, niloufar: prof, arian: prof, farzad: prof, shaghayegh: prof } } };
  // a new ghost guest
  let page = await openPage(browser, base, { mode: "db", when: DAYS.Wednesday, db });
  await page.click("#ghDoor"); await page.fill("#ghName", "Mahsa"); await page.fill("#ghPw", "abcd");
  await page.click("#ghCols [data-hue]:not([disabled])"); await page.click("#ghGo"); await page.clock.runFor(1500);
  const ghosts = await page.evaluate(() => Object.values((window.__FAKE_DB__.squad || {}).ghosts || {}).map(g => g.name));
  ok(ghosts.includes("Mahsa"), "a new ghost is saved");
  ok((await denied(page)).length === 0, `no refused writes (ghost)${(await denied(page)).length ? " → " + (await denied(page)).join(", ") : ""}`);
  await finish(page, "ghost");
  // the Friday plan
  page = await openPage(browser, base, { mode: "db", when: DAYS.Wednesday, me: "zinat", db });
  await pickMe(page, "zinat"); await nav(page, "race");
  await page.click("#clPlanEd"); await page.fill("#clPlanIn", "kebab + games"); await page.press("#clPlanIn", "Enter"); await page.clock.runFor(600);
  const plan = await page.evaluate(() => Object.values((window.__FAKE_DB__.squad || {}).party || {}).map(p => p.text));
  ok(plan.includes("kebab + games"), "the Friday plan is saved");
  ok((await denied(page)).length === 0, `no refused writes (plan)${(await denied(page)).length ? " → " + (await denied(page)).join(", ") : ""}`);
  await finish(page, "plan");
}

async function backButton(browser, base) {
  console.log("Back button: sheet first, then HOME, then out of the app (demo data)");
  const page = await openPage(browser, base, { mode: "demo", when: DAYS.Wednesday, me: "niloufar" });
  await pickMe(page, "niloufar");
  const back = async () => { await page.evaluate(() => history.back()); await page.clock.runFor(400); };
  const where = () => page.evaluate(() => ({ s: document.querySelector(".screen.on")?.id, ovl: [...document.querySelectorAll(".ovl.on")].map(o => o.id) }));
  ok((await where()).s === "home", "signed in → HOME");
  await nav(page, "race"); await back();
  ok((await where()).s === "home", "CLIMB → Back → HOME");
  await nav(page, "me"); await nav(page, "race"); await nav(page, "speak"); await back();
  ok((await where()).s === "home", "ME → CLIMB → SPEAK → Back → HOME (one step, not a trail)");
  await nav(page, "hall");
  await page.evaluate(() => document.querySelector(".cupbtn")?.click()); await page.clock.runFor(300);
  ok((await where()).ovl.includes("cupsModal"), "cups open in the hall");
  await back();
  let w = await where();
  ok(w.s === "hall" && w.ovl.length === 0, `Back closes the cups first and stays in the hall (${w.s}, [${w.ovl}])`);
  await back();
  ok((await where()).s === "home", "Back again → HOME");
  // a sheet closed with its own ✕ must not leave an extra Back behind
  await nav(page, "hall");
  await page.evaluate(() => document.querySelector(".cupbtn")?.click()); await page.clock.runFor(300);
  await page.evaluate(() => document.querySelector("#cupsModal [data-close]")?.click()); await page.clock.runFor(300);
  await back();
  ok((await where()).s === "home", "cups closed with ✕, then Back → HOME");
  // the in-app ‹ back to HOME steps the history back too
  await nav(page, "race"); await page.click("#raceBack"); await page.clock.runFor(400);
  ok(await page.evaluate(() => (history.state && history.state.ssd) || 0) === 0, "‹ back to HOME leaves no extra history entry");
  await finish(page, "back");
}

async function backLeavesApp(browser, base) {
  const page = await openPage(browser, base, { mode: "demo", when: DAYS.Wednesday, me: "niloufar" });
  await pickMe(page, "niloufar");
  await nav(page, "me"); await page.evaluate(() => history.back()); await page.clock.runFor(400);
  await page.evaluate(() => history.back()).catch(() => {}); // the page goes away: that is the point
  await page.waitForURL("about:blank", { timeout: 3000 }).catch(() => {});
  ok(page.url() === "about:blank", `on HOME, Back leaves the app (${page.url()})`);
  await page.context().close();
}

(async () => {
  staticChecks();
  const srv = await serve(), base = `http://localhost:${srv.address().port}`;
  // CI uses the Google Chrome that GitHub's Ubuntu runner already has (PW_CHANNEL=chrome): no browser download
  const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  try {
    await screensEveryDay(browser, base);
    await lanternGift(browser, base);
    await writesUnderRules(browser, base);
    await backButton(browser, base);
    await backLeavesApp(browser, base);
  } catch (e) { ok(false, "test crashed: " + e.message); }
  await browser.close(); srv.close();
  console.log(failed ? `\n${failed} check(s) FAILED` : "\nall checks passed");
  process.exit(failed ? 1 : 0);
})();
