/**
 * game.js — Core game logic for Boxes of 12
 *
 * Pure functions only. No DOM access, no rendering.
 * All functions take state/board as input and return new values.
 */

'use strict';

// ── Constants ────────────────────────────────────────────────────────────────

const TARGET = 12;
const SYMS   = ['X', 'O'];
const CLR    = ['#F59E0B', '#22D3EE'];

// ── State factory ────────────────────────────────────────────────────────────

/**
 * Returns a fresh game state object.
 * @param {object} cfg - { R, C, rule, p: ['human','human'] }
 */
function createState(cfg) {
  return {
    cfg,
    board:  emptyBoard(cfg.R, cfg.C),
    turn:   0,
    scores: [0, 0],
    phase:  'place',      // 'place' | 'capture'
    lnums:  [null, null], // last number placed per player (for +/−1 rule)
    cyc:    0,            // placement counter (for cycle rule)
    dice:   cfg.rule === 'dice' ? rollDice() : null,
    caps:   [],           // current capture options (set during capture phase)
    lastPl: null,         // [r, c] of last placed cell (for highlight)
  };
}

function isGameOver(state) {
  return isFull(state.board);
}

function getWinner(state) {
  if (state.scores[0] > state.scores[1]) return 0;
  if (state.scores[1] > state.scores[0]) return 1;
  return null;
}

// ── Board utilities ─────────────────────────────────���────────────────────────

function emptyBoard(R, C) {
  return Array(R).fill(null).map(() =>
    Array(C).fill(null).map(() => ({ v: 0, o: null }))
  );
}

function isFull(b) {
  return b.every(row => row.every(c => c.v || c.o !== null));
}

function cloneBoard(b) {
  return b.map(row => row.map(c => ({ ...c })));
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function rollDice() {
  return 1 + Math.floor(Math.random() * 5);
}

// ── Grid helpers ─────────────────────────────────────────────────────────────

function adj(r, c, R, C) {
  return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]
    .filter(([a, b]) => a >= 0 && a < R && b >= 0 && b < C);
}

/**
 * Returns all cells in the connected free component containing (r0,c0).
 * "Free" = has a value, not yet captured.
 */
function connectedFreeComp(b, r0, c0) {
  const R = b.length, C = b[0].length;
  const vis = new Set(), stk = [`${r0},${c0}`], out = [];
  while (stk.length) {
    const k = stk.pop();
    if (vis.has(k)) continue;
    const [r, c] = k.split(',').map(Number);
    if (!b[r][c].v || b[r][c].o !== null) continue;
    vis.add(k);
    out.push([r, c]);
    adj(r, c, R, C).forEach(([nr, nc]) => {
      const nk = `${nr},${nc}`;
      if (!vis.has(nk) && b[nr][nc].v && b[nr][nc].o === null) stk.push(nk);
    });
  }
  return out;
}

// ── Capture logic ────────────────────────────────────────────────────────────

/**
 * Returns all valid capture groups after placing at (ar, ac).
 * Each group is an array of [r, c] pairs that sum to TARGET.
 */
function findCaptures(b, ar, ac) {
  const R = b.length, C = b[0].length;
  const comp = connectedFreeComp(b, ar, ac);
  if (!comp.length) return [];

  const compSet = new Set(comp.map(([r, c]) => `${r},${c}`));
  const av = b[ar][ac].v;
  if (!av || av > TARGET) return [];

  const results = [], seen = new Set();
  const ak = `${ar},${ac}`;

  function dfs(inSet, list, sum, ext) {
    if (sum === TARGET) {
      const k = [...list].sort().join('|');
      if (!seen.has(k)) {
        seen.add(k);
        results.push(list.map(s => s.split(',').map(Number)));
      }
      return;
    }
    if (results.length >= 30) return;
    for (const ck of ext) {
      const [r, c] = ck.split(',').map(Number);
      const v = b[r][c].v;
      if (sum + v > TARGET) continue;
      const ne = new Set(ext);
      ne.delete(ck);
      adj(r, c, R, C).forEach(([nr, nc]) => {
        const nk = `${nr},${nc}`;
        if (compSet.has(nk) && !inSet.has(nk)) ne.add(nk);
      });
      inSet.add(ck);
      dfs(inSet, [...list, ck], sum + v, ne);
      inSet.delete(ck);
    }
  }

  const initExt = new Set();
  adj(ar, ac, R, C).forEach(([nr, nc]) => {
    const nk = `${nr},${nc}`;
    if (compSet.has(nk)) initExt.add(nk);
  });
  dfs(new Set([ak]), [ak], av, initExt);
  return results;
}

// ── Number rules ─────────────────────────────────────────────────────────────

/**
 * Returns the valid numbers a player can place given the current rule.
 * @param {string} rule - 'plusminus' | 'free' | 'cycle' | 'dice'
 * @param {number|null} lastN - last number this player placed
 * @param {number} cyc - total placements so far (for cycle rule)
 */
function validNums(rule, lastN, cyc) {
  if (rule === 'free')  return [1, 2, 3, 4, 5];
  if (rule === 'cycle') return [(cyc % 5) + 1];
  if (rule === 'plusminus') {
    if (!lastN) return [1, 2, 3, 4, 5];
    const a = lastN === 1 ? 5 : lastN - 1;
    const b = lastN === 5 ? 1 : lastN + 1;
    return a === b ? [a] : [a, b];
  }
  return [1, 2, 3, 4, 5]; // dice: handled externally via state.dice
}
