# Study Squad

A study-together web app for six friends preparing for IELTS (Milad, Shaghayegh, Farzad, Niloufar, Arian, Zinat)
plus up to 10 read-only "ghost" guests. Static site on **GitHub Pages, served from `main`**: merging to `main` = live
on everyone's phone. No build step, no framework. Data lives in Firebase Realtime Database (`study-squad1`).

The owner (Zinat) is learning Git and Claude Code: explain each Git step in one line, in Persian, as you do it.

## Files

| File | What | How to read it |
|---|---|---|
| `index.html` | the whole app: CSS (top ~660 lines), HTML screens, one `<script type="module">` | **~3,200 lines. Never read it whole.** Grep the section header, then read only that range |
| `assets.js` | `window.ASSETS` = pixel art as base64 PNGs + layout numbers | **Never read it.** Lines are huge base64. Grep key names only: `grep -o 'ASSETS\.[a-zA-Z]*' assets.js` |
| `version.json` | `{"version": "..."}`, polled by phones to show the "new version" banner | |
| `CHANGES.md` | release notes, newest on top | |
| `tests/smoke.cjs` | smoke tests (headless Chromium) | `npm test` |
| `tests/fake-firebase/` | in-memory Firebase that enforces the live rules | |

Section headers inside `index.html` (grep these: `grep -n -- '-------- \|======== ' index.html`):
data store · time math · session actions · ghost guests · routing · start / sign-in / setup · profile ·
MY GOALS · ME, MY ROAD · PRACTICE TESTS · daily reminder · pixel icons · render: home ·
the climb (together) · notes + board · render: hall · events · update check · boot.

## Rules that broke production before (do not repeat)

1. **Bump the version in three places together**, in every PR that changes app files:
   `const APP_VERSION` (top of the module in `index.html`), `version.json`, and `<script src="assets.js?v=...">`.
   Format `YYYY.MM.DD-N`. If they differ, phones run a new `index.html` with an old cached `assets.js` → white page.
   `npm test` checks this.
2. **Database writes must target `squad/<section>/<key>` or deeper.** The live rules refuse writes to `squad` or to a
   whole section (e.g. a transaction on `squad/ghosts`). New sections need no rule change.
   Rules (Firebase console → Realtime Database → Rules):
   `{"rules":{"squad":{".read":true,"$section":{"$key":{".write":true}}}}}`
3. **Change files in place; never replace them wholesale** with copies made elsewhere. Files built from an old copy
   silently undid a merged fix once. Always start from the latest `main`.
4. Anything `index.html` needs at startup from `assets.js` must have a fallback (`A.x || {}`): a missing asset must
   not stop the app from booting.
5. New data under `squad/` must also be added to the `state = {...}` defaults in **both** `makeFirebaseStore()` and
   `makeDemoStore()`, and to the demo seed if the feature needs data to show.

## Conventions

- Time: Tehran (UTC+3:30); the day flips at **04:00** (`dayKey`, `SHIFT`). The week starts **Saturday** (`weekStart`).
  Friday is party day.
- UI text in English. Pixel style; fonts Pixelify Sans + Nunito.
- Keep changes surgical: edit the relevant function, don't reformat or reorder unrelated code.
- `CUP_START = "2026-11-07"`: the first cup stands for that week; earned cups start the week after.

## Workflow

1. `git checkout main && git pull`, then a branch: `feature/<name>` or `fix/<name>`. One purpose per branch.
2. Make the change. Bump the version (rule 1). Add a section on top of `CHANGES.md`.
3. `npm test` must pass. For a new feature, add a check to `tests/smoke.cjs`.
   In a Claude Code cloud session Playwright is preinstalled: just `node tests/smoke.cjs`.
4. Commit, push, open a PR into `main`. **Never merge**: Zinat checks it on her phone first.
   CI (`.github/workflows/test.yml`) runs the same tests on every PR.

Demo mode: if Firebase can't load, the app runs on local demo data (yellow "DEMO MODE" bar). Tests use this.
