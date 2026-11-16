# Week content schema

One file per week: `content/weeks/week-NN-<topic>.json`. Adding a week = adding a file + building its book. No code change.

| Field | Type | Notes |
|---|---|---|
| `id` | string | `week-01`. Used for the DB paths and book file names. |
| `topic`, `caseNo`, `tagline` | string | Shown on the hub, the cover and the shelf spine. |
| `start`, `end` | `YYYY-MM-DD` | Squad week, Saturday → Friday, Asia/Tehran. |
| `levels[]` | `{n, name, band, test, goal}` | 3 levels. `test` = `easy` / `medium` / `strong`. |
| `map[]` | `{group, items[]}` | Crime families (book only). |
| `words[]` | `{level, w, pos, def, ex, note?, stress?}` | `level` 1–3. `stress` like `de-TER-rent`. |
| `glossary[]` | `{w, def}` | Recognise-only words (book only). |
| `mistakes[]` | `{wrong, right, why}` | Book only. |
| `structure` | `{steps[], note}` | Part 3 “Build your answer” chips. |
| `openers[]` | string | Part 3 opener suggestion. |
| `part1[]` | `{id, short, q, tip?, chips[], model{6,7,8}, added?}` | 6 questions. `short` = title in lists. |
| `part2` | `{id, cue, points[], explain, steps[4], plan[4], phrases[], model{6,7,8}}` | `plan` = example keywords for the prep boxes (placeholder text). |
| `part3[]` | same as part1 | 8 questions; member picks 3. |
| `tests.easy/medium/strong[]` | `{type:"gap", prompt, options[4], answer, explain}` | 10 each; `answer` = index. Pass = 7/10. |
| `selfCheck.p1/p2/p3[]` | string | Manual self-check boxes on Listen back. |
| `sourceNotes[]` | string | Editorial notes, not shown in the app. |

**Text markup:** in `model` strings, `**word**` = this week’s vocabulary (render highlighted); `\n\n` = new paragraph.

**Book:** `python3 tools/book/build_book.py content/weeks/<file>.json books/` → `books/<id>.html` + `<id>.pdf`.
