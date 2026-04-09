'use strict';

const GAME_ID = 'box-of-doom';

let state = createState();
let mp = {
  enabled: false,
  localPlayer: 0,
  sessionId: null,
  connectionState: 'offline',
};

function sendToPeer(message) {
  if (!mp.enabled) return;
  window.parent.postMessage(
    {
      type: 'HWP_SEND_TO_PEER',
      payload: {
        kind: 'GAME_MOVE',
        payload: message,
      },
    },
    '*'
  );
}

function showScreen(id) {
  document.getElementById('screen-setup').classList.toggle('hidden', id !== 'setup');
  document.getElementById('screen-game').classList.toggle('hidden', id !== 'game');
}

function localIsPeeker() {
  return state.peeker === mp.localPlayer;
}

function updateScores() {
  const html = `<span class="score-p1">P1 ${state.scores[0]}</span><span>vs</span><span class="score-p2">P2 ${state.scores[1]}</span>`;
  document.getElementById('setup-scores').innerHTML = html;
  document.getElementById('game-scores').innerHTML = html;
}

function setMessage(text) {
  document.getElementById('message').textContent = text;
}

function showPanel(id) {
  ['peek-panel', 'guess-panel', 'result-panel'].forEach((panelId) => {
    document.getElementById(panelId).classList.toggle('hidden', panelId !== id);
  });
}

function renderRoundLabel() {
  const guesser = 1 - state.peeker;
  const suffix = mp.enabled
    ? ` · YOU ARE P${mp.localPlayer + 1}`
    : '';
  document.getElementById('round-label').textContent = `ROUND ${state.round} · P${state.peeker + 1} PEEKS · P${guesser + 1} GUESSES${suffix}`;
}

function renderPeekRevealed() {
  const item = state.currentItem;
  document.getElementById('item-emoji').textContent = item.emoji;
  document.getElementById('item-name').textContent = item.label.toUpperCase();
  const verdict = item.want ? '✓ P2 WANTS THIS' : '✗ P2 DOES NOT WANT THIS';
  document.getElementById('item-verdict').textContent = verdict;
  document.getElementById('item-name').className = `item-name ${item.want ? 'item-good' : 'item-bad'}`;
  document.getElementById('item-verdict').className = `item-verdict ${item.want ? 'item-good' : 'item-bad'}`;
}

function renderResult() {
  const result = state.lastResult;
  const item = result.item;
  document.getElementById('result-emoji').textContent = item.emoji;
  document.getElementById('result-name').textContent = item.label.toUpperCase();
  document.getElementById('result-verdict').textContent = item.want ? '✓ SOMETHING GOOD' : '✗ SOMETHING BAD';
  document.getElementById('result-name').className = `item-name ${item.want ? 'item-good' : 'item-bad'}`;
  document.getElementById('result-verdict').className = `item-verdict ${item.want ? 'item-good' : 'item-bad'}`;
  document.getElementById('result-call').textContent = `P${result.guesser + 1} ${result.took ? 'TOOK' : 'LEFT'} THE BOX`;
  document.getElementById('result-outcome').textContent = result.correct ? '✓ GOOD CALL' : '✗ WRONG CALL';
  document.getElementById('result-outcome').style.color = result.correct ? '#4ade80' : '#f87171';
  document.getElementById('result-who').textContent = `P${result.winner + 1} wins this round`;
}

function render() {
  updateScores();
  renderRoundLabel();
  document.getElementById('peek-player').textContent = `P${state.peeker + 1}`;

  if (state.phase === 'peek') {
    showPanel('peek-panel');
    document.getElementById('peek-result').classList.add('hidden');

    if (mp.enabled && !localIsPeeker()) {
      document.getElementById('btn-peek').disabled = true;
      setMessage('Waiting for peeker to reveal and hand over…');
    } else {
      document.getElementById('btn-peek').disabled = false;
      setMessage('Peeker: tap PEEK privately.');
    }
    return;
  }

  if (state.phase === 'peek-revealed') {
    showPanel('peek-panel');
    document.getElementById('peek-result').classList.remove('hidden');
    renderPeekRevealed();

    if (mp.enabled && !localIsPeeker()) {
      document.getElementById('btn-ready').disabled = true;
      setMessage('Waiting for peeker to continue…');
    } else {
      document.getElementById('btn-ready').disabled = false;
      setMessage('Peeker: bluff/truth, then continue to guess.');
    }
    return;
  }

  if (state.phase === 'guess') {
    showPanel('guess-panel');
    const canGuess = !mp.enabled || !localIsPeeker();
    document.getElementById('btn-take').disabled = !canGuess;
    document.getElementById('btn-leave').disabled = !canGuess;
    setMessage(canGuess ? 'Guesser: choose TAKE or LEAVE.' : 'Waiting for guesser…');
    return;
  }

  if (state.phase === 'result') {
    showPanel('result-panel');
    renderResult();
    const canAdvance = !mp.enabled || localIsPeeker();
    document.getElementById('btn-next').disabled = !canAdvance;
    setMessage(canAdvance ? 'Advance to next round when ready.' : 'Waiting for peeker to start next round…');
  }
}

