# Study Squad 2026.11.11-7 · ME: PLAN | PROGRESS

1. ME has two tabs. **PLAN** = what I'm going to do; **PROGRESS** = what I've done. Same cards and colours as before.
2. PLAN, top to bottom: **the goal card** (weeks to IELTS, target band, hours a day, practice tests): tap it, or
   ✎ MY GOAL, to change your main goal · **This week** (tap to change it) · **PLAN NEXT WEEK** · **Practice tests**.
3. PROGRESS: studied / tests done / days goal hit · Where your time went (tap → this week day by day) · MY ROAD ·
   Mock exams & exam day.
4. **Skills per day**: in MY GOALS › THIS WEEK, tap a day and pick up to 3 skills. They show as small coloured dots
   under the days on ME and in the week, and "Today" on ME says what to study.
5. Planning a week is three numbered steps: 1 Daily goal · 2 Each day: time + skills · 3 Tests, then SAVE.
   Next week says it is filled in from your main goal.
6. My study time (fix a day, start fresh), Zinat's clean-up and Ghost guests moved from ME to **Settings (⚙)**.

---

# Study Squad 2026.11.11-6 · Fix my data

1. ME → **My study time**: the days of this week (Saturday → today) with their time. Tap **edit** to correct a day.
   Only your own days, only this week, at most 12 hours a day. Not while your timer is running.
   Skills: if you add time, the extra shows as "untagged"; if you lower it, every skill shrinks by the same share.
   The "What I studied" list keeps its original lines.
2. **Start fresh from today** (with a confirm step): deletes your own study time, skills and log lines before today.
   Goals, plans, tests and mocks stay. Your road starts today, and your days before it are not empty spots on the climb.
3. Every edit or fresh start posts a short line on the room board, e.g. "Farzad edited Monday: 1h 20m → 2h 05m".
4. Zinat only: **Clear history before 7 Nov**, for everyone. Shows how many days, entries and log lines it will delete,
   asks for a backup first (Firebase console › Realtime Database › ⋮ › Export JSON, or ⬇ Download backup here),
   and deletes only data dated before Saturday 7 Nov. Everyone's road then starts on 7 Nov.
5. Ghosts can't do any of this.
6. Edits can change this week's climb, lanterns, empty spots and cup.

---

# Study Squad 2026.11.11-4 · Update fix

1. Fix: after tapping UPDATE some phones showed a white page with an empty red bar. The new index.html was running
   with the old assets.js still in the phone's cache. assets.js now carries the version in its address, and UPDATE
   refreshes it before reloading.
2. Fix: the error bar now shows its message even when the app fails during startup.
3. Fix: creating a new ghost was refused by the database rules (it wrote the whole ghost list); it now writes only its own spot.

---

# Study Squad 2026.11.11-3 · Ghost touches

1. A ghost dropped on the rug slips under it: only the top of its head and its eyes peek out (now and then it bobs).
   New ghosts appear in front of the table, not under the rug.
2. The ghost-name field in the note is now a small dashed line under TO, with a tiny ghost next to it.
3. A note thrown to a ghost that is in the hall flies to the ghost and sticks to its body (up to 3 balls show).
   A ghost's note to one of the six flies from the ghost to that person's desk.

---

# Study Squad 2026.11.11-2 · Ghost guests

Replace these files in the GitHub Pages repo: index.html, assets.js, version.json (and this CHANGES.md).
This version includes everything in 2026.11.11-1 (below).

## Ghost guests (up to 10 friends outside the six)
1. A tiny grey ghost sits under the six tiles on the start screen. Tap it to come in as a ghost.
2. NEW GHOST: pick a name (2–14 letters, not one of the six, not taken), your own password (4+ characters)
   and your colour from 10. Colours other ghosts already have are greyed out. At most 10 ghosts.
