/**
 * ui.js — DOM interaction, rendering, and game flow for Boxes of 12
 *
 * Depends on: game.js, ai.js (loaded before this file via index.html)
 */

'use strict';

// ── Player options ────────────────────────────────────────────────────────���───

const PLAYER_OPTS = [
  { id: 'human',                     label: 'Human' },
  { id: 'heuristic',                 label: 'Heuristic Bot' },
  { id: 'claude-sonnet-4-20250514',  label: 'Claude Sonnet 4' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
];

// ── App state ─────────────────────────────────────────────────────────────────

let cfg = { R: 8, C: 8, rule: 'plusminus', p: ['human', 'human'] };
let state     = null;
let aiRunning = false;

// UI-only selection state (not part of game logic)
let selN = null; // currently selected number in the picker
let hovC = null; // hovered capture option index
let selC = null; // selected capture option index

// ── Screen management ─────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s =>
    s.classList.toggle('hidden', s.id !== `screen-${id}`)
  );
}

// ── Message bar ───────────────────────────────────────────────────────────────

function setMessage(text, player) {
  const el = document.getElementById('message-bar');
  el.textContent = (aiRunning ? '⟳ ' : '') + text;
  const c = CLR[player ?? state?.turn ?? 0];
  el.style.borderColor = c;
  el.style.color       = c;
  const ind = document.getElementById('indicator');
  if (ind) ind.style.color = c;
}

// ── Score display ─────────────────────────────────────────────────────────────

function updateScores() {
  if (!state) return;
  document.getElementById('score-p1').textContent = `X ${state.scores[0]}`;
  document.getElementById('score-p2').textContent = `O ${state.scores[1]}`;
}

// ── Number picker ─────────────────────────────────────────────────────────────

function renderNumPicker() {
  const el = document.getElementById('num-picker');
  el.innerHTML = '';
  if (cfg.p[state.turn] !== 'human' || aiRunning) return;

  const vn = cfg.rule === 'dice'
    ? (state.dice ? [state.dice] : [])
    : validNums(cfg.rule, state.lnums[state.turn], state.cyc);
  const needPick = cfg.rule === 'free' || cfg.rule === 'plusminus';
  const autoN    = !needPick && vn[0] ? vn[0] : null;

  if (needPick) {
    vn.forEach(n => {
      const btn = document.createElement('button');
      btn.className = 'num-btn'
        + (state.turn === 1 ? ' p2' : '')
        + (selN === n      ? ' active' : '');
      btn.textContent = n;
      btn.onclick = () => {
        selN = selN === n ? null : n;
        renderNumPicker();
        renderBoard();
      };
      el.appendChild(btn);
    });
    const hint = document.createElement('span');
    hint.id = 'pick-hint';
    hint.textContent = selN ? `Selected: ${selN}` : '← pick a number first';
    el.appendChild(hint);

  } else if (autoN) {
    const lbl = document.createElement('span');
    lbl.id = 'auto-label';
    lbl.innerHTML = `Place: <strong style="color:${CLR[state.turn]};font-size:1.1rem">${autoN}</strong>`;
    el.appendChild(lbl);
  }
}

// ── Board rendering ───────────────────────────────────────────────────────────

function renderBoard() {
  const el  = document.getElementById('board');
  const csz = Math.max(28, Math.min(46, Math.floor(380 / Math.max(cfg.R, cfg.C))));
  el.style.gridTemplateColumns = `repeat(${cfg.C}, ${csz}px)`;

  const isHuman = cfg.p[state.turn] === 'human';
  const vn = cfg.rule === 'dice'
    ? (state.dice ? [state.dice] : [])
    : validNums(cfg.rule, state.lnums[state.turn], state.cyc);
  const needPick = cfg.rule === 'free' || cfg.rule === 'plusminus';
  const autoN    = !needPick && vn[0] ? vn[0] : null;
  const canPlace = state.phase === 'place' && isHuman && !aiRunning
    && (needPick ? selN : autoN);

  el.innerHTML = '';
  for (let r = 0; r < cfg.R; r++) {
    for (let c = 0; c < cfg.C; c++) {
      const cell = state.board[r][c];
      const div  = document.createElement('div');
      div.className  = 'cell';
      div.style.width = div.style.height = csz + 'px';
      div.style.fontSize = csz > 36 ? '.88rem' : '.7rem';

      const isLast   = state.lastPl && state.lastPl[0] === r && state.lastPl[1] === c;
      const isCapSel = selC !== null && state.caps[selC]?.some(([a,b]) => a===r && b===c);
      const isCapHov = hovC !== null && state.caps[hovC]?.some(([a,b]) => a===r && b===c);

      if      (cell.o === 'X') div.classList.add('owned-x');
      else if (cell.o === 'O') div.classList.add('owned-o');
      else if (isCapSel)       div.classList.add('cap-sel');
      else if (isCapHov)       div.classList.add('cap-hover');
      else if (isLast) {
        div.classList.add('last-placed');
        if (state.turn === 1) div.classList.add('o-turn');
      } else if (canPlace && !cell.v) {
        div.classList.add('droppable');
      }

      if (state.phase === 'capture' && isHuman) div.classList.add('cap-cursor');
      div.textContent = cell.o || cell.v || '';

      div.addEventListener('mouseenter', () => {
        if (state.phase !== 'capture') return;
        const m = state.caps.findIndex(cap => cap.some(([a,b]) => a===r && b===c));
        if (m >= 0) { hovC = m; renderBoard(); }
      });
      div.addEventListener('mouseleave', () => {
        if (state.phase === 'capture' && hovC !== null) { hovC = null; renderBoard(); }
      });
      div.addEventListener('click', () => onCellClick(r, c));
      el.appendChild(div);
    }
  }
}