function startGame() {
  state = startRound(createState());
  showScreen('game');
  render();

  if (mp.enabled && !localIsPeeker()) {
    // Wait for peeker events.
    return;
  }
}

function onPeek() {
  if (mp.enabled && !localIsPeeker()) return;
  state = revealForPeeker(state);
  render();
}

function onReadyForGuess() {
  if (mp.enabled) {
    state = { ...state, phase: localIsPeeker() ? 'guess' : state.phase };
    sendToPeer({ type: 'READY_FOR_GUESS', round: state.round });

    if (localIsPeeker()) {
      setMessage('Waiting for guess from remote player…');
    }
    return;
  }

  state = { ...state, phase: 'guess' };
  render();
}

function applyRoundResult(resultPayload) {
  const item = itemById(resultPayload.itemId);
  state = {
    ...state,
    scores: resultPayload.scores,
    phase: 'result',
    lastResult: {
      took: resultPayload.took,
      correct: resultPayload.correct,
      winner: resultPayload.winner,
      guesser: 1 - state.peeker,
      item,
    },
    currentItem: item,
  };
  render();
}

function onGuess(took) {
  if (mp.enabled) {
    if (localIsPeeker()) return;
    sendToPeer({ type: 'GUESS', round: state.round, took });
    state = { ...state, phase: 'guess' };
    setMessage('Guess sent. Waiting for reveal…');
    return;
  }

  state = resolveGuess(state, took);
  render();
}

function onNextRound() {
  if (mp.enabled && !localIsPeeker()) return;
  state = nextRound(state);
  render();

  if (mp.enabled) {
    sendToPeer({ type: 'NEXT_ROUND', round: state.round, peeker: state.peeker });
  }
}

function handleRemoteMessage(packet) {
  const msg = packet?.payload || packet;
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'READY_FOR_GUESS') {
    if (!localIsPeeker()) {
      state = { ...state, phase: 'guess' };
      render();
    }
    return;
  }

  if (msg.type === 'GUESS') {
    if (!localIsPeeker()) return;
    state = resolveGuess(state, msg.took);

    const payload = {
      type: 'ROUND_RESULT',
      round: state.round,
      took: msg.took,
      correct: state.lastResult.correct,
      winner: state.lastResult.winner,
      scores: state.scores,
      itemId: state.currentItem.id,
    };

    sendToPeer(payload);
    render();
    return;
  }

  if (msg.type === 'ROUND_RESULT') {
    applyRoundResult(msg);
    return;
  }

  if (msg.type === 'NEXT_ROUND') {
    state = nextRound(state);
    render();
  }
}

function onShellMessage(event) {
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'HWP_BOOTSTRAP') {
    const payload = msg.payload;
    if (payload?.mode === 'multiplayer' && payload?.multiplayer?.enabled) {
      mp = {
        enabled: true,
        localPlayer: payload.multiplayer.localPlayerIndex,
        sessionId: payload.multiplayer.sessionId,
        connectionState: 'connected',
      };
    }
    return;
  }

  if (msg.type === 'HWP_REMOTE_MESSAGE') {
    handleRemoteMessage(msg.payload);
    return;
  }

  if (msg.type === 'HWP_CONNECTION_STATE') {
    mp.connectionState = msg.payload?.state || mp.connectionState;
  }
}

function navHome() {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'NAV_HOME' }, '*');
  } else {
    window.location.href = '/';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('message', onShellMessage);

  if (window.parent !== window) {
    window.parent.postMessage(
      { type: 'HWP_IFRAME_READY', payload: { gameId: GAME_ID, protocolVersion: 1 } },
      '*'
    );
  }

  document.getElementById('btn-start').addEventListener('click', startGame);
  document.getElementById('btn-peek').addEventListener('click', onPeek);
  document.getElementById('btn-ready').addEventListener('click', onReadyForGuess);
  document.getElementById('btn-take').addEventListener('click', () => onGuess(true));
  document.getElementById('btn-leave').addEventListener('click', () => onGuess(false));
  document.getElementById('btn-next').addEventListener('click', onNextRound);
  document.getElementById('btn-menu').addEventListener('click', () => showScreen('setup'));
  document.getElementById('btn-back-home').addEventListener('click', navHome);

  showScreen('setup');
  updateScores();
});
