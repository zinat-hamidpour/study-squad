# Study Squad 2026.11.05-7

Replace these files in the GitHub Pages repo (same folder as before):
index.html, assets.js, manifest.json, icons, version.json.
Phones on the old version see the "new version" banner within 5 minutes.

## What is new
1. Bottom bar: HOME · CLIMB · TABLE · SPEAK · ME. New HOME (squad tiles, my week, next mock/IELTS card, START).
2. Study hall: pick a skill at START (seated right away), switch skill while seated, STOP saves without questions.
   Each part is counted under the skill it started with. Green lamp per seat = that person's day goal.
3. MY GOALS: MAIN GOAL (IELTS date, target band, mocks, practice-test target, average a day) and
   THIS WEEK (daily goal, own goal per day, stair chart, plan a test, lock: only up after saving).
4. ME: hero journey with mocks, KPIs, where your time went, this week + PLAN NEXT WEEK, MY ROAD peek,
   practice tests, main goal. MY ROAD, week detail, mock result (bands).
5. PRACTICE TESTS: tests planned in THIS WEEK show up here (faint) and open; tap a part right on the page (once = done, again = analysed ✓). Score and tries in "score · tries ›".
6. CLIMB and SPEAK pages are unchanged (SPEAK is a placeholder).

## New Firebase data (all under squad/, old data untouched)
skills/{day}/{id}/{skill}, log/{id}, main/{id}, mocks/{id}/{mockId}, plans/{weekStart}/{id}, tests/{id}/{bookTest}.
If your database has security rules that list allowed paths, allow these too.
