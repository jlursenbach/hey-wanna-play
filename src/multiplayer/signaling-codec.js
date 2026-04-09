function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64ToBytes(token) {
  const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function encodePayload(payload) {
  const json = JSON.stringify(payload);
  return bytesToBase64(new TextEncoder().encode(json));
}

export function decodePayload(code) {
  const bytes = base64ToBytes(code.trim());
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function encodeSignalDescription(description) {
  return encodePayload(description);
}

export function decodeSignalDescription(code) {
  return decodePayload(code);
}
