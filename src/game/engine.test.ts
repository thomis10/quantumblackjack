import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  startRound,
  entangleCards,
  observeCard,
  playerStand,
} from '../game/engine';
import { ENTANGLEMENT_COST } from '../game/chips';

describe('engine: dealer cards', () => {
  it('always deals the dealer already-measured cards, across many rounds', () => {
    for (let i = 0; i < 50; i++) {
      let state = startRound(createInitialGameState());
      state = playerStand(state); // forces the dealer to draw out its full hand
      const hasUnmeasuredCard = state.dealerHand.some((c) => c.kind === 'quantum' && !c.observed);
      expect(hasUnmeasuredCard).toBe(false);
    }
  });
});

describe('engine: entanglement spending', () => {
  it('deducts exactly 1 chip immediately when entangling', () => {
    let state = startRound(createInitialGameState());
    state = { ...state, chips: 5 };
    const quantumCards = state.playerHand.filter((c) => c.kind === 'quantum');
    if (quantumCards.length < 2) return; // not dealt two quantum cards this round, skip
    const before = state.chips;
    state = entangleCards(state, quantumCards[0].id, quantumCards[1].id, 'SAME');
    expect(state.chips).toBe(before - ENTANGLEMENT_COST);
  });

  it('refuses to entangle with 0 chips', () => {
    let state = startRound(createInitialGameState());
    state = { ...state, chips: 0 };
    const quantumCards = state.playerHand.filter((c) => c.kind === 'quantum');
    if (quantumCards.length < 2) return;
    const before = state.chips;
    state = entangleCards(state, quantumCards[0].id, quantumCards[1].id, 'SAME');
    expect(state.chips).toBe(before);
    expect(state.entanglements).toHaveLength(0);
  });
});

describe('engine: observation', () => {
  it('a quantum card cannot be observed twice through the engine', () => {
    let state = startRound(createInitialGameState());
    const quantumCard = state.playerHand.find((c) => c.kind === 'quantum');
    if (!quantumCard) return;
    state = observeCard(state, quantumCard.id);
    const firstResult = (state.playerHand.find((c) => c.id === quantumCard.id) as any).result;
    state = observeCard(state, quantumCard.id);
    const secondResult = (state.playerHand.find((c) => c.id === quantumCard.id) as any).result;
    expect(secondResult).toBe(firstResult);
  });
});

describe('engine: round resolution', () => {
  it('collapses every remaining unobserved quantum card at resolution', () => {
    let state = startRound(createInitialGameState());
    state = playerStand(state);
    const stillUnobserved = state.playerHand.some((c) => c.kind === 'quantum' && !c.observed);
    expect(stillUnobserved).toBe(false);
  });

  it('auto-busts the round as soon as the hand becomes a definite bust from observing a card', () => {
    let state = startRound(createInitialGameState());
    // Force a hand that is guaranteed to bust once its one quantum card is observed.
    state = {
      ...state,
      playerHand: [
        { kind: 'regular', id: 'r1', rank: 'K', suit: 'spades' },
        { kind: 'regular', id: 'r2', rank: 'K', suit: 'hearts' },
        { kind: 'quantum', id: 'q1', values: [5, 9], observed: false },
      ],
    };
    state = observeCard(state, 'q1');
    expect(state.status).toBe('round-over');
    expect(state.roundResult?.playerBust).toBe(true);
  });

  it('ends the game once chips reach the 15 goal', () => {
    let state = startRound(createInitialGameState());
    state = { ...state, chips: 14 };
    state = playerStand(state);
    if (state.roundResult && state.roundResult.chipsAwarded > 0) {
      expect(state.chips).toBeGreaterThanOrEqual(15);
      expect(state.victory).toBe(true);
      expect(state.status).toBe('game-over');
    }
  });
});
