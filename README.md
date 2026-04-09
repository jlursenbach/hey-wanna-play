# hey-wanna-play

Prototype game launcher/storefront built with React + Vite.

## Current shape

- Shell app in `src/App.jsx`.
- Games are launched in an iframe from `/games/<game-id>/index.html`.
- Catalog, unlocks, and multiplayer entitlement are currently local UI state.

## Multiplayer: where to start

Use the implementation plan in [`docs/multiplayer-start.md`](docs/multiplayer-start.md).

Short version:

1. Define shared protocol constants and packet envelope.
2. Build shell-owned WebRTC manager.
3. Add shell↔iframe message bridge.
4. Ship one deterministic game over multiplayer first (`Splits`).
5. Add state-hash desync detection before expanding to more games.
