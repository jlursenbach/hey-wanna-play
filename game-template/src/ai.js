/**
 * ai.js — AI player logic
 *
 * Two AI types:
 *   heuristic  — fast, local, no API call
 *   claude     — calls Anthropic API, falls back to heuristic on error
 */

'use strict';

// ── Heuristic AI ─────────────────────────────────────────────────────────────

/**
 * Returns the best move for the current player using heuristic evaluation.
 * @param {object} state - Current game state
 * @returns {object} move
 */
function heuristicMove(state) {
  const moves = getLegalMoves(state);
  if (!moves.length) return null;

  let best = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    const score = evaluateMove(state, move);
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }

  return best;
}

/**
 * Returns all legal moves for the current player.
 * @param {object} state
 * @returns {object[]}
 */
function getLegalMoves(state) {
  // TODO: implement
  return [];
}

/**
 * Scores a move from the current player's perspective.
 * Higher = better.
 * @param {object} state
 * @param {object} move
 * @returns {number}
 */
function evaluateMove(state, move) {
  // TODO: implement
  return Math.random(); // placeholder: random until implemented
}

// ── Claude API AI ─────────────────────────────────────────────────────────────

/**
 * Asks Claude API for a move. Falls back to heuristic on any error.
 * @param {object} state - Current game state
 * @param {string} model - Model string e.g. 'claude-sonnet-4-20250514'
 * @returns {Promise<object>} move
 */
async function claudeMove(state, model) {
  try {
    const board = boardToString(state);
    const prompt = buildPrompt(state, board);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: 150,
        system: 'You are a strategic game AI. Output ONLY a valid JSON move object. No markdown, no explanation.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';
    const move = JSON.parse(text.replace(/```[\w\s]*/g, '').replace(/```/g, '').trim());

    if (isValidMove(state, move)) return move;
    throw new Error('Invalid move from Claude');

  } catch (err) {
    console.warn('Claude AI error, falling back to heuristic:', err);
    return heuristicMove(state);
  }
}

/**
 * Converts board state to a human-readable string for the prompt.
 * @param {object} state
 * @returns {string}
 */
function boardToString(state) {
  // TODO: implement — return ASCII representation of the board
  return '';
}

/**
 * Builds the prompt sent to Claude.
 * @param {object} state
 * @param {string} board
 * @returns {string}
 */
function buildPrompt(state, board) {
  return `
Game: [Game Name]
Board:\n${board}
You are Player ${state.turn + 1} (${['X','O'][state.turn]}).
Scores: X=${state.scores[0]}, O=${state.scores[1]}.
Respond ONLY with a JSON move object.
  `.trim();
}