// ── Capture panel ─────────────────────────────────────────────────────────────

function renderCapPanel() {
  const panel = document.getElementById('cap-panel');
  const aiMsg = document.getElementById('ai-cap-msg');
  const isHuman = cfg.p[state.turn] === 'human';

  if (state.phase !== 'capture') {
    panel.classList.add('hidden');
    aiMsg.classList.add('hidden');
    return;
  }
  if (!isHuman) {
    panel.classList.add('hidden');
    aiMsg.classList.remove('hidden');
    aiMsg.style.color = CLR[state.turn];
    return;
  }

  aiMsg.classList.add('hidden');
  panel.classList.remove('hidden');

  const opts = document.getElementById('cap-options');
  opts.innerHTML = '';
  state.caps.forEach((cap, i) => {
    const sum = cap.reduce((s, [r,c]) => s + state.board[r][c].v, 0);
    const btn = document.createElement('button');
    btn.className = 'cap-opt' + (selC === i ? ' selected' : '');
    btn.textContent = `▣ ${cap.length} sq · Σ=${sum}`;
    btn.addEventListener('mouseenter', () => { hovC = i; renderBoard(); });
    btn.addEventListener('mouseleave', () => { hovC = null; renderBoard(); });
    btn.addEventListener('click', () => {
      selC = selC === i ? null : i;
      renderCapPanel();
      renderBoard();
    });
    opts.appendChild(btn);
  });

  const confirmBtn = document.getElementById('cap-confirm');
  confirmBtn.disabled  = selC === null;
  confirmBtn.className = 'cap-confirm'
    + (selC !== null ? ' ready' + (state.turn === 1 ? ' p2' : '') : '');
}

// ── Game flow ─────────────────────────────────────────────────────────────────

function startGame() {
  state     = createState(cfg);
  aiRunning = false;
  selN = null; hovC = null; selC = null;
  showScreen('game');
  const firstIsAI = cfg.p[0] !== 'human';
  setMessage(firstIsAI ? 'AI thinking…' : 'Player 1 (X) goes first!', 0);
  renderNumPicker();
  renderBoard();
  renderCapPanel();
  updateScores();
  if (firstIsAI) scheduleAI();
}

function advance() {
  updateScores();
  if (isGameOver(state)) { endGame(); return; }

  state.turn   = 1 - state.turn;
  state.phase  = 'place';
  state.caps   = [];
  state.lastPl = null;
  if (cfg.rule === 'dice') state.dice = rollDice();
  selN = null; hovC = null; selC = null;

  const nextIsAI = cfg.p[state.turn] !== 'human';
  setMessage(
    nextIsAI
      ? 'AI thinking…'
      : `Player ${state.turn + 1} (${SYMS[state.turn]})'s turn`
  );
  renderNumPicker();
  renderBoard();
  renderCapPanel();
  if (nextIsAI) scheduleAI();
}

function doPlace(r, c, n) {
  const nb = cloneBoard(state.board);
  nb[r][c] = { v: n, o: null };
  const nl = [...state.lnums];
  nl[state.turn] = n;
  state.board  = nb;
  state.lnums  = nl;
  state.cyc   += 1;
  state.lastPl = [r, c];
  selN = null;

  const found = findCaptures(nb, r, c);
  if (found.length) {
    state.caps  = found;
    state.phase = 'capture';
    selC = null; hovC = null;
    const isHuman = cfg.p[state.turn] === 'human';
    setMessage(
      isHuman
        ? `${found.length} capture option${found.length > 1 ? 's' : ''}! Select one.`
        : 'AI found capture…'
    );
    renderNumPicker();
    renderBoard();
    renderCapPanel();
    if (!isHuman) scheduleAI();
  } else {
    advance();
  }
}

function doCapture(idx) {
  const cap = state.caps[idx];
  const nb  = cloneBoard(state.board);
  cap.forEach(([r, c]) => { nb[r][c] = { ...nb[r][c], o: SYMS[state.turn] }; });
  state.scores[state.turn] += cap.length;
  state.board = nb;
  advance();
}

