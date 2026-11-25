# Dapur Kilat

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/syamscelot1/Dapur-Kilat/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/syamscelot1/Dapur-Kilat/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A fast, complete Indonesian cooking game, built from scratch for make.fun's
"Make the best cooking game" bounty — $250 in USDC. Everything is original:
the kitchen, the chef, the eight Indonesian recipes and every sound are
invented for this entry. No images, no audio files, no network: all art is
drawn in code and all sound is synthesized live with the Web Audio API.

You are the chef of a small warung that just got famous. Orders pile up on
the board, patience runs out fast, and the wajan does not wait. Chop, fry,
boil and grill your way through three shifts — and do not let anything burn.

## What is in the game

- **A kitchen to run** — ingredient crates (nasi, ayam, telur, cabai, sayur,
  mie, pisang, teh), two cutting boards, two woks, a pot, a grill, a plating
  table with two reusable plates, a trash bin, a serving window and a recipe
  book on the wall.
- **8 Indonesian recipes, each multi-step** — Nasi Goreng Kilat, Mie Ayam,
  Es Teh Manis, Pisang Goreng, Ayam Geprek, Gado-Gado, Soto Ayam, Sate Ayam.
  Every dish is assembled from processed components (chopped, fried, boiled,
  grilled) on a plate, then served.
- **Orders with patience** — tickets arrive faster every day, each with a
  patience bar. Serve the right dish in time for coins + a tip; serve wrong
  or let a ticket expire and the combo resets and coins are lost.
- **Burning food** — leave a finished cook on the stove and it burns after
  six seconds. Burnt food can only go in the trash.
- **Combos and tips** — consecutive on-time serves build a combo multiplier
  (up to 2x). Fast serves pay bigger tips.
- **Three shifts** — 180 seconds each, targets 150 / 250 / 400 coins. New
  recipes unlock between days. Beat day 3 to win, with a 1–3 star rating.
- **Feel and polish** — chopping and cooking progress bars, wok smoke,
  floating score text, a flashing RUSH! banner when the board fills up,
  synthesized sizzle / chop / ding / coin sounds and a cheerful music loop
  that gets busier during a rush.
- **Full game flow** — title screen, how-to, pause, day summaries, win and
  lose screens, replayable days. Keyboard (WASD/arrows + E/Space) and mouse
  (click a station next to you to interact).

## How to play

```sh
node serve.ts   # then open http://localhost:8080
```

Or open `game/index.html` from any static server. The game runs fully
offline in a desktop browser.

## Structure

- `game/index.html` — canvas shell.
- `game/src/main.js` — boot, fixed-step loop, screens and day flow.
- `game/src/config.js` — ingredients, recipes, days, tuning.
- `game/src/input.js` — keyboard + mouse, edge-triggered actions.
- `game/src/world.js` — kitchen layout, station slots, cooking timers.
- `game/src/orders.js` — order tickets, patience, serving and scoring.
- `game/src/player.js` — chef movement, collision, the context action.
- `game/src/render.js` — all drawing: kitchen, food icons, the chef.
- `game/src/audio.js` — synthesized SFX and music (Web Audio, no files).
- `game/src/ui.js` — HUD, tickets, menus, win/lose screens.
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=`):
  `cover` (busy kitchen), `chop` (chopping), `serve` (serving a finished
  plate), `rush` (four tickets, one almost out of patience).
- `main.ts` — hand-in program: copies `game/` + `screenshots/` and writes
  `dossier.json` with the vendored make.fun library.
- `screenshots/` — 4 real renders from the game code itself.

## License

MIT — see `LICENSE`.
