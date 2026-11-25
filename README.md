# Sizzle & Serve

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/hitomiinaraa/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/hitomiinaraa/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A tiny 2D kitchen rush game for the [make.fun "Make the best cooking game" bounty](https://make.fun/bounty/best-cooking-game-20261125-0137).

The lunch rush is on. Orders land on the board with countdown timers — grab ingredients from the crates, chop tomatoes and lettuce on the cutting board, cook raw patties on the stove (don't let them burn), stack the plate in the recipe order shown, and serve finished dishes at the window. Fast serves earn tips and build your combo; the rush grows as your score rises. Three expired orders ends the 3-minute shift.

Controls: WASD or arrow keys to move, E or Space to use a station, or click a counter to walk to it and use it. R restarts after game over. All sound is synthesized in code with WebAudio — no assets, no network, no libraries.

## Layout

- `game/index.html` — page shell
- `game/main.js` — boot, game loop, input, interaction rules, HUD
- `game/kitchen.js` — kitchen floor plan, stations, counter drawing
- `game/chef.js` — the player chef: movement, click-to-walk, carrying
- `game/orders.js` — recipes, order board, timers, scoring, combo
- `game/food.js` — ingredient definitions and food drawing
- `game/audio.js` — synthesized WebAudio sounds
- `game/style.css` — warm kitchen page styling
- `screenshots/` — real renders of the game running
- `main.ts` — make.fun entrypoint (copies game + screenshots, writes dossier.json)
