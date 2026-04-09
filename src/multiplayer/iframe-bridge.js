import { GAME_TO_SHELL, SHELL_TO_GAME } from "./protocol";

export function createIframeBridge({ iframeRef, onIframeReady, onSendToPeer, onNavHome }) {
  const postToIframe = (type, payload) => {
    iframeRef.current?.contentWindow?.postMessage({ type, payload }, "*");
  };

  const handleWindowMessage = (event) => {
    const message = event.data;
    if (!message || typeof message !== "object" || !message.type) {
      return;
    }

    if (message.type === GAME_TO_SHELL.IFRAME_READY) {
      onIframeReady?.(message.payload);
      return;
    }

    if (message.type === GAME_TO_SHELL.SEND_TO_PEER) {
      onSendToPeer?.(message.payload);
      return;
    }

    if (message.type === GAME_TO_SHELL.NAV_HOME) {
      onNavHome?.();
    }
  };

  return {
    postBootstrap(payload) {
      postToIframe(SHELL_TO_GAME.BOOTSTRAP, payload);
    },

    postRemoteMessage(payload) {
      postToIframe(SHELL_TO_GAME.REMOTE_MESSAGE, payload);
    },

    postConnectionState(payload) {
      postToIframe(SHELL_TO_GAME.CONNECTION_STATE, payload);
    },

    handleWindowMessage,
  };
}
