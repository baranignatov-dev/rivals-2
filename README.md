# Forge — free game maker

Build a game in the browser with real tools and real code:

- **Build tools** — draw platforms and hazards, drop a start point, a goal,
  enemies and scriptable objects.
- **Scripts that actually run** — every object can carry JavaScript that executes
  each frame with a small game API (`api.say`, `api.spawn`, `api.win`, player and
  object access, and more). Paste a script and it does what it says.
- **Free, no coins** — nothing is locked, bought or gated.
- **Every device** — works with mouse and keyboard on desktop and with touch on
  phones and tablets.

Play it from the preview on port 3000. Your level auto-saves in the browser, and
you can export/import it as a JSON file.

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

See `AGENTS.md` for setup details and `GAME_PREVIEW.md` for the original concept
art that inspired the level style.
