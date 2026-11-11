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
  await nav(page, "me"); await page.click("#meGear"); await page.clock.runFor(400);
  ok(await page.$eval("#meData", b => b.hidden), "a ghost can't edit or reset study data");
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

async function fixMyData(browser, base) {
  console.log("fix my data: edit a day, 12h cap, start fresh, Zinat's clean-up (fake Firebase)");
  const M = 60e3, prof = { goal: 150 };
  const seed = () => ({ squad: {
    profiles: { zinat: { ...prof }, milad: { ...prof }, niloufar: { ...prof }, arian: { ...prof }, farzad: { ...prof }, shaghayegh: { ...prof } },
    days: { "2026-10-20": { zinat: 50 * M, farzad: 30 * M }, "2026-11-05": { farzad: 70 * M, arian: 20 * M },
            "2026-11-08": { arian: 90 * M, milad: 60 * M }, "2026-11-09": { farzad: 80 * M } },
    skills: { "2026-10-20": { zinat: { reading: 50 * M } }, "2026-11-09": { farzad: { reading: 60 * M, listening: 20 * M } } },
    log: { farzad: { a: { day: "2026-10-20", at: 1, skill: "reading", ms: 30 * M }, b: { day: "2026-11-09", at: 2, skill: "reading", ms: 60 * M } },
           arian: { c: { day: "2026-11-08", at: 3, skill: "vocab", ms: 90 * M } } },
  } });
  const DB = page => page.evaluate(() => window.__FAKE_DB__.squad);
  const toastTxt = page => page.$eval("#toast", t => t.textContent);
  const boardLines = async page => Object.values((await DB(page)).board || {}).filter(b => b.kind === "fix").map(b => b.text);
  const noDenied = async (page, label) => { const d = await denied(page); ok(d.length === 0, `no refused writes (${label})${d.length ? " → " + d.join(", ") : ""}`); };
  const setHM = async (page, h, m) => { await page.fill("#dxH", String(h)); await page.fill("#dxM", String(m)); };
  const click = async (page, sel) => { await page.click(sel); await page.clock.runFor(500); };

  // Farzad edits Monday of this week
  let page = await openPage(browser, base, { mode: "db", when: DAYS.Wednesday, me: "farzad", db: seed() });
  await pickMe(page, "farzad"); await nav(page, "me"); await click(page, "#meGear");
  const days = await page.$$eval("#meData [data-dxedit]", b => b.map(x => x.dataset.dxedit));
  ok(days.join() === "2026-11-07,2026-11-08,2026-11-09,2026-11-10,2026-11-11", `only Sat → today can be edited (${days.join(", ")})`);
  await click(page, '[data-dxedit="2026-11-09"]'); await setHM(page, 2, 5); await click(page, '[data-dxsave="2026-11-09"]');
  let db = await DB(page);
  ok(db.days["2026-11-09"].farzad === 125 * M, "Monday saved as 2h 05m");
  ok(db.skills["2026-11-09"].farzad.reading === 60 * M && db.skills["2026-11-09"].farzad.listening === 20 * M, "more time: skills kept (the extra is untagged)");
  ok((await boardLines(page)).includes("Farzad edited Monday: 1h 20m → 2h 05m"), "board: \"Farzad edited Monday: 1h 20m → 2h 05m\"");
  await click(page, '[data-dxedit="2026-11-09"]'); await setHM(page, 0, 40); await click(page, '[data-dxsave="2026-11-09"]');
  db = await DB(page); const sk = db.skills["2026-11-09"].farzad;
  ok(db.days["2026-11-09"].farzad === 40 * M && sk.reading + sk.listening <= 40 * M && sk.reading === 30 * M, `less time: skills shrink by the same share (${sk.reading / M}m + ${sk.listening / M}m)`);
  // 12h cap
  await click(page, '[data-dxedit="2026-11-10"]'); await setHM(page, 12, 30); await click(page, '[data-dxsave="2026-11-10"]');
  ok(!((await DB(page)).days["2026-11-10"] || {}).farzad && /at most 12 hours/.test(await toastTxt(page)), "12h 30m is refused (12h cap)");
  await setHM(page, 12, 0); await click(page, '[data-dxsave="2026-11-10"]');
  ok((await DB(page)).days["2026-11-10"].farzad === 720 * M, "12h 00m is accepted");
  // a day outside this week (last Thursday) is refused even if asked for directly
  await page.evaluate(() => { const b = document.createElement("button"); b.dataset.dxsave = "2026-11-05"; b.id = "fakeSave"; document.getElementById("meData").appendChild(b); });
  await page.click("#fakeSave"); await page.clock.runFor(500);
  ok((await DB(page)).days["2026-11-05"].farzad === 70 * M && /Only days of this week/.test(await toastTxt(page)), "last week's Thursday can't be edited");
  ok(await page.$$eval("[data-dxclean]", x => x.length) === 0, "Farzad doesn't see Zinat's clean-up");
  await noDenied(page, "edit"); await finish(page, "edit");

  // Arian starts fresh from today
  page = await openPage(browser, base, { mode: "db", when: DAYS.Wednesday, me: "arian", db: seed() });
  await pickMe(page, "arian"); await nav(page, "me"); await click(page, "#meGear");
  await click(page, "[data-dxfresh]");
  ok((await DB(page)).days["2026-11-08"].arian === 90 * M, "nothing is deleted before confirming");
  await click(page, "[data-dxfreshgo]");
  db = await DB(page);
  ok(!db.days["2026-11-08"].arian && !(db.days["2026-11-05"] || {}).arian && !Object.keys((db.log || {}).arian || {}).length, "start fresh: Arian's days and log before today are gone");
  ok(db.days["2026-11-08"].milad === 60 * M && db.days["2026-11-05"].farzad === 70 * M, "start fresh: everyone else's data stays");
  ok(db.profiles.arian.freshFrom === "2026-11-11", "start fresh: Arian's road starts today");
  ok((await boardLines(page)).includes("Arian started fresh from today"), "board: \"Arian started fresh from today\"");
  await nav(page, "race");
  ok(await page.$$eval('.cl-slot[title^="Arian"]', x => x.length) === 0, "days before Arian's fresh start are not empty spots");
  await noDenied(page, "fresh"); await finish(page, "fresh");

  // Zinat's one-time clean-up before 7 Nov
  page = await openPage(browser, base, { mode: "db", when: DAYS.Wednesday, me: "zinat", db: seed() });
  await pickMe(page, "zinat"); await nav(page, "me"); await click(page, "#meGear");
  const sum = await page.$eval("#meData", b => b.textContent);
  ok(/2 days · 4 study entries · 1 log line/.test(sum), "Zinat sees what will be deleted (2 days · 4 study entries · 1 log line)");
  await click(page, "[data-dxclean]");
  ok(await page.$eval("[data-dxcleango]", b => b.disabled), "Delete stays off until 'I have a backup' is ticked");
  ok(/Export JSON/.test(await page.$eval("#meData", b => b.textContent)), "the confirm step says to export a backup first");
  await page.check("#dxBacked"); await page.clock.runFor(300);
  await click(page, "[data-dxcleango]");
  db = await DB(page);
  ok(Object.keys(db.days).sort().join() === "2026-11-08,2026-11-09", `only days from 7 Nov stay (${Object.keys(db.days).sort().join(", ")})`);
  ok(!db.skills["2026-10-20"] && db.skills["2026-11-09"], "skills before 7 Nov gone, after kept");
  ok(!db.log.farzad.a && db.log.farzad.b && db.log.arian.c, "log lines before 7 Nov gone, after kept");
  ok((await boardLines(page)).some(t => /cleared all study history before 7 Nov/.test(t)), "board line for the clean-up");
  ok(/Nothing left before/.test(await page.$eval("#meData", b => b.textContent)), "afterwards: nothing left to clear");
  await noDenied(page, "clean-up"); await finish(page, "clean-up");
}