3. I'M BACK: the ghost's name (capital letters don't matter) + password. The phone remembers the ghost until you tap Leave.
4. Ghosts see every page through Zinat's eyes, read-only. Any change (timer, goals, board, lanterns, settings…)
   is blocked with "Ghosts can look, but not touch."
5. Ghosts can send notes to any of the six or to another ghost: 5 notes a day. Their notes are signed under the text
   with their name and a dot in their colour.
6. The six send a note to a ghost by typing its exact name under TO (capital letters and extra spaces don't matter).
   There is no list: when the name matches, a dot in the ghost's colour appears and the note can be sent.
7. A ghost has its own mailbox: MAIL in the hall shows the ghost's notes, never Zinat's.
8. Ghosts float over the rug in the hall with a small name under them. A ghost can drag itself with a finger;
   everyone sees where it lands. A ghost whose phone hasn't checked in for 3 minutes disappears from the hall.
9. Only Zinat can let a ghost go: ME → Ghost guests → Let go (tap twice). The ghost's notes go with it, and its phone
   is sent back to the start screen.

Note on safety: PINs and ghost passwords are checked on the phone, and the database itself is still open.
Before sharing the link with people outside the squad, lock the database (Firebase Anonymous Auth + Security Rules).

---

# Study Squad 2026.11.11-1

Replace these files in the GitHub Pages repo: index.html, assets.js, version.json (and this CHANGES.md).
Phones on the old version see the "new version" banner within 5 minutes.

## THE CLIMB · together (no more race)
1. Six wooden steps: Sat (bottom) → Thu (top). Friday has no step: it is party day.
2. At 4 AM everyone stands on the same step. Reach your own goal for the day (floor 30 min) → you climb that day's step.
   Until then you wait one step below, dimmed (on Saturday morning: on the floor).
3. Didn't reach it? At 4 AM a faint unlit lantern takes your place on that day's step and you move up with everyone.
4. A step lights up when at least 3 of 6 climbed it.
5. Removed from CLIMB: trail map, players grid, pairs, START button.

## Lanterns
6. Study double your goal on a day (Sat–Thu) → you earn a lantern. It hangs from the front of the table at your seat
   in the study hall until you give it.
7. Hang it on a friend's faint unlit lantern from the last 2 days (tap the blinking one, or pick from the list) and confirm:
   it lights up and that day counts as reached for your friend. It can't be undone. Each person can receive one a week.

## The week's result (counted on Friday)
8. Empty spots = faint unlit lanterns nobody lit, for everyone who has joined.
9. 3 or fewer → FRIDAY ROOFTOP for all six of us, and a gold cup on the shelf that Friday.
10. 4 to 6 → no party, a silver cup on the shelf. More than 6 → no cup.
11. Four bulbs over the roof: one goes out for every empty spot. The status card says "on track", "lanterns can still save
    the party" or "no party this week". Anyone can write the Friday plan; it shows on the rooftop sign.

## Friday Rooftop
12. Neon sign, two strings of lights, confetti, movie screen + projector, tall speaker with music,
    long table with pizza and goblets; the six of us standing behind it.

## Squad cups
14. Gold or silver cups (see 9–10) go on the bottom shelf of the study-hall bookcase on Friday.
15. The first cup (gold) stands in the middle under a brass plaque: "FOR FRIENDSHIP & COMPANIONSHIP". It is there from the start and stands for the first week (week of 7 Nov): that week adds no second cup.
    Earned cups start with the week of 14 Nov (first one possible on Friday 20 Nov).
16. Ten small things keep the shelf company until cups take their place, left to right:
    Cambridge books, hourglass, plant, photo of the six of us, glass of tea, globe, candle, radio, word books, alarm clock.
17. Tap the shelf → the list of all cups (week, gold/silver, empty spots, Friday plan). Cups are computed from the study data; nothing new is stored.

## Study hall
18. Desk lamps: a green banker's lamp beside every seat (all on the right of the chair), lit when that person reached today's goal.
19. A small hand-knotted Persian rug under the table (medallion, corner pieces, rosette border); the old green rug is gone.
20. Spirits: from your planned start time (profile) a mint spirit of you floats over your empty seat.
    It leaves when you sit down (studying or paused), reach today's goal, or the day ends (4 AM).
    No start time → no spirit. No spirits on Friday. A start time after midnight still belongs to that day.
21. Notes live inside the room: a small writing table (paper, inkwell, quill) = WRITE; a wooden letterbox = MAIL.
    When mail waits, a letter peeks from the slot, the red flag goes up and wiggles, and the count shows on the brass plate.

## New Firebase data (under squad/, old data untouched)
lanterns/{weekStart}/{receiverId} = {from, day, at}
party/{weekStart} = {text, by, at}
If your database rules list allowed paths, allow these too.
