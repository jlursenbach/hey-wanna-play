export function createSessionId() {
  return `sess_${Math.random().toString(36).slice(2, 10)}`;
}

export function createSeed() {
  return `${Math.floor(Math.random() * 1_000_000)}`.padStart(6, "0");
}

export function createBootstrap({ gameId, role, sessionId, seed }) {
  return {
    protocolVersion: 1,
    gameId,
    mode: "multiplayer",
    multiplayer: {
      enabled: true,
      role,
      sessionId,
      localPlayerIndex: role === "host" ? 0 : 1,
      remotePlayerIndex: role === "host" ? 1 : 0,
      seed,
      transport: "webrtc",
    },
    settings: {},
  };
}
