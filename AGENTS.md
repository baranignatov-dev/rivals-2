# Repo notes for agents

## What this repo is

At import this repository held **no application code** — only `GAME_PREVIEW.md`, the
design doc for a Roblox game ("Rivals 2"), and a one-line README. The playable build
under `src/` is a browser implementation of that doc: same maps, fighters, modes,
hazards and bosses, in a top-down canvas arena.

## Running it

```bash
docker compose -f docker-compose.base44.yml up -d --build   # Vite dev server on host :3000
docker compose -f docker-compose.base44.yml logs -f web
```

- `web` runs `npm ci` from the committed `package-lock.json` at container start (deps
  live in the `web_node_modules` volume) and then `vite --host 0.0.0.0 --port 3000`.
- No database, no backend, no third-party credentials: nothing to configure before boot.
- `vite.config.js` only adds the preview-proxy host allowlist when
  `BASE44_PREVIEW_MODE=1` (it uses the `.${BASE44_SANDBOX_HOST_DOMAIN}` wildcard because
  the sandbox id changes). With the flag unset the config has no allowlist entry, i.e.
  Vite's normal behaviour.

## Code layout

- `src/data/characters.js`, `maps.js`, `modes.js`, `bosses.js` — stats and arena
  geometry transcribed from `GAME_PREVIEW.md`. Arena shapes are circles or capsules.
- `src/game/engine.js` — all simulation (movement, cover collision, projectiles,
  hazards, bots, boss telegraphs, scoring, rewards). No DOM access; `emit()` reports
  `start` / `boss` / `bossDown` / `playerDown` / `end`.
- `src/game/render.js` — canvas drawing plus the minimap.
- `src/main.js` — menu, HUD, input, results screen, level/coin progress in `localStorage`.
- `src/styles.css` — all screen and HUD styling.

## Verifying it works

- `#start-btn` starts a match; `#hud-timer`, `#hud-score`, `#hp-text`, `#ability-cd`,
  `#boss-bar`, `#killfeed` expose live state for DOM assertions.
- The boss spawns after 35 seconds of match time and the match ends at the mode's kill
  target or its timer, which is when `#results` renders.
- The arena itself is a single `<canvas>`: fighters, bullets and damage numbers are
  pixels, not DOM, so gameplay assertions need HUD/feed values or screenshots.
- There is no test suite. The compile check is `npx vite build` inside the `web`
  service (a full build takes well under a second).
