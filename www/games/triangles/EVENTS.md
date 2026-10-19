# Triangles: the game's own analytics events

Sent with `host.track()`. The shell's events (app_ready, level_up, level_lost, economy, ads, daily tasks, Bell Quest…) are listed in `docs/ANALYTICS.md` and aren't repeated here.

| Event | When | Params |
|---|---|---|
| `team_picked` | First launch, after choosing a team | `team`: cat \| dog |
| `match_start` | A match or puzzle begins (not on resume) | `level`, `kind`: tutorial \| match \| boss \| puzzle \| duo |
| `match_won` | A level is won, after the reward | `level`, `kind`, `hints` |
| `match_lost` | A loss is final (the player didn't undo) | `level`, `kind` |
| `hint_used` | A hint is shown | `level` |
| `undo_moves` | The rewarded "Undo 3 moves" was earned | `level` |
| `puzzle_failed` | A puzzle level was missed | `level`, `kind`: double \| safe \| comeback |

`level_up` / `level_lost` (from `host.levelWon` / `host.levelLost`) carry `level`, `kind`, `score` and `team`.

Rewarded placements: `double-coins` (win card), `undo-moves` (lose card).
