'use strict';
// Card format: rank char + suit char, e.g. "As", "Td", "2c".
const RANKS = '23456789TJQKA';
const SUITS = 'shdc';

const CATEGORY_NAMES = [
  'קלף גבוה', 'זוג', 'שני זוגות', 'שלישייה', 'רצף',
  'צבע', 'פול האוס', 'רביעייה', 'רצף צבע', 'רויאל פלאש',
];

const RANK_NAMES = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
  10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

function rankOf(card) { return RANKS.indexOf(card[0]) + 2; }
function suitOf(card) { return card[1]; }

function newDeck() {
  const d = [];
  for (const r of RANKS) for (const s of SUITS) d.push(r + s);
  return d;
}

// Highest straight top-card from a set of ranks, or 0.
function straightHigh(rankSet) {
  for (let top = 14; top >= 5; top--) {
    let ok = true;
    for (let r = top; r > top - 5; r--) {
      const rr = r === 1 ? 14 : r;
      if (!rankSet.has(rr)) { ok = false; break; }
    }
    if (ok) return top;
  }
  // wheel: A-2-3-4-5
  if ([14, 2, 3, 4, 5].every(r => rankSet.has(r))) return 5;
  return 0;
}

function score(cat, kickers) {
  let s = cat;
  for (let i = 0; i < 5; i++) s = s * 15 + (kickers[i] || 0);
  return s;
}

// Evaluate the best 5-card hand from 5..7 cards.
function evaluate(cards) {
  const ranks = cards.map(rankOf);
  const counts = new Map();
  for (const r of ranks) counts.set(r, (counts.get(r) || 0) + 1);
  const bySuit = {};
  for (const c of cards) (bySuit[suitOf(c)] ||= []).push(rankOf(c));

  // Straight flush / flush
  let flushRanks = null;
  for (const s in bySuit) if (bySuit[s].length >= 5) flushRanks = bySuit[s];
  if (flushRanks) {
    const sf = straightHigh(new Set(flushRanks));
    if (sf) {
      const cat = sf === 14 ? 9 : 8;
      return result(cat, [sf]);
    }
  }

  // groups sorted by count desc then rank desc
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const desc = [...ranks].sort((a, b) => b - a);
  const without = (...ex) => [...new Set(desc)].filter(r => !ex.includes(r));

  if (groups[0][1] === 4) {
    const q = groups[0][0];
    return result(7, [q, without(q)[0]]);
  }
  const trips = groups.filter(g => g[1] === 3).map(g => g[0]);
  const pairs = groups.filter(g => g[1] === 2).map(g => g[0]);
  if (trips.length && (trips.length > 1 || pairs.length)) {
    const t = trips[0];
    const p = Math.max(trips[1] || 0, pairs[0] || 0);
    return result(6, [t, p]);
  }
  if (flushRanks) {
    return result(5, [...flushRanks].sort((a, b) => b - a).slice(0, 5));
  }
  const st = straightHigh(new Set(ranks));
  if (st) return result(4, [st]);
  if (trips.length) {
    const t = trips[0];
    return result(3, [t, ...without(t).slice(0, 2)]);
  }
  if (pairs.length >= 2) {
    const [a, b] = pairs;
    return result(2, [a, b, without(a, b)[0]]);
  }
  if (pairs.length === 1) {
    const p = pairs[0];
    return result(1, [p, ...without(p).slice(0, 3)]);
  }
  return result(0, desc.slice(0, 5));
}

function result(cat, kickers) {
  return { cat, kickers, score: score(cat, kickers), name: describe(cat, kickers) };
}

function describe(cat, k) {
  const n = r => RANK_NAMES[r];
  switch (cat) {
    case 9: return 'רויאל פלאש';
    case 8: return `רצף צבע עד ${n(k[0])}`;
    case 7: return `רביעיית ${n(k[0])}`;
    case 6: return `פול האוס, ${n(k[0])} על ${n(k[1])}`;
    case 5: return `צבע, ${n(k[0])} גבוה`;
    case 4: return `רצף עד ${n(k[0])}`;
    case 3: return `שלישיית ${n(k[0])}`;
    case 2: return `שני זוגות, ${n(k[0])} ו-${n(k[1])}`;
    case 1: return `זוג ${n(k[0])}`;
    default: return `קלף גבוה ${n(k[0])}`;
  }
}

module.exports = { evaluate, newDeck, rankOf, suitOf, CATEGORY_NAMES, RANKS, SUITS };
