export const HWP_PROTOCOL_VERSION = 1;

export const SHELL_TO_GAME = {
  BOOTSTRAP: "HWP_BOOTSTRAP",
  REMOTE_MESSAGE: "HWP_REMOTE_MESSAGE",
  CONNECTION_STATE: "HWP_CONNECTION_STATE",
};

export const GAME_TO_SHELL = {
  IFRAME_READY: "HWP_IFRAME_READY",
  SEND_TO_PEER: "HWP_SEND_TO_PEER",
  GAME_STATE_HASH: "HWP_GAME_STATE_HASH",
  NAV_HOME: "NAV_HOME",
};

export const PEER_KIND = {
  READY: "READY",
  START_MATCH: "START_MATCH",
  GAME_MOVE: "GAME_MOVE",
  STATE_HASH: "STATE_HASH",
  RESIGN: "RESIGN",
};

export function createPeerEnvelope({ kind, gameId, sessionId, seq, payload }) {
  return {
    v: HWP_PROTOCOL_VERSION,
    kind,
    gameId,
    sessionId,
    seq,
    ts: Date.now(),
    payload,
  };
}

export function isPeerEnvelope(value) {
  return (
    value &&
    typeof value === "object" &&
    value.v === HWP_PROTOCOL_VERSION &&
    typeof value.kind === "string" &&
    typeof value.gameId === "string" &&
    typeof value.sessionId === "string" &&
    typeof value.seq === "number"
  );
}
