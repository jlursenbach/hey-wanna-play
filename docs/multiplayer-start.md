# Multiplayer implementation: where to start

This project already has a shell (`src/App.jsx`) that launches each game in an iframe (`/games/<game-id>/index.html`).
That means the best first step is to add a **shell-managed multiplayer transport** and a tiny **parent/iframe protocol**.

## Start here (in order)

1. **Define protocol constants and packet schema**
   - Add canonical message names (`HWP_BOOTSTRAP`, `HWP_IFRAME_READY`, `HWP_SEND_TO_PEER`, etc.).
   - Use a shared packet envelope for peer traffic:

   ```js
   {
     v: 1,
     kind: "GAME_MOVE",
     gameId: "splits",
     sessionId: "sess_123",
     seq: 1,
     ts: 1712680000000,
     payload: {}
   }
   ```

2. **Build a shell WebRTC manager (single place)**
   - Create and own `RTCPeerConnection` in the shell (not in each game iframe).
   - Handle offer/answer strings for manual copy/send-as-text signaling.
   - Expose connection state (`connecting`, `connected`, `disconnected`, `failed`).

3. **Build the shell↔iframe bridge**
   - Listen for iframe messages (`HWP_IFRAME_READY`, `HWP_SEND_TO_PEER`, `NAV_HOME`).
   - Forward peer data to iframe as `HWP_REMOTE_MESSAGE`.
   - Send `HWP_BOOTSTRAP` only after both iframe readiness and connection readiness are satisfied.

4. **Wire one game only (Splits)**
   - Implement deterministic move sync for one game first.
   - Use move messages, not full-state broadcast:

   ```js
   { kind: "GAME_MOVE", payload: { moveType: "submit_round_card", round: 1, player: 0, card: 4 } }
   ```

5. **Add desync detection before expanding**
   - After each accepted move, both peers exchange `STATE_HASH`.
   - If hash mismatch occurs, freeze the match and show a clear desync screen.

## First milestone acceptance criteria

- Two devices can connect by exchanging host offer + guest answer manually.
- `Splits` can complete a full match over WebRTC data channel.
- Both sides remain in sync by sequence number + state hash.
- Disconnect state is visible in UI and returns safely to home.

## Suggested file layout

```txt
src/
  multiplayer/
    protocol.js         # constants + envelope validation helpers
    webrtc.js           # peer connection and data channel lifecycle
    session.js          # host/join orchestration
    iframe-bridge.js    # parent <-> game iframe message relay
```

For each game (inside `/games/<id>/`):

```txt
src/
  bridge.js             # thin wrapper around postMessage
  protocol.js           # game-specific move types
  game.js               # validate/apply/hash deterministic game logic
```

## Non-negotiable rules

- Games do **not** touch `RTCPeerConnection` directly.
- Every peer packet must include `gameId`, `sessionId`, and `seq`.
- Random setup is host-authored or seeded deterministically.
- Multiplayer launch is blocked unless multiplayer entitlement is owned.

## Why this order works

This sequence validates the hardest architectural risk first (shell transport + iframe bridge), while keeping scope small enough to ship quickly with one game.
After this is stable, adding additional turn-based games is mostly protocol/game-logic work, not networking rework.
