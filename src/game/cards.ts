// Data-driven card definitions. Adding new cards should never require touching game logic.

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export interface RegularCard {
  kind: 'regular';
  id: string;
  rank: Rank;
  suit: Suit;
}

export interface QuantumCard {
  kind: 'quantum';
  id: string;
  /** The two superposed values. Index 0/1 is the "side" referenced by entanglement. */
  values: [number, number];
  suit?: QuantumSuit;
  observed: boolean;
  /** Which side (0 or 1) was chosen once observed. */
  chosenSide?: 0 | 1;
  /** The collapsed numeric value once observed. */
  result?: number;
  /** Id of the entanglement relationship this card belongs to, if any. */
  entanglementId?: string;
}

export type Card = RegularCard | QuantumCard;

export function isRedCard(card: Card): boolean {
  return card.kind === 'regular' && (card.suit === 'hearts' || card.suit === 'diamonds');
}

/** Observing a quantum card requires some red (hearts/diamonds) card already in hand. */
export function hasRedCard(hand: Card[]): boolean {
  return hand.some(isRedCard);
}

/** Each red card in hand grants one quantum observation. */
export function countRedCards(hand: Card[]): number {
  return hand.filter(isRedCard).length;
}

export function createRegularDeck(): RegularCard[] {
  const cards: RegularCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ kind: 'regular', id: `R-${rank}-${suit}`, rank, suit });
    }
  }
  return cards;
}

export type QuantumSuit = Suit | 'joker';

/** The starting set of quantum cards. Add more entries here to expand the game later. */
export interface QuantumCardDef {
  values: [number, number];
  suit?: QuantumSuit;
}

export const QUANTUM_CARD_DEFS: QuantumCardDef[] = [
  // { values: [1, 2] },
  // { values: [1, 3] },
  // { values: [2, 3] },
  // { values: [2, 4] },
  // { values: [3, 5] },
  // { values: [3, 6] },
  // { values: [4, 6] },
  // { values: [4, 7] },
  // { values: [5, 7] },
  // { values: [5, 8] },
  // { values: [6, 8] },
  // { values: [6, 9] },
  // { values: [7, 9] },
  // { values: [7, 10] },
  // { values: [8, 10] },
  // { values: [9, 10] },
  // out to middle
  // { values: [1, 10] },
  // { values: [1, 10] },
  // { values: [1, 10] },
  // { values: [2, 8] },
  // { values: [5, 6] },
  // //shifted out to middle
  // { values: [5, 9] },
  // { values: [1, -10] },
  // { values: [-3, 3] }
  { values: [1, 10], suit: 'hearts' },
  { values: [1, 10], suit: 'diamonds' },
  { values: [10, 1], suit: 'clubs' },
  { values: [10, 1], suit: 'spades' },
  { values: [2, 10], suit: 'hearts' },
  { values: [10, 3], suit: 'diamonds' },
  { values: [4, 10], suit: 'clubs' },
  { values: [10, 5], suit: 'spades' },
  { values: [2, 8], suit: 'hearts' },
  { values: [2, 6], suit: 'diamonds' },
  { values: [-3, 3], suit: 'clubs' },
  { values: [-8, 5], suit: 'spades' },
  { values: [1, -10], suit: 'joker' },
  { values: [1, -10], suit: 'joker' },
  
];

/** How many copies of each quantum card def go into the deck. Tweak to change rarity. */
export const QUANTUM_COPIES_PER_DEF = 2;

export function createQuantumDeck(copiesPerDef = QUANTUM_COPIES_PER_DEF): QuantumCard[] {
  const cards: QuantumCard[] = [];
  QUANTUM_CARD_DEFS.forEach((def, defIndex) => {
    for (let copy = 0; copy < copiesPerDef; copy++) {
      cards.push({
        kind: 'quantum',
        id: `Q-${def.values[0]}-${def.values[1]}-${defIndex}-${copy}`,
        values: [...def.values],
        suit: def.suit,
        observed: false,
      });
    }
  });
  return cards;
}
