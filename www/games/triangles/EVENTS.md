# Triangles: the game's own analytics events

Sent with `host.track()`. The shell's events (app_ready, level_up, level_lost, economy, ads, daily tasks, Bell Quest…) are listed in `docs/ANALYTICS.md` and aren't repeated here.

Every event below also carries `team` (cat | dog) and `character` (patch, rex…), so any report can be split by team.

| Event | When | Params |
|---|---|---|
| `team_picked` | First launch, after choosing a team | (team, character) |
| `team_changed` | The player switched team from the map | `from`: the old team |
| `character_changed` | The player picked another character on the same team | `from`: the old character |
| `match_start` | A match or puzzle begins (not on resume) | `level`, `kind`: tutorial \| match \| boss \| puzzle \| duo |
| `match_won` | A level is won, after the reward | `level`, `kind`, `hints` |
| `match_lost` | A loss is final (the player didn't undo) | `level`, `kind`, `losses` (in a row on this level; the rival eases off 0.08 skill per loss, up to 3) |
| `hint_used` | A hint is shown | `level` |
| `undo_moves` | The rewarded "Undo 3 moves" was earned | `level` |
| `puzzle_failed` | A puzzle level was missed | `level`, `kind`: double \| safe \| comeback |
| `undo_used` | The player took back their last line | `level`, `free`: 1 if it was free |
| `replay_won` | A level already beaten was won again (for stars) | `level`, `kind`, `stars` |
| `daily_yard_won` / `daily_yard_lost` | The Daily Yard was won or lost | `level` (the player's), `stars`, `streak` |
| `character_unlocked` | Characters joined after a zone boss fell | `ids`: comma-separated |
| `achievement` | An achievement was earned and paid | `id`, `reward` |

`match_won`, `replay_won` and `daily_yard_won` also carry `stars` (1–3) and `undos`; `match_start` carries `replay`.

`level_up` / `level_lost` (from `host.levelWon` / `host.levelLost`) carry `level`, `kind`, `score` and `team`.

Rewarded placements: `double-coins` (win card), `undo-moves` (lose card).

Coin reasons the game uses: `win`, `daily-yard`, `achievement`, `treat` (earned); `hint`, `undo`, `cosmetic` (spent).
