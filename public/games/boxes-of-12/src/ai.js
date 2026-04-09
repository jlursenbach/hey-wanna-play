/**
 * ai.js — AI player logic for Boxes of 12
 *
 * Two AI types:
 *   heuristic  — fast, local, no API call
 *   claude     — calls Anthropic API, falls back to heuristic on error
 *
 * Depends on: game.js (adj, cloneBoard, findCaptures, validNums)
 */

'use strict';

// ── Heuristic AI ─────────────────────────────────────────────────────────────

/**
 * Returns all legal moves for the current player.
 * A move is { row, col, num }.
 */
function getLegalMoves(state) {
  const { board, cfg, turn, lnums, cyc, dice } = state;
  const R = board.length, C = board[0].length;
  const vn = cfg.rule === 'dice'
    ? (dice ? [dice] : [])
    : validNums(cfg.rule, lnums[turn], cyc);
  const moves = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (!board[r][c].v && board[r][c].o === null)
        vn.forEach(n => moves.push({ row: r, col: c, num: n }));
  return moves;
}

/**
 * Scores a candidate move from the current player's perspective.
 * Higher = better.
 */
function evaluateMove(state, move) {
  const { board, turn } = state;
  const R = board.length, C = board[0].length;
  const nb = cloneBoard(board);
  nb[move.row][move.col] = { v: move.num, o: null };

  const cp = findCaptures(nb, move.row, move.col);
  let score = cp.length ? Math.max(...cp.map(cap => cap.length)) * 4 : 0;

  // Penalise moves that open captures for the opponent
  adj(move.row, move.col, R, C).forEach(([nr, nc]) => {
    if (nb[nr][nc].v && !nb[nr][nc].o) {
      const opp = findCaptures(nb, nr, nc);
      if (opp.length) score -= Math.max(...opp.map(cap => cap.length)) * 2.5;
    }
    if (nb[nr][nc].v) score += 0.4; // small bonus for adjacency
  });

  return score;
}

/**
 * Returns the best move for the current player using heuristic evaluation.
 * Samples up to 60 random empty cells for performance on large grids.
 */
function heuristicMove(state) {
  const { board, cfg, turn, lnums, cyc, dice } = state;
  const R = board.length, C = board[0].length;
  const vn = cfg.rule === 'dice'
    ? (dice ? [dice] : [])
    : validNums(cfg.rule, lnums[turn], cyc);
  if (!vn.length) return null;

  const cells = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (!board[r][c].v && board[r][c].o === null) cells.push([r, c]);

  // Shuffle for random sampling
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  let best = null, bestScore = -Infinity;
  for (const [r, c] of cells.slice(0, 60)) {
    for (const n of vn) {
      const score = evaluateMove(state, { row: r, col: c, num: n });
      if (score > bestScore) { bestScore = score; best = { row: r, col: c, num: n }; }
    }
  }

  if (!best && cells.length) best = { row: cells[0][0], col: cells[0][1], num: vn[0] };
  return best;
}

// ── Claude API AI ─────────────────────────────────────────────────────────────

function boardToString(state) {
  return state.board
    .map(row => row.map(c => c.o || c.v || '.').join(' '))
    .join('\n');
}

function buildPrompt(state, boardStr) {
  const { cfg, turn, scores, lnums, cyc, dice } = state;
  const vn = cfg.rule === 'dice'
    ? (dice ? [dice] : [])
    : validNums(cfg.rule, lnums[turn], cyc);
  return `Game: "Boxes of ${TARGET}" — ${cfg.R}x${cfg.C} grid, rows/cols 0-indexed.
Cells: . empty  1-5 placed numbers  X/O captured squares.
Rules: Place a number on an empty cell. Connected groups (4-way adjacency) of uncaptured numbered cells summing to exactly ${TARGET} that include your placed cell can be captured. More captured squares = better.
Board (row 0 = top):
${boardStr}
You are Player ${turn + 1} (${SYMS[turn]}). Scores: X=${scores[0]}, O=${scores[1]}.
Valid numbers this turn: ${vn.join(', ')}.
Respond ONLY with valid JSON: {"row":0,"col":0,"num":1}`;
}

/**
 * Asks Claude for a move. Falls back to heuristic on any error.
 * @param {object} state
 * @param {string} model - e.g. 'claude-sonnet-4-20250514'
 * @returns {Promise<{row, col, num}>}
 */
async function claudeMove(state, model) {
  try {
    const boardStr = boardToString(state);
    const prompt   = buildPrompt(state, boardStr);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: 150,
        system: 'You are a strategic game AI. Output ONLY a JSON object with keys row, col, num. No markdown, no explanation.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    const txt  = data.content?.find(b => b.type === 'text')?.text || '';
    const mv   = JSON.parse(txt.replace(/```[\w\s]*/g, '').replace(/```/g, '').trim());

    // Validate
    const { board, cfg } = state;
    if (
      typeof mv.row !== 'number' || mv.row < 0 || mv.row >= cfg.R ||
      mv.col < 0 || mv.col >= cfg.C ||
      board[mv.row][mv.col].v || board[mv.row][mv.col].o !== null
    ) throw new Error('Invalid move from Claude');

    return mv;

  } catch (err) {
    console.warn('Claude AI error, falling back to heuristic:', err);
    return heuristicMove(state);
  }
}
