# Triangles – Cats vs Dogs

Draw lines between dots. Close a triangle to claim it. Most triangles wins the yard.

You play **Team Cat** or **Team Dog** against a rival from the other team, through a neighbourhood of zones. Built on the Cash Paws shell (coins, cats and perks, daily tasks, Rewards Box, Bell Quest, ads, analytics, the Android app and CI). The game is `www/games/triangles/`.

## The game

| File | What's in it |
|---|---|
| `board.js` | The rules: legal lines (no crossing, no touching dots, no puddles), empty-triangle detection, treats, fences, fireflies, undo |
| `ai.js` | Rival styles from `sleepy` (never scores: the first match can't be lost) through `easy`, `mild`, `steady`, `firm`, `normal`, `smart` and `boss` (looks one reply ahead), plus hints |
| `levels.js` | Zones, rivals, difficulty per level, yard generation, puzzles |
| `sounds.js` | The game's synthesized effects: meow, woof, line, claim… |
| `meta.js` | Around the matches: characters and their powers, stars, achievements, the Daily Yard, the Shop's yard themes |
| `art.js` | Each zone's scenery and optional painted backgrounds |
| `index.js` / `style.css` | Screens: team pick, map, match, cards |

### Levelling

| Levels | Zone | Twist |
|---|---|---|
| 1–10 | The Backyard | The basics. Level 1 is a guided tutorial against a sleepy pup who never scores |
| 11–20 | The Park | Treat triangles score 3 |
| 21–30 | Rainy Lane | Puddles no line can cross |
| 31–40 | Fence Row | Some lines are drawn before the match |
| 41–50 | Night Garden | Fireflies light up new dots mid-match |
| 51+ | The same streets again ("II", "III"…) | Every twist mixed in, sharper rivals |

Every 5th level is a puzzle (score 2 with one line / three safe lines / comeback), every 10th a boss. Levels are generated from their number, so they're the same for everyone. Yards are chosen with an odd number of triangles, so most matches can't tie.

**Around the matches:** 1–3 stars per level (win; win by 3+; never leave the rival a triangle) and replays of beaten levels for stars; a Daily Yard with a streak; ten characters, two at the start and two more after each zone boss, each with a small power; 14 achievements paid in coins; Undo (first one free each match); a glowing nudge when a triangle is ready to close; yard themes in the Shop.

Early levels are tuned so new players win: the rival in levels 2–9 stops taking triangles once it is a few points ahead.

### Checks

```bash
node test/games/triangles/rules.js            # rules, rivals, every level 1–70 builds and plays out
node test/games/triangles/sim.js 40 60         # balance: win rates per level for three player strengths
node serve.js 8080 &
node test/games/triangles/play.mjs             # tutorial win, map, first puzzle, in a phone-sized browser
node test/games/triangles/meta.mjs             # undo, stars, replays, Daily Yard, characters, achievements, Shop
node test/games/triangles/sounds.mjs           # renders the game's sounds; fails on silence or clipping
```

Play in a browser: `node serve.js 8080`, then open http://localhost:8080/?dev=1 (the dev panel can win, lose, skip levels and swap teams).

## Setting up the app

`SETUP.md` covers your repo, Firebase, AdMob, signing and Play. The app's identity is in `www/app.config.js`; `applicationId` is `com.pixelartgames.triangles`. Change it before the first upload if you want a different one: it's permanent after that.
