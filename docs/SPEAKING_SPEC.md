# Study Squad — Speaking Corner spec (v2)

> For Claude Code. Read this whole spec, `content/weeks/SCHEMA.md` and `docs/mockups/`, then explore the existing repo before writing code.
> **CLAUDE.md wins over this spec** wherever they differ (version bump, write paths, state defaults, no emoji, design tokens, workflow).
> Match the existing stack (single `index.html`, no build step), auth, member identity and styles. Do not add a framework or a heavy library.

## 0. Context & hard constraints
- 6 members: Zinat, Milad, Shaghayegh, Farzad, Niloufar, Arian. Spirit = companionship, not competition. No leaderboards, no rankings, no “fastest wins”.
- Backend stays **Firebase Realtime Database** on the Spark (free) plan. **No Firebase Storage, no Blaze, no Cloud Functions.**
- Voices live under a **separate root `voices/`**, never under `squad/`. Metadata (lists, reactions, feedback) lives under `squad/speaking/` so lists load without downloading audio.
- **The live rules only allow `squad/…`, so `voices/` needs a rules addition** (see §6). Write the new full rules JSON in the PR description and in CLAUDE.md; Zinat publishes it in the Firebase console **before** merging slice 2. Add the same rule to `tests/fake-firebase/`.
- Anonymous Auth + rules `auth != null` (PR `feature/anon-auth`) must be merged first. If not merged, stop and tell me.
- Before any change to DB rules: export a JSON backup.
- Mobile-first: most use is on phones, including iPhone Safari.

## 1. What already exists in this pack (do not regenerate)
- `content/weeks/week-01-crime.json`: full Week 1 content (3 vocabulary levels, Part 1/2/3 questions with band 6/7/8 model answers, 30 test questions).
- `content/weeks/SCHEMA.md`: field reference.
- `tools/book/build_book.py`: builds `books/<id>.html` (swipeable flip-book) and `<id>.pdf` (A5) from a week JSON.
- `books/week-01.html` and `week-01.pdf`: already built.
- `docs/mockups/`: UI references. **`mock-speaking-journey.png` is the final reference.**

## 2. The weekly loop (“case file”)
Each week = one topic = one case file with **6 stamps**:
1. Part 1 sent
2. Part 2 sent
3. Part 3 sent
4. Easy test passed (Level 1 · The Scene)
5. Medium test passed (Level 2 · The Verdict)
6. Strong test passed (Level 3 · The Defence)

Pass = 7/10 or more. Order is suggested, **not locked**.

- **The book is readable from day 1.** It is the study material, so never lock it.
- Closing the case adds the CASE CLOSED stamp to *your* copy on the shelf, puts your avatar in “closed by”, and plays the case-closed moment.

Active week = the JSON whose `start`–`end` contains today (Asia/Tehran). Past weeks stay on the shelf and stay readable.

## 3. Screens (follow `docs/mockups/`)

### 3.1 Speaking Corner (hub)
- Header “SPEAKING CORNER” and a “Week N” pill.
- Case file card: “CASE FILE #01 · THIS WEEK’S CASE · CRIME”, `n/6 to close the case`, red progress bar.
- **No book button in the hall.** Books open only from the shelf in the Study Hall (3.8).
- **Speak**: Part 1 / Part 2 / Part 3 rows. Each row is done (green check, “voice sent · 2 friends reacted”), current (lavender, GO ›) or upcoming.
- **Word tests**: 3 tiles.
  - Easy 5.5–6 · The Scene
  - Medium 6.5–7 · The Verdict
  - Strong 7.5–8 · The Defence
  - Each tile shows your best score.
- “Case closed by”: 6 avatars, greyed until that member closes the case.

### 3.2 Part 1: quick questions (6)
- Stage illustration shrinks to a compact strip (max ~120px) during questions, so the question and the mic stay above the fold.
- Show 6 progress segments.
- Question card: “QUESTION 2 OF 6 · answer in 20–30 sec”, then the optional `tip` and the `chips`.
- Mic button. While recording, show:
  - a waveform and timer;
  - a bar with “sweet spot 0:20–0:30”.
  - Recording stops automatically at 0:40.
- Redo and Skip are allowed.
- **Model**: hidden until the first recording of that question exists (try first, then compare). It opens a sheet with 3 tabs: **Band 6 / Band 7 / Band 8**.
  - Default tab = one band above the member’s last passed test level (default Band 7).
  - Render `**word**` as highlighted.
- After question 6:
  - Summary “6 / 6 ANSWERED · total · average”.
  - A list with play and duration for each answer.
  - “Redo one” and “SEND TO SQUAD ▶”. Sending stamps the case.