function onCellClick(r, c) {
  if (cfg.p[state.turn] !== 'human' || aiRunning) return;

  if (state.phase === 'capture') {
    const matches = state.caps.reduce((acc, cap, i) => {
      if (cap.some(([cr, cc]) => cr === r && cc === c)) acc.push(i);
      return acc;
    }, []);
    if (matches.length) {
      selC = (selC !== null && matches.includes(selC))
        ? matches[(matches.indexOf(selC) + 1) % matches.length]
        : matches[0];
      renderCapPanel();
      renderBoard();
    }
    return;
  }

  if (state.phase !== 'place' || state.board[r][c].v || state.board[r][c].o !== null) return;
  const vn = cfg.rule === 'dice'
    ? (state.dice ? [state.dice] : [])
    : validNums(cfg.rule, state.lnums[state.turn], state.cyc);
  const needPick = cfg.rule === 'free' || cfg.rule === 'plusminus';
  const n        = needPick ? selN : vn[0];
  if (!n || !vn.includes(n)) return;
  doPlace(r, c, n);
}

function endGame() {
  const [s0, s1] = state.scores;
  const winner   = getWinner(state);
  const msg = winner === 0 ? `X wins — ${s0} vs ${s1}`
            : winner === 1 ? `O wins — ${s1} vs ${s0}`
            : `Tie — ${s0} each`;
  document.getElementById('over-message').textContent = msg;
  document.getElementById('final-p1').textContent     = s0;
  document.getElementById('final-p2').textContent     = s1;
  document.getElementById('final-p1').style.textShadow = winner === 0 ? `0 0 20px ${CLR[0]}` : 'none';
  document.getElementById('final-p2').style.textShadow = winner === 1 ? `0 0 20px ${CLR[1]}` : 'none';
  showScreen('over');
}

// ── AI orchestration ──────────────────────────────────────────────────────────

function scheduleAI() {
  if (aiRunning) return;
  aiRunning = true;
  setMessage('AI thinking…', state.turn);
  setTimeout(runAI, 700);
}

async function runAI() {
  try {
    if (state.phase === 'capture') {
      // Pick the largest capture group
      const best = state.caps.reduce(
        (bi, cap, i) => cap.length > state.caps[bi].length ? i : bi, 0
      );
      aiRunning = false;
      doCapture(best);

    } else {
      const model = cfg.p[state.turn];
      const mv = model === 'heuristic'
        ? heuristicMove(state)
        : await claudeMove(state, model);
      aiRunning = false;
      if (mv) doPlace(mv.row, mv.col, mv.num);
    }

  } catch (err) {
    console.error('AI error:', err);
    aiRunning = false;
    const fallback = heuristicMove(state);
    if (fallback) doPlace(fallback.row, fallback.col, fallback.num);
  }
}

// ── Setup UI wiring ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // Grid size
  document.getElementById('grid-btns').addEventListener('click', e => {
    const s = e.target.dataset.size;
    if (!s) return;
    cfg.R = cfg.C = +s;
    document.querySelectorAll('#grid-btns .opt-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.size === s)
    );
  });

  // Number rules
  document.getElementById('rule-btns').addEventListener('click', e => {
    const rule = e.target.dataset.rule;
    if (!rule) return;
    cfg.rule = rule;
    document.querySelectorAll('#rule-btns .rule-btn').forEach(b =>
      b.classList.toggle('active', b === e.target)
    );
  });

  // Player selectors (built dynamically)
  [0, 1].forEach(p => {
    const group = document.getElementById(`p${p}-btns`);
    PLAYER_OPTS.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn'
        + (cfg.p[p] === opt.id ? (p === 0 ? ' active-p1' : ' active-p2') : '');
      btn.textContent  = opt.label;
      btn.dataset.pid  = opt.id;
      btn.addEventListener('click', () => {
        cfg.p[p] = opt.id;
        group.querySelectorAll('.opt-btn').forEach(b => {
          b.className = 'opt-btn'
            + (b.dataset.pid === opt.id ? (p === 0 ? ' active-p1' : ' active-p2') : '');
        });
      });
      group.appendChild(btn);
    });
  });

  // Start / Play again
  document.getElementById('btn-start').addEventListener('click', startGame);
  document.getElementById('btn-play-again').addEventListener('click', startGame);

  // Menu navigation
  document.getElementById('btn-menu').addEventListener('click', () => showScreen('setup'));
  document.getElementById('btn-back-setup').addEventListener('click', () => showScreen('setup'));

  // Back to catalog / parent shell
  document.getElementById('btn-back-home').addEventListener('click', () => {
    if (window.parent !== window) window.parent.postMessage({ type: 'NAV_HOME' }, '*');
    else window.location.href = '/';
  });

  // Capture actions
  document.getElementById('cap-confirm').addEventListener('click', () => {
    if (selC !== null) doCapture(selC);
  });
  document.getElementById('cap-skip').addEventListener('click', () => advance());

  showScreen('setup');
});
