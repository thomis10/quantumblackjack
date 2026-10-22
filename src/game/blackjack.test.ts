import { describe, it, expect } from 'vitest';
import { computeHandRange, computeHandValue, isBust, resolveHandFavorably } from '../game/blackjack';
import type { QuantumCard, RegularCard } from '../game/cards';
import { createEntanglement } from '../game/quantum';

function reg(rank: RegularCard['rank'], suit: RegularCard['suit'] = 'spades'): RegularCard {
  return { kind: 'regular', id: `${rank}-${suit}-${Math.random()}`, rank, suit };
}

function quantum(values: [number, number], id = `Q-${values.join('-')}-${Math.random()}`): QuantumCard {
  return { kind: 'quantum', id, values, observed: false };
}

describe('regular card values', () => {
  it('gives number cards their face value', () => {
    expect(computeHandValue([reg('7'), reg('2')])).toBe(9);
  });

  it('gives 10-rank cards a value of 10', () => {
    expect(computeHandValue([reg('10'), reg('10')])).toBe(20);
  });

  it('treats an ace as 11 when it does not bust', () => {
    expect(computeHandValue([reg('A'), reg('9')])).toBe(20);
  });

  it('treats an ace as 1 when 11 would bust', () => {
    expect(computeHandValue([reg('A'), reg('9'), reg('5')])).toBe(15);
  });

  it('detects a bust', () => {
    const value = computeHandValue([reg('10'), reg('10'), reg('5')]);
    expect(isBust(value)).toBe(true);
  });

  it('treats 21 as the strongest hand value', () => {
    expect(computeHandValue([reg('A'), reg('10')])).toBe(21);
  });
});

describe('resolveHandFavorably (standing in superposition)', () => {
  it('picks the highest non-busting branch when one is reachable', () => {
    const hand = [reg('10'), quantum([5, 15], 'q1')];
    resolveHandFavorably(hand, []);
    expect(computeHandValue(hand)).toBe(15);
  });

  it('picks the smallest bust when every branch busts', () => {
    const hand = [reg('10'), reg('10'), quantum([5, 15], 'q1')];
    resolveHandFavorably(hand, []);
    expect(computeHandValue(hand)).toBe(25);
  });

  it('does nothing if there is nothing left unobserved', () => {
    const hand = [reg('10'), reg('7')];
    resolveHandFavorably(hand, []);
    expect(computeHandValue(hand)).toBe(17);
  });

  it('matches one of computeHandRange values for a fully-uncertain hand', () => {
    const hand = [quantum([4, 10], 'q1'), quantum([6, 8], 'q2')];
    const range = computeHandRange(hand, []);
    resolveHandFavorably(hand, []);
    expect(range.values).toContain(computeHandValue(hand));
  });

  it('computes a two-branch range for a three-card entanglement chain', () => {
    const q1 = quantum([3, 7], 'q1');
    const q2 = quantum([2, 9], 'q2');
    const q3 = quantum([1, 8], 'q3');
    const entanglements = [createEntanglement(q1, q2, 'SAME'), createEntanglement(q2, q3, 'OPPOSITE')];

    const range = computeHandRange([q1, q2, q3], entanglements);
    expect(range.values).toEqual([13, 17]);
    expect(range.isCertain).toBe(false);
  });

  it('resolves chained entanglement to the smallest bust when no safe branch exists', () => {
    const base = reg('10');
    const q1 = quantum([3, 7], 'q1');
    const q2 = quantum([2, 9], 'q2');
    const q3 = quantum([1, 8], 'q3');
    const entanglements = [createEntanglement(q1, q2, 'SAME'), createEntanglement(q2, q3, 'OPPOSITE')];

    resolveHandFavorably([base, q1, q2, q3], entanglements);
    expect(computeHandValue([base, q1, q2, q3])).toBe(23);
  });
});