### 3.3 Part 2: cue card
- Cue card: `cue`, `points`, `explain`.
- **Prep (1:00)**:
  - ring timer;
  - 4 step boxes (`steps`), using `plan` as placeholder text, with the hint “one keyword per step — no sentences!”;
  - “START TALKING NOW ▶” skips the rest of the prep.
- **Talking (up to 2:00)**:
  - ring timer;
  - the 4 keyword boxes stay visible and the current one is highlighted (tap a box to advance, or it auto-advances every 30s);
  - “Try to use” chips from `phrases`;
  - Redo / Done. Recording stops automatically at 2:00.
- Model: the same 3-band sheet, unlocked after the first recording.

### 3.4 Part 3: discussion (pick 3 of 8)
- The member picks 3 of the 8 questions. Header: “QUESTION 2 OF 3 · your pick · 30–45 sec”.
- “Build your answer” chips from `structure.steps`. They are a visual guide only.
- **Opener suggestion**: one of `openers` the member hasn’t used yet this week, e.g. “(you used ‘I’m in two minds’ in Q1)”. The member taps the opener they used; store it in localStorage per week.
- Ideas button shows the question’s `chips`. The Model button follows the same rule as Part 1.

### 3.5 Listen back (after each Part is sent)
- Banner: “✓ Part 2 sent · case file 2/6 stamped”.
- Your own player.
- **Self-check** (private, stored in localStorage):
  - automatic ✓ for “Spoke for X”, and for Part 2 “All 4 steps covered”;
  - manual boxes from `selfCheck.pN`;
  - caption “Tick the self-check honestly — it’s for you.”
- **The squad’s answers**: one row per member answer, newest first.
  - Each row: avatar, name · part · duration, when, play.
  - 4 reactions drawn as **pixel icons** (clap, flame, bulb, laugh; add them to `ICONS`), never emoji. One per person per answer, toggle.
- **Feedback card under each answer** (first-class, not a banner):
  - “One thing they did well” (text, max 140 chars);
  - “One word to upgrade”: chips from this week’s words plus free text.
  - Visible only to the answer’s owner and the person who wrote it.
  - Nudge: “Give feedback on 2 answers”.
- No “AI feedback” chip in v1.

### 3.6 Word tests
- Level pill, 10 progress dots (green right / pink wrong), “5 / 10”.
- Question card with 2×2 options and instant feedback: correct = green ✓, wrong = pink strikethrough, then the `explain` box and NEXT ›.
- Result screen with the score. A score of 7 or more stamps the case. Retakes are allowed; keep the best score.

### 3.7 Case closed
- Header “WEEK 1 · CRIME”.
- Case file card with the red “CASE CLOSED · ALL 6 DONE” stamp and confetti. Show it once.
- Stats: parts recorded · words right (sum of best scores, /30) · total speaking time.
- Card: “The Crime book is stamped and on the shelf.” (the book itself opens only from the shelf)
- Buttons: “See it on the shelf” / “DOWNLOAD PDF”.

### 3.8 Book reader + Study Hall shelf
- **Reader**: a full-screen route that shows `books/<weekId>.html` in an iframe, with the app’s back button on top. It already swipes page by page on phones and supports arrow keys. Do not rebuild the book as components.
- **Download**: a link to `books/<weekId>.pdf` with the `download` attribute.
- **Bookcase** (the painted bookcase in the Study Hall scene, no separate shelf card):
  - Every week that has started turns one painted book into a **real** book in the **second row, from the left** (Week 1 = Crime is the first). When the left compartment is full, the next books continue in the middle and right compartments of the same row.
  - A real book: red cloth, gold bands, gold mark. The current week has a small yellow tag above it: “NEW · CRIME”.
  - Tapping the book (or its tag) opens a sheet: cover, title, week and dates, the line “47 words · 3 levels · Part 1–3 models · 30-question word tests”, avatars that closed it, and the buttons “Read” / “DOWNLOAD PDF”.

## 4. Recording (the risky part: build and test this first)
- `MediaRecorder` with mimeType detection: prefer `audio/webm;codecs=opus`, fall back to `audio/mp4` (iOS Safari). Store the mime with each clip.
- Use `audioBitsPerSecond: 24000`, mono.
- Ask for the mic only on the first tap. If permission is denied, show a clear message.
- Save each clip as base64 in RTDB, one node per clip. Reject clips longer than 2:10.
- Load audio **only when play is pressed**, never with lists.
- Own clips get a “⬇ save my voice” button (download as a file).
- Test on iPhone Safari and Android Chrome before calling the recorder slice done.

