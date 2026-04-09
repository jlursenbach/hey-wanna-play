'use strict';

const ITEMS = [
  { id: 'trophy', emoji: '🏆', label: 'Trophy', want: true },
  { id: 'cash', emoji: '💰', label: 'Cash', want: true },
  { id: 'diamond', emoji: '💎', label: 'Diamond', want: true },
  { id: 'gift', emoji: '🎁', label: 'Gift', want: true },
  { id: 'rocket', emoji: '🚀', label: 'Rocket', want: true },
  { id: 'bomb', emoji: '💣', label: 'Bomb', want: false },
  { id: 'skull', emoji: '💀', label: 'Skull', want: false },
  { id: 'bug', emoji: '🪲', label: 'Bug', want: false },
  { id: 'trash', emoji: '🗑️', label: 'Trash', want: false },
  { id: 'poop', emoji: '💩', label: 'Poop', want: false },
];

function randomItem() {
  return ITEMS[Math.floor(Math.random() * ITEMS.length)];
}

function createState(cfg = {}) {
  return {
    cfg,
    round: 1,
    scores: [0, 0],
    phase: 'peek',
    peeker: 0,
    currentItem: null,
    lastResult: null,
  };
}

function peekerForRound(round) {
  return (round - 1) % 2;
}

function startRound(state) {
  return {
    ...state,
    phase: 'peek',
    peeker: peekerForRound(state.round),
    currentItem: null,
    lastResult: null,
  };
}

function revealForPeeker(state, item = null) {
  return {
    ...state,
    currentItem: item || randomItem(),
    phase: 'peek-revealed',
  };
}

function resolveGuess(state, took) {
  if (!state.currentItem) return state;

  const guesser = 1 - state.peeker;
  const correct = took === state.currentItem.want;
  const winner = correct ? guesser : state.peeker;
  const scores = [...state.scores];
  scores[winner] += 1;

  return {
    ...state,
    scores,
    phase: 'result',
    lastResult: {
      took,
      correct,
      winner,
      guesser,
      item: state.currentItem,
    },
  };
}

function nextRound(state) {
  return startRound({
    ...state,
    round: state.round + 1,
    currentItem: null,
    lastResult: null,
  });
}

function itemById(id) {
  return ITEMS.find((item) => item.id === id) || null;
}
