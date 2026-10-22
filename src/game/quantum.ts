// Observation and entanglement mechanics. This is intentionally simple:
// a quantum card is a coin flip between two fixed values, and entanglement
// just links two coin flips together. No deeper "physics" than that.

import type { Card, QuantumCard } from './cards';
import { countRedCards, hasRedCard } from './cards';

export type EntanglementMode = 'SAME' | 'OPPOSITE';

export interface Entanglement {
  id: string;
  cardAId: string;
  cardBId: string;
  mode: EntanglementMode;
}

interface Neighbor {
  id: string;
  parity: 0 | 1;
}

export function isQuantumCard(card: Card | undefined): card is QuantumCard {
  return !!card && card.kind === 'quantum';
}

export interface EntangleValidationResult {
  ok: boolean;
  reason?: string;
}

export interface ObserveValidationResult {
  ok: boolean;
  reason?: string;
}

function modeParity(mode: EntanglementMode): 0 | 1 {
  return mode === 'SAME' ? 0 : 1;
}

function buildEntanglementGraph(entanglements: Entanglement[]): Map<string, Neighbor[]> {
  const graph = new Map<string, Neighbor[]>();
  const addEdge = (from: string, to: string, parity: 0 | 1): void => {
    const list = graph.get(from);
    if (list) list.push({ id: to, parity });
    else graph.set(from, [{ id: to, parity }]);
  };

  for (const entanglement of entanglements) {
    const parity = modeParity(entanglement.mode);
    addEdge(entanglement.cardAId, entanglement.cardBId, parity);
    addEdge(entanglement.cardBId, entanglement.cardAId, parity);
  }
  return graph;
}

function findRelativeParity(entanglements: Entanglement[], startId: string, targetId: string): 0 | 1 | undefined {
  if (startId === targetId) return 0;
  const graph = buildEntanglementGraph(entanglements);
  const queue: Array<{ id: string; parity: 0 | 1 }> = [{ id: startId, parity: 0 }];
  const seen = new Set<string>([startId]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = graph.get(current.id) ?? [];
    for (const neighbor of neighbors) {
      const nextParity = (current.parity ^ neighbor.parity) as 0 | 1;
      if (neighbor.id === targetId) return nextParity;
      if (seen.has(neighbor.id)) continue;
      seen.add(neighbor.id);
      queue.push({ id: neighbor.id, parity: nextParity });
    }
  }

  return undefined;
}

/**
 * A quantum card can only be observed while the hand also holds a red (hearts/diamonds)
 * card, and each red card only grants one observation (observationsUsed tracks how many
 * have already been spent this round).
 */
export function canObserve(hand: Card[], observationsUsed: number): ObserveValidationResult {
  if (!hasRedCard(hand)) {
    return { ok: false, reason: 'You need a red card (hearts or diamonds) in hand to observe a quantum card.' };
  }
  if (observationsUsed >= countRedCards(hand)) {
    return { ok: false, reason: 'You need another red card to observe again — only one observation per red card.' };
  }
  return { ok: true };
}

export function canEntangle(
  cardA: Card | undefined,
  cardB: Card | undefined,
  mode: EntanglementMode,
  existing: Entanglement[],
  chips: number,
): EntangleValidationResult {
  if (!cardA || !cardB) return { ok: false, reason: 'Select two quantum cards first.' };
  if (cardA.id === cardB.id) return { ok: false, reason: 'A card cannot be entangled with itself.' };
  if (!isQuantumCard(cardA) || !isQuantumCard(cardB)) {
    return { ok: false, reason: 'Only quantum cards can be entangled.' };
  }
  if (cardA.observed || cardB.observed) {
    return { ok: false, reason: 'Observed cards cannot be entangled.' };
  }

  const pairAlreadyLinked = existing.some(
    (e) =>
      (e.cardAId === cardA.id && e.cardBId === cardB.id) ||
      (e.cardAId === cardB.id && e.cardBId === cardA.id),
  );
  if (pairAlreadyLinked) {
    return { ok: false, reason: 'Those two cards are already directly entangled.' };
  }

  const impliedParity = findRelativeParity(existing, cardA.id, cardB.id);
  if (impliedParity !== undefined) {
    if (impliedParity === modeParity('SAME') && mode === 'SAME') {
      return { ok: false, reason: 'Those cards are already indirectly linked as SAME.' };
    }
    if (impliedParity === modeParity('OPPOSITE') && mode === 'OPPOSITE') {
      return { ok: false, reason: 'Those cards are already indirectly linked as OPPOSITE.' };
    }
    return {
      ok: false,
      reason: 'This entanglement would contradict existing links in the chain.',
    };
  }

  if (chips < 1) {
    return { ok: false, reason: 'Entanglement costs 1 chip.' };
  }
  return { ok: true };
}

export function createEntanglement(cardA: QuantumCard, cardB: QuantumCard, mode: EntanglementMode): Entanglement {
  return { id: `E-${cardA.id}-${cardB.id}`, cardAId: cardA.id, cardBId: cardB.id, mode };
}

export function findEntanglementForCard(entanglements: Entanglement[], cardId: string): Entanglement | undefined {
  return entanglements.find((e) => e.cardAId === cardId || e.cardBId === cardId);
}

export function findPartnerId(entanglement: Entanglement, cardId: string): string {
  return entanglement.cardAId === cardId ? entanglement.cardBId : entanglement.cardAId;
}

/**
 * Collapses a quantum card to one concrete value. If the card is entangled and
 * its partner is still unobserved, the partner is resolved too, using the
 * SAME/OPPOSITE relationship to pick its side.
 */
export function observeQuantumCard(
  card: QuantumCard,
  allCards: Card[],
  entanglements: Entanglement[],
  forcedSide?: 0 | 1,
): void {
  if (card.observed) return; // a card can never be observed twice
  const side: 0 | 1 = forcedSide !== undefined ? forcedSide : Math.random() < 0.5 ? 0 : 1;
  const graph = buildEntanglementGraph(entanglements);
  const quantumById = new Map<string, QuantumCard>();
  quantumById.set(card.id, card);
  for (const c of allCards) {
    if (isQuantumCard(c)) quantumById.set(c.id, c);
  }

  const queue: Array<{ id: string; side: 0 | 1 }> = [{ id: card.id, side }];
  const assigned = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (assigned.has(current.id)) continue;
    assigned.add(current.id);

    const currentCard = quantumById.get(current.id);
    if (!currentCard) continue;

    if (!currentCard.observed) {
      currentCard.observed = true;
      currentCard.chosenSide = current.side;
      currentCard.result = currentCard.values[current.side];
    }

    const neighbors = graph.get(current.id) ?? [];
    for (const neighbor of neighbors) {
      const nextSide = (current.side ^ neighbor.parity) as 0 | 1;
      const nextCard = quantumById.get(neighbor.id);
      if (!nextCard) continue;
      if (nextCard.observed) continue;
      queue.push({ id: neighbor.id, side: nextSide });
    }
  }
}

/** Collapses every remaining unobserved quantum card, used at final round resolution. */
export function resolveAllUnobserved(cards: Card[], entanglements: Entanglement[]): void {
  for (const card of cards) {
    if (card.kind === 'quantum' && !card.observed) {
      observeQuantumCard(card, cards, entanglements);
    }
  }
}
