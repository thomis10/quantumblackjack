import { describe, it, expect } from 'vitest';
import type { QuantumCard } from '../game/cards';
import type { Entanglement } from '../game/quantum';
import { canEntangle, createEntanglement, observeQuantumCard, resolveAllUnobserved } from '../game/quantum';

function quantum(values: [number, number], id = `Q-${values.join('-')}-${Math.random()}`): QuantumCard {
  return { kind: 'quantum', id, values, observed: false };
}

describe('quantum card observation', () => {
  it('retains both possible values until observed', () => {
    const card = quantum([3, 7]);
    expect(card.observed).toBe(false);
    expect(card.values).toEqual([3, 7]);
    expect(card.result).toBeUndefined();
  });

  it('collapses to exactly one of the two values', () => {
    const card = quantum([3, 7]);
    observeQuantumCard(card, [card], []);
    expect(card.observed).toBe(true);
    expect([3, 7]).toContain(card.result);
  });

  it('cannot be observed twice', () => {
    const card = quantum([3, 7]);
    observeQuantumCard(card, [card], []);
    const firstResult = card.result;
    observeQuantumCard(card, [card], []);
    expect(card.result).toBe(firstResult);
  });

  it('resolves all remaining unobserved cards at final resolution', () => {
    const a = quantum([1, 2]);
    const b = quantum([5, 8]);
    resolveAllUnobserved([a, b], []);
    expect(a.observed).toBe(true);
    expect(b.observed).toBe(true);
  });
});

describe('entanglement', () => {
  it('resolves SAME as matching sides', () => {
    for (let i = 0; i < 20; i++) {
      const a = quantum([3, 7], 'a');
      const b = quantum([2, 9], 'b');
      const entanglement: Entanglement = createEntanglement(a, b, 'SAME');
      observeQuantumCard(a, [a, b], [entanglement]);
      const validPairs = [
        [3, 2],
        [7, 9],
      ];
      expect(validPairs).toContainEqual([a.result, b.result]);
    }
  });

  it('resolves OPPOSITE as opposite sides', () => {
    for (let i = 0; i < 20; i++) {
      const a = quantum([3, 7], 'a');
      const b = quantum([2, 9], 'b');
      const entanglement: Entanglement = createEntanglement(a, b, 'OPPOSITE');
      observeQuantumCard(a, [a, b], [entanglement]);
      const validPairs = [
        [3, 9],
        [7, 2],
      ];
      expect(validPairs).toContainEqual([a.result, b.result]);
    }
  });

  it('resolves the partner when observing either side first', () => {
    const a = quantum([4, 10], 'a');
    const b = quantum([6, 8], 'b');
    const entanglement: Entanglement = createEntanglement(a, b, 'SAME');
    observeQuantumCard(b, [a, b], [entanglement]);
    expect(a.observed).toBe(true);
    if (b.result === 6) expect(a.result).toBe(4);
    else expect(a.result).toBe(10);
  });

  it('costs exactly 1 chip and requires at least 1 chip', () => {
    const a = quantum([3, 7], 'a');
    const b = quantum([2, 9], 'b');
    expect(canEntangle(a, b, [], 0).ok).toBe(false);
    expect(canEntangle(a, b, [], 1).ok).toBe(true);
  });

  it('rejects entangling a card with itself', () => {
    const a = quantum([3, 7], 'a');
    expect(canEntangle(a, a, [], 5).ok).toBe(false);
  });

  it('rejects entangling an already-observed card', () => {
    const a = quantum([3, 7], 'a');
    const b = quantum([2, 9], 'b');
    observeQuantumCard(a, [a, b], []);
    expect(canEntangle(a, b, [], 5).ok).toBe(false);
  });

  it('rejects reusing a card already in an entanglement', () => {
    const a = quantum([3, 7], 'a');
    const b = quantum([2, 9], 'b');
    const c = quantum([1, 2], 'c');
    const entanglement = createEntanglement(a, b, 'SAME');
    expect(canEntangle(a, c, [entanglement], 5).ok).toBe(false);
  });
});
