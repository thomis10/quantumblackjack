// Standard blackjack hand-value rules, plus a way to reason about hands that
// still contain unobserved quantum cards (a range instead of a single value).

import type { Card, QuantumCard } from './cards';
import type { Entanglement } from './quantum';
import { findEntanglementForCard, findPartnerId } from './quantum';

interface ValueEntry {
  value: number;
  isAce: boolean;
}

/** Returns the known numeric value of a card, or null if it's an unobserved quantum card. */
function knownValue(card: Card): ValueEntry | null {
  if (card.kind === 'regular') {
    if (card.rank === 'A') return { value: 11, isAce: true };
    if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return { value: 10, isAce: false };
    return { value: Number(card.rank), isAce: false };
  }
  if (card.observed && card.result !== undefined) return { value: card.result, isAce: false };
  return null;
}

/** Sums values, downgrading aces from 11 to 1 as needed to avoid busting. */
function evaluateValues(values: ValueEntry[]): number {
  let sum = values.reduce((s, v) => s + v.value, 0);
  let aces = values.filter((v) => v.isAce).length;
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces--;
  }
  return sum;
}

export function isBust(value: number): boolean {
  return value > 21;
}

/** Computes the final hand value. Every card must already be resolved (no unobserved quantum cards). */
export function computeHandValue(cards: Card[]): number {
  const values = cards.map((c) => {
    const v = knownValue(c);
    if (v === null) throw new Error('Cannot compute a final hand value while quantum cards are unobserved.');
    return v;
  });
  return evaluateValues(values);
}

export interface HandRange {
  min: number;
  max: number;
  /** All distinct totals the hand could resolve to, sorted ascending. */
  values: number[];
  isCertain: boolean;
}

/**
 * Computes the range of possible final values for a hand that may still contain
 * unobserved quantum cards. Entangled pairs are treated as a single choice
 * (their side is linked), independent quantum cards are each a free choice.
 */
export function computeHandRange(cards: Card[], entanglements: Entanglement[]): HandRange {
  const known: ValueEntry[] = [];
  const unresolved: QuantumCard[] = [];
  for (const card of cards) {
    const v = knownValue(card);
    if (v) known.push(v);
    else if (card.kind === 'quantum') unresolved.push(card);
  }

  if (unresolved.length === 0) {
    const value = evaluateValues(known);
    return { min: value, max: value, values: [value], isCertain: true };
  }

  // Group unresolved quantum cards into independent "choices": entangled pairs
  // share one choice (their side), unentangled cards are each their own choice.
  const groups: QuantumCard[][] = [];
  const grouped = new Set<string>();
  for (const card of unresolved) {
    if (grouped.has(card.id)) continue;
    const entanglement = findEntanglementForCard(entanglements, card.id);
    const partner = entanglement && unresolved.find((c) => c.id === findPartnerId(entanglement, card.id));
    if (entanglement && partner) {
      groups.push([card, partner]);
      grouped.add(card.id);
      grouped.add(partner.id);
    } else {
      groups.push([card]);
      grouped.add(card.id);
    }
  }

  const totals: number[] = [];
  const comboCount = 1 << groups.length;
  for (let mask = 0; mask < comboCount; mask++) {
    const values = [...known];
    groups.forEach((group, i) => {
      const side = ((mask >> i) & 1) as 0 | 1;
      if (group.length === 1) {
        values.push({ value: group[0].values[side], isAce: false });
      } else {
        const [a, b] = group;
        const entanglement = findEntanglementForCard(entanglements, a.id)!;
        const sideB = entanglement.mode === 'SAME' ? side : side === 0 ? 1 : 0;
        values.push({ value: a.values[side], isAce: false });
        values.push({ value: b.values[sideB], isAce: false });
      }
    });
    totals.push(evaluateValues(values));
  }

  const distinct = [...new Set(totals)].sort((a, b) => a - b);
  return { min: Math.min(...totals), max: Math.max(...totals), values: distinct, isCertain: false };
}
