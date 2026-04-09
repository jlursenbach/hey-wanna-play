# [Game Name]

> Part of **Hey Wanna Play?**

## Setup

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Structure

```
index.html        — entry point, screen scaffolding
src/
  game.js         — pure game logic (no DOM)
  ai.js           — heuristic + Claude API AI
  ui.js           — all rendering and input handling
  styles.css      — design tokens + layout
assets/
  icon.png        — 512×512 game icon
  preview.png     — 1080×720 preview screenshot
manifest.json     — game metadata for the app shell
```

## Adding this game to the app

1. Set `id`, `name`, `pack` in `manifest.json`
2. Drop this folder into `/app/src/games/`
3. The app shell picks it up automatically

## Design tokens

All colors, fonts, and spacing live in `styles.css` as CSS variables.
Keep game-specific styles in a `<style>` block in `index.html`
or a separate `src/game-specific.css` file.

## AI

- `heuristicMove(state)` — implement `getLegalMoves` and `evaluateMove`
- `claudeMove(state, model)` — implement `boardToString` and `buildPrompt`
- Claude AI automatically falls back to heuristic on any error
