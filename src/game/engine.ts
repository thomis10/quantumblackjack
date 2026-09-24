// Orchestrates round flow and holds the explicit game state.
// The dealer can be dealt quantum cards, but only measures them once its own
// turn starts (after the player stands), then continues normal dealer strategy.

import type { Card } from './cards';
import { createGameDeck, drawCard } from './deck';
import { computeHandValue, computeHandRange, isBust } from './blackjack';
import type { Entanglement, EntanglementMode } from './quantum';
import { canEntangle, createEntanglement, observeQuantumCard, resolveAllUnobserved } from './quantum';
import { determineOutcome, WIN_GOAL, ENTANGLEMENT_COST } from './chips';

/** Draws a card for the dealer, immediately measuring it if it's a quantum card. */
function drawAndMeasureDealerCard(deck: Card[]): Card | undefined {
  const card = drawCard(deck);
  if (card && card.kind === 'quantum') {
    observeQuantumCard(card, [], []); // dealer cards are never entangled
  }
  return card;
}

export type GameStatus = 'player-turn' | 'round-over' | 'game-over';

export interface RoundResult {
  playerValue: number;
  playerBust: boolean;
  dealerValue: number;
  dealerBust: boolean;
  outcome: 'win' | 'lose' | 'push';
  chipsAwarded: number;
}

export interface GameState {
  status: GameStatus;
  deck: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  chips: number;
  entanglements: Entanglement[];
  roundResult: RoundResult | null;
  victory: boolean;
  message: string;
}

export const STARTING_CHIPS = 3;

export function createInitialGameState(): GameState {
  return {
    status: 'player-turn',
    deck: [],
    playerHand: [],
    dealerHand: [],
    chips: STARTING_CHIPS,
    entanglements: [],
    roundResult: null,
    victory: false,
    message: '',
  };
}

export function startRound(state: GameState): GameState {
  if (state.victory) return state; // the game does not auto-restart after victory

  const deck = createGameDeck();
  const playerHand: Card[] = [];
  const dealerHand: Card[] = [];
  // Standard deal order: player, dealer, player, dealer.
  // Any quantum cards dealt to the dealer stay unobserved until its turn starts.
  for (let i = 0; i < 2; i++) {
    const playerCard = drawCard(deck);
    if (playerCard) playerHand.push(playerCard);
    const dealerCard = drawCard(deck);
    if (dealerCard) dealerHand.push(dealerCard);
  }

  return {
    ...state,
    deck,
    playerHand,
    dealerHand,
    status: 'player-turn',
    entanglements: [],
    roundResult: null,
    message: '',
  };
}

// Even with unobserved quantum cards, a hand can be a guaranteed bust if its
// lowest possible total already exceeds 21 - end the round immediately in that case.
function autoResolveIfBust(state: GameState): GameState {
  const range = computeHandRange(state.playerHand, state.entanglements);
  return isBust(range.min) ? finishDealerAndResolve(state) : state;
}

export function playerHit(state: GameState): GameState {
  if (state.status !== 'player-turn') return state;

  const deck = [...state.deck];
  const card = drawCard(deck);
  if (!card) return { ...state, deck, message: 'The deck is empty.' };

  const playerHand = [...state.playerHand, card];
  return autoResolveIfBust({ ...state, deck, playerHand });
}

export function playerStand(state: GameState): GameState {
  if (state.status !== 'player-turn') return state;
  return finishDealerAndResolve(state);
}

function finishDealerAndResolve(state: GameState): GameState {
  const deck = [...state.deck];
  let dealerHand = state.dealerHand.map((c) => ({ ...c }));
  // The dealer's turn starts here: measure any quantum cards already in its
  // hand, then keep measuring each new one the instant it's dealt.
  resolveAllUnobserved(dealerHand, []);
  while (computeHandValue(dealerHand) < 17) {
    const card = drawAndMeasureDealerCard(deck);
    if (!card) break;
    dealerHand = [...dealerHand, card];
  }

  const playerHand = state.playerHand.map((c) => ({ ...c }));
  resolveAllUnobserved(playerHand, state.entanglements);

  const playerValue = computeHandValue(playerHand);
  const dealerValue = computeHandValue(dealerHand);
  const playerBust = isBust(playerValue);
  const dealerBust = isBust(dealerValue);
  const { outcome, chipsAwarded } = determineOutcome(playerValue, playerBust, dealerValue, dealerBust);
  const chips = state.chips + chipsAwarded;
  const victory = chips >= WIN_GOAL;

  const roundResult: RoundResult = { playerValue, playerBust, dealerValue, dealerBust, outcome, chipsAwarded };

  return {
    ...state,
    deck,
    dealerHand,
    playerHand,
    chips,
    status: victory ? 'game-over' : 'round-over',
    roundResult,
    victory,
    message: '',
  };
}

export function observeCard(state: GameState, cardId: string): GameState {
  if (state.status !== 'player-turn') return state;
  const playerHand = state.playerHand.map((c) => ({ ...c }));
  const card = playerHand.find((c) => c.id === cardId);
  if (!card || card.kind !== 'quantum' || card.observed) return state;
  observeQuantumCard(card, playerHand, state.entanglements);
  return autoResolveIfBust({ ...state, playerHand });
}

export function entangleCards(state: GameState, cardIdA: string, cardIdB: string, mode: EntanglementMode): GameState {
  if (state.status !== 'player-turn') return state;
  const playerHand = state.playerHand.map((c) => ({ ...c }));
  const cardA = playerHand.find((c) => c.id === cardIdA);
  const cardB = playerHand.find((c) => c.id === cardIdB);
  const validation = canEntangle(cardA, cardB, state.entanglements, state.chips);
  if (!validation.ok || !cardA || !cardB || cardA.kind !== 'quantum' || cardB.kind !== 'quantum') {
    return { ...state, message: validation.reason ?? 'Cannot entangle these cards.' };
  }

  const entanglement = createEntanglement(cardA, cardB, mode);
  return {
    ...state,
    playerHand,
    chips: state.chips - ENTANGLEMENT_COST,
    entanglements: [...state.entanglements, entanglement],
    message: '',
  };
}

export function startNewGame(): GameState {
  return startRound(createInitialGameState());
}
