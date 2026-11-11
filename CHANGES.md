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
15. The first cup (gold) stands in the middle under a brass plaque: "FOR FRIENDSHIP & COMPANIONSHIP". It is there from the start.
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
