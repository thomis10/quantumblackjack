import { describe, it, expect } from 'vitest';
import { computeHandValue, isBust } from '../game/blackjack';
import type { RegularCard } from '../game/cards';

function reg(rank: RegularCard['rank'], suit: RegularCard['suit'] = 'spades'): RegularCard {
  return { kind: 'regular', id: `${rank}-${suit}-${Math.random()}`, rank, suit };
}

describe('regular card values', () => {
  it('gives number cards their face value', () => {
    expect(computeHandValue([reg('7'), reg('2')])).toBe(9);
  });

  it('gives face cards a value of 10', () => {
    expect(computeHandValue([reg('K'), reg('Q')])).toBe(20);
  });

  it('treats an ace as 11 when it does not bust', () => {
    expect(computeHandValue([reg('A'), reg('9')])).toBe(20);
  });

  it('treats an ace as 1 when 11 would bust', () => {
    expect(computeHandValue([reg('A'), reg('9'), reg('5')])).toBe(15);
  });

  it('detects a bust', () => {
    const value = computeHandValue([reg('K'), reg('Q'), reg('5')]);
    expect(isBust(value)).toBe(true);
  });

  it('treats 21 as the strongest hand value', () => {
    expect(computeHandValue([reg('A'), reg('K')])).toBe(21);
  });
});
