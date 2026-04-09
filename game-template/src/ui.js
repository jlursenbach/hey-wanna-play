/**
 * ui.js — All DOM interaction and rendering
 *
 * This file owns the screen, reads user input,
 * calls game.js for logic, and updates the DOM.
 * No game logic lives here.
 */

'use strict';

// ── Config ───────────────────────────────────────────────────────────────────

const PLAYER_OPTS = [
  { id: 'human',                     label: 'Human' },
  { id: 'heuristic',                 label: 'Heuristic Bot' },
  { id: 'claude-sonnet-4-20250514',  label: 'Claude Sonnet 4' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
];

const CLR = ['#F59E0B', '#22D3EE']; // p1 amber, p2 cyan

// ── App state ────────────────────────────────────────────────────────────────

let cfg = {
  players: ['human', 'human'],
  // Add game-specific config here
};

let state = null;
let aiRunning = false;

// ── Screen management ────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s =>
    s.classList.toggle('hidden', s.id !== `screen-${id}`)
  );
}

// ── Message bar ──────────────────────────────────────────────────────────────

function setMessage(text, player) {
  const el = document.getElementById('message-bar');
  el.textContent = (aiRunning ? '⟳ ' : '') + text;
  el.style.borderColor = CLR[player ?? state?.turn ?? 0];
  el.style.color       = CLR[player ?? state?.turn ?? 0];
}

// ── Score display ────────────────────────────────────────────────────────────

function updateScores() {
  if (!state) return;
  document.getElementById('scores').innerHTML =
    `<span class="score p1">X ${state.scores[0]}</span>
     <span class="score-div">|</span>
     <span class="score p2">O ${state.scores[1]}</span>`;
}

// ── Board rendering ──────────────────────────────────────────────────────────

function renderBoard() {
  const el = document.getElementById('game-content');
  el.innerHTML = '';
  // TODO: build and append board DOM elements
  // Call this after every state change
}

// ── Game flow ────────────────────────────────────────────────────────────────

function startGame() {
  state = createState(cfg);
  aiRunning = false;
  showScreen('game');
  setMessage(`Player 1 (X)'s turn`, 0);
  renderBoard();
  updateScores();
  if (isAI(0)) scheduleAI();
}

function handleMove(move) {
  if (!isValidMove(state, move)) return;
  state = applyMove(state, move);
  renderBoard();
  updateScores();

  if (isGameOver(state)) {
    endGame();
    return;
  }

  const next = state.turn;
  setMessage(`Player ${next + 1} (${['X','O'][next]})'s turn`, next);
  if (isAI(next)) scheduleAI();
}

function endGame() {
  const winner = getWinner(state);
  const [s0, s1] = state.scores;
  const msg = winner === 0 ? `X wins — ${s0} vs ${s1}`
            : winner === 1 ? `O wins — ${s1} vs ${s0}`
            : `Tie — ${s0} each`;

  document.getElementById('over-message').textContent = msg;
  document.getElementById('final-p1').textContent = s0;
  document.getElementById('final-p2').textContent = s1;
  document.getElementById('final-p1').style.textShadow =
    winner === 0 ? `0 0 20px ${CLR[0]}` : 'none';
  document.getElementById('final-p2').style.textShadow =
    winner === 1 ? `0 0 20px ${CLR[1]}` : 'none';

  showScreen('over');
}

// ── AI ───────────────────────────────────────────────────────────────────────

function isAI(p) {
  return cfg.players[p] !== 'human';
}

function scheduleAI() {
  if (aiRunning) return;
  aiRunning = true;
  setMessage('AI thinking…', state.turn);
  setTimeout(runAI, 700);
}

async function runAI() {
  try {
    const model = cfg.players[state.turn];
    const move = model === 'heuristic'
      ? heuristicMove(state)
      : await claudeMove(state, model);

    if (move) handleMove(move);
  } catch (e) {
    console.error('AI error:', e);
    const fallback = heuristicMove(state);
    if (fallback) handleMove(fallback);
  } finally {
    aiRunning = false;
  }
}

// ── Setup UI wiring ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // Player selectors
  [0, 1].forEach(p => {
    const group = document.querySelector(`[data-player="${p}"]`);
    if (!group) return;
    PLAYER_OPTS.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn' + (cfg.players[p] === opt.id
        ? (p === 0 ? ' active-p1' : ' active-p2') : '');
      btn.textContent = opt.label;
      btn.dataset.pid = opt.id;
      btn.addEventListener('click', () => {
        cfg.players[p] = opt.id;
        group.querySelectorAll('.opt-btn').forEach(b => {
          b.className = 'opt-btn' +
            (b.dataset.pid === opt.id ? (p === 0 ? ' active-p1' : ' active-p2') : '');
        });
      });
      group.appendChild(btn);
    });
  });

  // Start
  document.getElementById('btn-start')
    ?.addEventListener('click', startGame);

  // Play again
  document.getElementById('btn-play-again')
    ?.addEventListener('click', startGame);

  // Back to setup from game
  document.getElementById('btn-menu')
    ?.addEventListener('click', () => showScreen('setup'));

  // Back to setup from over
  document.getElementById('btn-back-setup')
    ?.addEventListener('click', () => showScreen('setup'));

  // Back to home (parent app)
  document.getElementById('btn-back-home')
    ?.addEventListener('click', () => {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'NAV_HOME' }, '*');
      } else {
        window.location.href = '/';
      }
    });

  showScreen('setup');
});
