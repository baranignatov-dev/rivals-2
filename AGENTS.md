# Forge — game studio notes

A free, browser-based game maker: build a side-view level with tools, attach
scripts that really execute, and play it. No accounts, no currency, no unlocks.

## Running it

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

- One service (`web`) runs Vite in dev mode from the bind-mounted repo, so edits
  appear instantly. Dependencies are installed on container start from
  `package-lock.json` (the `node_modules` folder lives in the mounted repo and is
  gitignored).
- Entry point: host port 3000. Healthcheck hits `/` with a Node one-liner.

## Non-obvious things

- **Preview hostname handling.** `vite.config.js` extends `server.allowedHosts`
  with `.<BASE44_SANDBOX_HOST_DOMAIN>` and sets `hmr` to wss on port 443, but
  only when `BASE44_PREVIEW_MODE === "1"`. Unset (normal local dev), Vite keeps
  its default localhost-only allowlist.
- **Scripts run on the main thread.** `src/engine/scriptApi.js` compiles user
  code with `new Function` and calls it every frame; errors are caught and
  reported to the Console tab. A deliberate infinite loop (`while (true)`) will
  freeze the tab — it is caught by nothing. Keep script bodies frame-sized.
- **Editor drag state lives in a ref**, not in React state (`EditorStage.jsx`).
  Pointers can fire down/move/up inside one frame; state batching lost drags.
- **Saved work** is in `localStorage` under `forge-game-v1`. The starter level
  comes from `src/engine/scene.js` when nothing is saved, so clearing storage
  restores the demo.

## Verifying

There is no test suite. Verify in the browser:

1. Drag the Platform tool on the canvas — the object count in the Build tab grows.
2. Script tab → Level script → `api.say('hi', 5)` → Play → the toast appears.
3. Play: arrow keys / WASD / Space move and jump; the on-screen pad works on touch.
