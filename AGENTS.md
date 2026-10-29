# Rivals 2 — repository notes for agents

## What this repo is

`README.md` and `GAME_PREVIEW.md` are the design document for a Roblox game (RIVALS 2, a
50-player combat arena). The repo previously held **no application code at all**, so nothing
could start: any deployment of it exits with "no start command / no server on port 3000".

`src/` is a Vite + React single-page **preview** of that design document: hero/stats, the three
maps, the four fighters, the two bosses, a browser-playable arena demo (canvas, no dependencies
beyond React), the six modes, and the progression track. Content lives in `src/data/game.js` —
change that file to change copy or numbers, not the components.

The Roblox game itself is still to be built in Roblox Studio; this app is the public preview.

## Run it

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

- One service, `web`, on host port 3000, from the plain `node:22-bookworm-slim` image with the
  repo bind-mounted at `/app`. It runs `npm ci` then `vite dev`, so source edits hot-reload.
- `node_modules` is a named Docker volume, not a host directory; `package-lock.json` is committed
  and must stay in sync with `package.json` (`npm ci` refuses to start if they drift).
- `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` (set by the platform) is passed through so the Vite dev
  server accepts the preview host. `BASE44_PREVIEW_MODE` is passed through but nothing gates on it.

## Verify

```bash
curl -s http://localhost:3000/ | grep -q 'src/main.jsx'   # dev server serves live source
docker compose -f docker-compose.base44.yml exec -T web npm run build   # type/bundle check
```

`npm run build` writes `dist/` (gitignored) — not used by the dev server.

## Quirks

- The arena demo listens for keys on `window` and for pointer events on the canvas
  (`touch-action: none`). Space is `preventDefault`ed while it is held so the page does not scroll.
- There are no tests in this repo yet.
