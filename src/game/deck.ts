// Deck creation, shuffling and drawing. Kept separate from game rules.

import type { Card, RegularCard } from './cards';
import { createQuantumDeck, createRegularDeck } from './cards';

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createGameDeck(): Card[] {
  const cards: Card[] = [...createRegularDeck(), ...createQuantumDeck()];
  return shuffle(cards);
}

/** Draws the next card of any kind. Mutates the deck in place. */
export function drawCard(deck: Card[]): Card | undefined {
  return deck.shift();
}

/**
 * Draws the next regular card, skipping over any quantum cards.
 * The dealer only ever plays regular cards, so quantum cards are left
 * in the deck (in their current order) for the player to draw later.
 */
export function drawRegularCard(deck: Card[]): RegularCard | undefined {
  const index = deck.findIndex((c) => c.kind === 'regular');
  if (index === -1) return undefined;
  const [card] = deck.splice(index, 1);
  return card as RegularCard;
}