async function mePlanning(browser, base) {
  console.log("ME: PLAN (main goal | weekly plan) · PROGRESS (week, time, road, tests + band chart) (fake Firebase)");
  const prof = { goal: 150 }, M = 60e3;
  const P4 = { L: [1, 1, 1, 1], R: [1, 1, 1], W: [1, 1], S: [1, 1, 1] };
  const db = { squad: { profiles: { zinat: prof, milad: prof, niloufar: prof, arian: prof, farzad: prof, shaghayegh: prof },
    main: { niloufar: { avgMin: 150, testsTarget: 25, targetBand: 7, examDate: "2027-03-06" } },
    days: { "2026-11-09": { niloufar: 90 * M } }, skills: { "2026-11-09": { niloufar: { listening: 60 * M, vocab: 30 * M } } },
    tests: { niloufar: { c17t1: { book: 17, test: 1, tries: { t1: { date: "2026-11-02", parts: P4, score: { L: 30, R: 33, W: 6, S: 6.5 } },
                                                               t2: { date: "2026-11-09", parts: P4, score: { L: 35, R: 35 } } } } } },
    mocks: { niloufar: { m1: { institute: "Safir", date: "2026-11-05", result: { L: 7, R: 7.5, W: 6, S: 6.5, overall: 7 } } } } } };
  const page = await openPage(browser, base, { mode: "db", when: DAYS.Wednesday, me: "niloufar", db });
  const click = async sel => { await page.click(sel); await page.clock.runFor(400); };
  const screen = () => page.evaluate(() => document.querySelector(".screen.on").id);
  const visible = sel => page.$eval(sel, el => !!el.offsetParent).catch(() => false);
  await pickMe(page, "niloufar"); await nav(page, "me");
  ok(await page.$eval('[data-mtab="plan"]', b => b.classList.contains("on")), "ME opens on PLAN");
  ok(await visible('#mePlan [data-gtab="main"]') && await visible('#mePlan [data-gtab="week"]'), "PLAN shows MAIN GOAL | WEEKLY PLAN right at the top");
  ok(await visible("#glWeek") && !(await visible("#meBody")), "PLAN opens on the weekly plan; no progress cards on PLAN");
  await click('#mePlan [data-gtab="main"]');
  ok(await screen() === "me" && await visible("#glMain") && /Mock exams/.test(await page.$eval("#glMain", x => x.textContent)), "MAIN GOAL (with mock exams) opens inside ME, no other page");
  await click('#mePlan [data-gtab="week"]');
  await click('#glWeek [data-gact="wk+"]');
  ok(/14 Nov/.test(await page.$eval("#glWeek", x => x.textContent)) && /filled in from your main goal/.test(await page.$eval("#glWeek", x => x.textContent)), "PLAN NEXT WEEK opens next week in the same place");
  await click('[data-gact="saveweek"]');
  const saved = await page.evaluate(() => { const p = window.__FAKE_DB__.squad.plans; return p && p["2026-11-14"] && p["2026-11-14"].niloufar; });
  ok(saved && saved.daily === 150, "next week's daily goal = main goal (2h 30), saved");
  await click('[data-mtab="prog"]');
  ok(await visible("#meBody .mx-wrow") && await page.$$eval("#meBody .mx-dots", x => x.length) === 0, "PROGRESS has this week (hours only, no skill dots)");
  ok(await visible('#meBody [data-mact="addtest"]') && await visible("#meBody .mx-sbar") && await visible('#meBody [data-mact="road"]'), "PROGRESS: time split, road, practice tests");
  ok(!/Mock exams &/.test(await page.$eval("#meBody", x => x.textContent)), "no mock row in PROGRESS (mocks are planned in MAIN GOAL)");
  const lines = await page.$$eval("#meBody .sc-svg polyline", x => x.length);
  ok(lines === 5, `band chart: a line for L, R, W, S and overall (${lines})`);
  const det = await page.$eval("#meBody .sc-det", x => x.textContent);
  ok(/C17·T1/.test(det) && /L 8 · R 8/.test(det), `the last point is shown: 35/40 → band 8 (${det.trim()})`);
  await click('#meBody [data-sci="1"]');
  ok(/Mock · Safir/.test(await page.$eval("#meBody .sc-det", x => x.textContent)) && /Overall 7/.test(await page.$eval("#meBody .sc-det", x => x.textContent)), "tap a point: the mock's bands + overall");
  await click('#meBody [data-mact="alltests"]');
  ok(await page.$$eval("#txBody .sc-svg", x => x.length) === 1, "the band chart is on top of PRACTICE TESTS too");
  const d = await denied(page); ok(d.length === 0, `no refused writes (planning)${d.length ? " → " + d.join(", ") : ""}`);
  await finish(page, "planning");
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
    await fixMyData(browser, base);
    await mePlanning(browser, base);
  } catch (e) { ok(false, "test crashed: " + e.message); }
  await browser.close(); srv.close();
  console.log(failed ? `\n${failed} check(s) FAILED` : "\nall checks passed");
  process.exit(failed ? 1 : 0);
})();
