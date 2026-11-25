'use strict';
const { evaluate, newDeck } = require('./hand');

// Win probability per player (like a TV broadcast overlay).
// hands: array of [c1,c2] (null for folded players), board: 0..5 cards.
function equity(hands, board, iterations = 1500) {
  const live = hands.map((h, i) => (h ? i : -1)).filter(i => i >= 0);
  const out = hands.map(() => null);
  if (live.length === 0) return out;
  if (live.length === 1) { out[live[0]] = { win: 1, tie: 0 }; return out; }

  const used = new Set(board);
  for (const i of live) for (const c of hands[i]) used.add(c);
  const rest = newDeck().filter(c => !used.has(c));
  const need = 5 - board.length;
  // exhaustive when cheap (turn->river), otherwise sampled
  const wins = new Array(hands.length).fill(0);
  const ties = new Array(hands.length).fill(0);
  let total = 0;

  const run = extra => {
    const full = board.concat(extra);
    let best = -1, winners = [];
    for (const i of live) {
      const s = evaluate(hands[i].concat(full)).score;
      if (s > best) { best = s; winners = [i]; } else if (s === best) winners.push(i);
    }
    if (winners.length === 1) wins[winners[0]]++;
    else for (const w of winners) ties[w] += 1 / winners.length;
    total++;
  };

  if (need === 0) run([]);
  else if (need === 1) for (const c of rest) run([c]);
  else if (need === 2 && rest.length < 50) {
    for (let a = 0; a < rest.length; a++) for (let b = a + 1; b < rest.length; b++) run([rest[a], rest[b]]);
  } else {
    const deck = rest.slice();
    for (let it = 0; it < iterations; it++) {
      for (let k = 0; k < need; k++) {
        const j = k + Math.floor(Math.random() * (deck.length - k));
        [deck[k], deck[j]] = [deck[j], deck[k]];
      }
      run(deck.slice(0, need));
    }
  }
  for (const i of live) out[i] = { win: wins[i] / total, tie: ties[i] / total };
  return out;
}

module.exports = { equity };
