/**
 * game.js — Core game logic
 *
 * Keep this file pure: no DOM access, no rendering.
 * All functions take state as input and return new state.
 * UI.js calls these functions and handles all rendering.
 */

'use strict';

// ── Constants ────────────────────────────────────────────────────────────────

const GAME = {
  PLAYERS: [0, 1],
  SYMBOLS: ['X', 'O'],
  // Add game-specific constants here
};

// ── State factory ────────────────────────────────────────────────────────────

/**
 * Returns a fresh game state object.
 * @param {object} cfg - Setup configuration from UI
 */
function createState(cfg) {
  return {
    cfg,
    turn: 0,          // 0 or 1
    scores: [0, 0],
    phase: 'play',    // e.g. 'play', 'capture', 'over'
    // Add game-specific state here
  };
}

// ── Core logic ───────────────────────────────────────────────────────────────

/**
 * Returns true if the move is valid given current state.
 * @param {object} state
 * @param {object} move
 */
function isValidMove(state, move) {
  // TODO: implement
  return true;
}

/**
 * Applies a move to state. Returns new state (do not mutate).
 * @param {object} state
 * @param {object} move
 */
function applyMove(state, move) {
  // TODO: implement
  const next = deepClone(state);
  return next;
}

/**
 * Returns true if the game is over.
 * @param {object} state
 */
function isGameOver(state) {
  // TODO: implement
  return false;
}

/**
 * Returns the winner index (0 or 1), or null for a tie.
 * @param {object} state
 */
function getWinner(state) {
  // TODO: implement
  if (state.scores[0] > state.scores[1]) return 0;
  if (state.scores[1] > state.scores[0]) return 1;
  return null;
}

// ── Utilities ────────────────────────────────────────────────────────────────

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function nextPlayer(p) {
  return 1 - p;
}