## 5. Voice retention: 2 weeks
- A week’s voices are deleted **14 days after that week’s `end` date**. Week 1 (ends 21 Nov) is deleted from 5 Dec.
- No Cloud Functions on Spark, so cleanup runs on the client: on app open, any signed-in member deletes `voices/{weekId}` for every week where `today > end + 14 days`. It must be idempotent and safe if two members run it at the same time.
- Rules: deleting an expired week is allowed for any authenticated member (check against `squad/speaking/weeks/{weekId}/end`, written when the week first loads). Writing to `voices/{weekId}/{memberId}` is allowed only for that member.
- Metadata (answers, reactions, feedback, progress) is **kept**.
  - Players for expired clips show “voice expired · feedback kept”.
  - The hub and Listen back show a small line: “Voices are kept for 2 weeks after the week ends.”

## 6. Data model (RTDB)
```
voices/{weekId}/{memberId}/{clipId}: { data, mime, dur, at }

squad/speaking/weeks/{weekId}: { end }
squad/speaking/{weekId}/answers/{memberId}/{clipId}: { part: 1|2|3, qId, dur, at, sent: bool }
squad/speaking/{weekId}/progress/{memberId}: { p1, p2, p3, easy, medium, strong, closedAt }
squad/speaking/{weekId}/reactions/{memberId_clipId}/{fromMemberId}: "clap" | "flame" | "bulb" | "laugh"
squad/speaking/{weekId}/feedback/{memberId_clipId}/{fromMemberId}: { well, upgrade, at }
```
- Self-check and used openers are stored in localStorage only.
- Every new `squad/` key is also added to the `state` defaults in **both** `makeFirebaseStore()` and `makeDemoStore()`, plus demo seed data (CLAUDE.md rule 5).
- Proposed `voices` rule to add next to `squad`:
  `"voices":{"$week":{".read":"auth != null",".write":"auth != null && !newData.exists()","$member":{"$clip":{".write":"auth != null"}}}}`
  (the week-level write allows only deleting a whole week, for cleanup). Member ownership is enforced in the client, like the rest of the app.
- Rules:
  - `auth != null` everywhere;
  - a member writes only their own `answers`, `progress` and `voices`, and only their own `fromMemberId` key in reactions and feedback;
  - a feedback node is readable only by the answer’s owner and its author.
- Use the existing member identity mapping in the repo.

## 7. Visual style
Use CLAUDE.md → Design system: Pixelify Sans + Nunito; `--ink`, `--cream`, `--card`, `--lav`, `--yellow`, `--green`; cards 2.5px border, 18px radius; hard ink shadow under buttons; pixel icons only, no emoji.
- Speaking skill colour `#F6D772`. Level colours: 1 green, 2 lavender, 3 yellow.
- Record button and CASE CLOSED stamp: red `#E0504A`. Wrong answer: pink `#F2A3AE`.

## 8. Build in slices: one branch and one PR per slice, each usable on its own
1. `feature/speaking-content` (the pack itself is already in the repo from PR `feature/speaking-pack`):
   - JSON loader and active-week logic;
   - Speaking Corner hub with static states;
   - book reader;
   - shelf with PDF download.
2. `feature/speaking-recorder`: recorder component, Part 1 flow, send, Listen back (play only), save-my-voice. **Test on iPhone.**
3. `feature/speaking-part2-3`: Part 2 prep and talk, Part 3 pick-3 and openers, self-check, 3-band model sheet.
4. `feature/speaking-feedback`: reactions, feedback cards, “friends reacted” on the hub.
5. `feature/speaking-tests`: word tests and case stamps.
6. `feature/speaking-close`: case closed screen, closed state on the shelf, 2-week voice cleanup and its rules.

For each slice:
- follow CLAUDE.md Workflow (version bump in 3 places, CHANGES.md, `npm test`, a smoke check);
- explain in 3–5 plain lines what changed;
- list how I can test it on my phone;
- open a PR and do not merge it to main yourself.

## 9. Weekly content workflow
1. Zinat prepares the new week’s JSON with Claude (chat) and adds it to `content/weeks/`.
2. Run `python3 tools/book/build_book.py content/weeks/<file>.json books/` to build the HTML and PDF (it also updates `content/weeks/index.json`).
3. Commit all three and open a PR titled `content: week-NN <topic>`.

## 10. Out of scope (v1)
AI feedback or band estimates, transcripts, a live word race, push notifications, an admin UI for content.
