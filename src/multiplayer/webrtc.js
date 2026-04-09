import { decodeSignalDescription, encodeSignalDescription } from "./signaling-codec";

function waitForIceGatheringComplete(pc) {
  if (pc.iceGatheringState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const onStateChange = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", onStateChange);
        resolve();
      }
    };

    pc.addEventListener("icegatheringstatechange", onStateChange);
  });
}

function resolveState(pc) {
  if (pc.connectionState === "connected") return "connected";
  if (pc.connectionState === "failed") return "failed";
  if (pc.connectionState === "disconnected") return "disconnected";
  if (pc.connectionState === "closed") return "closed";
  return "connecting";
}

export function createWebRtcPeer({ role, onStateChange, onMessage }) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
  });

  let channel = null;

  const bindDataChannel = (nextChannel) => {
    channel = nextChannel;
    onStateChange("connecting");

    channel.addEventListener("open", () => onStateChange("connected"));
    channel.addEventListener("close", () => onStateChange(resolveState(pc)));
    channel.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    });
  };

  if (role === "host") {
    bindDataChannel(pc.createDataChannel("hwp"));
  } else {
    pc.addEventListener("datachannel", (event) => bindDataChannel(event.channel));
  }

  pc.addEventListener("connectionstatechange", () => {
    onStateChange(resolveState(pc));
  });

  async function createLocalCodeFromOffer() {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIceGatheringComplete(pc);
    return encodeSignalDescription(pc.localDescription);
  }

  async function createLocalCodeFromAnswer() {
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await waitForIceGatheringComplete(pc);
    return encodeSignalDescription(pc.localDescription);
  }

  return {
    async createHostOfferCode() {
      if (role !== "host") throw new Error("Only host can create offer code");
      return createLocalCodeFromOffer();
    },

    async acceptHostOfferAndCreateAnswerCode(offerCode) {
      if (role !== "guest") throw new Error("Only guest can create answer code");
      const remote = decodeSignalDescription(offerCode);
      await pc.setRemoteDescription(remote);
      return createLocalCodeFromAnswer();
    },

    async acceptGuestAnswerCode(answerCode) {
      if (role !== "host") throw new Error("Only host can accept answer code");
      const remote = decodeSignalDescription(answerCode);
      await pc.setRemoteDescription(remote);
    },

    send(packet) {
      if (!channel || channel.readyState !== "open") {
        throw new Error("Peer data channel is not open");
      }
      channel.send(JSON.stringify(packet));
    },

    close() {
      if (channel) {
        channel.close();
      }
      pc.close();
    },
  };
}
