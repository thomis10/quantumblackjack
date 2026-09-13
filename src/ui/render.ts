// Pure-ish DOM rendering. All game rules live in src/game; this file only
// turns a GameState + UiState into DOM elements and wires up click handlers.

import type { Card } from '../game/cards';
import type { GameState } from '../game/engine';
import { computeHandRange } from '../game/blackjack';
import { WIN_GOAL, ENTANGLEMENT_COST } from '../game/chips';
import type { EntanglementMode } from '../game/quantum';
import { findEntanglementForCard } from '../game/quantum';

export type UiMode = 'idle' | 'observe' | 'entangle';

export interface UiState {
  mode: UiMode;
  selected: string[];
  pendingMode: EntanglementMode | null;
}

export function createInitialUiState(): UiState {
  return { mode: 'idle', selected: [], pendingMode: null };
}

export interface Handlers {
  onHit(): void;
  onStand(): void;
  onStartObserve(): void;
  onStartEntangle(): void;
  onCardClick(cardId: string): void;
  onChooseEntangleMode(mode: EntanglementMode): void;
  onConfirmEntangle(): void;
  onCancel(): void;
  onRestart(): void;
  onNextRound(): void;
}

const SUIT_SYMBOLS: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderCard(card: Card, opts: { faceDown?: boolean; entangled?: boolean; selected?: boolean }): HTMLElement {
  const node = el('div', 'card');
  if (opts.faceDown) {
    node.classList.add('card--face-down');
    node.appendChild(el('span', 'card__back', '🂠'));
    return node;
  }

  if (card.kind === 'regular') {
    node.classList.add('card--regular');
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    if (isRed) node.classList.add('card--red');
    node.appendChild(el('span', 'card__rank', card.rank));
    node.appendChild(el('span', 'card__suit', SUIT_SYMBOLS[card.suit]));
    return node;
  }

  // quantum card
  node.classList.add('card--quantum');
  if (opts.entangled) node.classList.add('card--entangled');
  if (opts.selected) node.classList.add('card--selected');
  node.appendChild(el('span', 'card__tag', 'Q'));
  if (card.observed) {
    node.classList.add('card--observed');
    node.appendChild(renderResolvedQuantumValues(card.values, card.chosenSide ?? 0));
  } else {
    node.classList.add('card--unobserved');
    node.appendChild(el('span', 'card__superposition', `[${card.values[0]}|${card.values[1]}]`));
  }
  return node;
}

/** Shows both original superposed values with a marker over the one it collapsed to. */
function renderResolvedQuantumValues(values: [number, number], chosenSide: 0 | 1): HTMLElement {
  const wrap = el('div', 'card__resolved');

  const markerRow = el('div', 'card__marker-row');
  const marker0 = el('span', 'card__marker');
  const markerGap = el('span', 'card__marker-gap');
  const marker1 = el('span', 'card__marker');
  if (chosenSide === 0) marker0.classList.add('card__marker--active');
  else marker1.classList.add('card__marker--active');
  markerRow.append(marker0, markerGap, marker1);

  const valuesRow = el('div', 'card__values-row');
  const value0 = el('span', 'card__value-option', String(values[0]));
  const divider = el('span', 'card__values-divider', '|');
  const value1 = el('span', 'card__value-option', String(values[1]));
  if (chosenSide === 0) value0.classList.add('card__value-option--chosen');
  else value1.classList.add('card__value-option--chosen');
  valuesRow.append(value0, divider, value1);

  wrap.append(markerRow, valuesRow);
  return wrap;
}

function renderHeader(state: GameState): HTMLElement {
  const header = el('header', 'header');
  header.appendChild(el('h1', 'title', 'Quantum Blackjack'));
  const chips = el('div', 'chips');
  chips.appendChild(el('span', 'chips__count', `Chips: ${state.chips} / ${WIN_GOAL}`));
  const bar = el('div', 'chips__bar');
  const fill = el('div', 'chips__bar-fill');
  fill.style.width = `${Math.min(100, (state.chips / WIN_GOAL) * 100)}%`;
  bar.appendChild(fill);
  chips.appendChild(bar);
  header.appendChild(chips);
  return header;
}

function renderDealerArea(state: GameState): HTMLElement {
  const section = el('section', 'area');
  section.appendChild(el('h2', 'area__title', 'Dealer'));
  const cardsRow = el('div', 'cards-row');
  const hideHoleCard = state.status === 'player-turn';
  state.dealerHand.forEach((card, index) => {
    const faceDown = hideHoleCard && index === 1;
    cardsRow.appendChild(renderCard(card, { faceDown }));
  });
  section.appendChild(cardsRow);

  const status = el('div', 'area__status');
  if (hideHoleCard) {
    status.textContent = 'Dealer hand: hidden until you stand';
  } else if (state.roundResult) {
    status.textContent = `Dealer hand: ${state.roundResult.dealerValue}${state.roundResult.dealerBust ? ' (bust)' : ''}`;
  } else {
    status.textContent = 'Dealer hand: revealing…';
  }
  section.appendChild(status);
  return section;
}

function renderPlayerArea(state: GameState, ui: UiState, handlers: Handlers): HTMLElement {
  const section = el('section', 'area');
  section.appendChild(el('h2', 'area__title', 'Player'));
  const cardsRow = el('div', 'cards-row');

  state.playerHand.forEach((card) => {
    const entangled = !!findEntanglementForCard(state.entanglements, card.id);
    const selected = ui.selected.includes(card.id);
    const cardNode = renderCard(card, { entangled, selected });

    const isSelectableForObserve = ui.mode === 'observe' && card.kind === 'quantum' && !card.observed;
    const isSelectableForEntangle = ui.mode === 'entangle' && card.kind === 'quantum' && !card.observed;
    if (isSelectableForObserve || isSelectableForEntangle) {
      cardNode.classList.add('card--clickable');
      cardNode.addEventListener('click', () => handlers.onCardClick(card.id));
    }
    cardsRow.appendChild(cardNode);
  });
  section.appendChild(cardsRow);

  const range = computeHandRange(state.playerHand, state.entanglements);
  const status = el('div', 'area__status');
  status.textContent = range.isCertain
    ? `Hand value: ${range.min}`
    : `Hand value: ${range.values.join(', ')}`;
  section.appendChild(status);
  return section;
}

function renderControls(state: GameState, ui: UiState, handlers: Handlers): HTMLElement {
  const controls = el('div', 'controls');
  const canAct = state.status === 'player-turn' && ui.mode === 'idle';

  const hitBtn = el('button', 'btn', 'Hit');
  hitBtn.disabled = !canAct;
  hitBtn.addEventListener('click', handlers.onHit);

  const standBtn = el('button', 'btn', 'Stand');
  standBtn.disabled = !canAct;
  standBtn.addEventListener('click', handlers.onStand);

  const hasUnobservedQuantum = state.playerHand.some((c) => c.kind === 'quantum' && !c.observed);
  const observeBtn = el('button', 'btn', 'Observe Quantum Card');
  observeBtn.disabled = !canAct || !hasUnobservedQuantum;
  observeBtn.addEventListener('click', handlers.onStartObserve);

  const entangleBtn = el('button', 'btn', 'Entangle Quantum Cards');
  entangleBtn.disabled = !canAct || !hasUnobservedQuantum || state.chips < ENTANGLEMENT_COST;
  entangleBtn.addEventListener('click', handlers.onStartEntangle);

  controls.append(hitBtn, standBtn, observeBtn, entangleBtn);

  if (ui.mode === 'observe') {
    const hint = el('div', 'hint', 'Select an unobserved quantum card to collapse it.');
    const cancelBtn = el('button', 'btn btn--ghost', 'Cancel');
    cancelBtn.addEventListener('click', handlers.onCancel);
    controls.append(hint, cancelBtn);
  }

  return controls;
}

function renderEntanglePanel(state: GameState, ui: UiState, handlers: Handlers): HTMLElement {
  const panel = el('div', 'panel');
  panel.appendChild(el('h3', 'panel__title', 'Entangle Quantum Cards'));
  panel.appendChild(el('p', 'panel__hint', `Select two unobserved quantum cards. Cost: ${ENTANGLEMENT_COST} chip`));
  panel.appendChild(el('p', 'panel__selection', `Selected: ${ui.selected.length} / 2`));

  if (ui.selected.length === 2) {
    const modeRow = el('div', 'panel__modes');
    (['SAME', 'OPPOSITE'] as EntanglementMode[]).forEach((mode) => {
      const btn = el('button', 'btn', mode);
      if (ui.pendingMode === mode) btn.classList.add('btn--active');
      btn.addEventListener('click', () => handlers.onChooseEntangleMode(mode));
      modeRow.appendChild(btn);
    });
    panel.appendChild(modeRow);

    const confirmBtn = el('button', 'btn btn--primary', 'Confirm Entanglement');
    confirmBtn.disabled = !ui.pendingMode || state.chips < ENTANGLEMENT_COST;
    confirmBtn.addEventListener('click', handlers.onConfirmEntangle);
    panel.appendChild(confirmBtn);
  }

  const cancelBtn = el('button', 'btn btn--ghost', 'Cancel');
  cancelBtn.addEventListener('click', handlers.onCancel);
  panel.appendChild(cancelBtn);

  if (state.message) panel.appendChild(el('p', 'panel__error', state.message));

  return panel;
}

function renderRoundResult(state: GameState, handlers: Handlers): HTMLElement {
  const result = state.roundResult!;
  const panel = el('div', 'panel panel--result');
  panel.appendChild(el('h3', 'panel__title', 'Round Result'));
  panel.appendChild(el('p', undefined, `Player: ${result.playerValue}${result.playerBust ? ' (bust)' : ''}`));
  panel.appendChild(el('p', undefined, `Dealer: ${result.dealerValue}${result.dealerBust ? ' (bust)' : ''}`));
  const outcomeText = result.outcome === 'win' ? 'You win!' : result.outcome === 'lose' ? 'You lose.' : 'Push (tie).';
  panel.appendChild(el('p', 'panel__outcome', outcomeText));
  panel.appendChild(el('p', undefined, `Chips awarded: +${result.chipsAwarded}`));
  panel.appendChild(el('p', undefined, `Total chips: ${state.chips} / ${WIN_GOAL}`));

  if (!state.victory) {
    const nextBtn = el('button', 'btn btn--primary', 'Next Round');
    nextBtn.addEventListener('click', handlers.onNextRound);
    panel.appendChild(nextBtn);
  }
  return panel;
}

function renderVictory(handlers: Handlers): HTMLElement {
  const panel = el('div', 'panel panel--victory');
  panel.appendChild(el('h2', undefined, 'You Win!'));
  panel.appendChild(el('p', undefined, `You reached the ${WIN_GOAL}-chip goal.`));
  const restartBtn = el('button', 'btn btn--primary', 'Restart Game');
  restartBtn.addEventListener('click', handlers.onRestart);
  panel.appendChild(restartBtn);
  return panel;
}

export function render(root: HTMLElement, state: GameState, ui: UiState, handlers: Handlers): void {
  root.innerHTML = '';
  const wrapper = el('div', 'game');
  wrapper.appendChild(renderHeader(state));
  wrapper.appendChild(renderDealerArea(state));
  wrapper.appendChild(renderPlayerArea(state, ui, handlers));
  wrapper.appendChild(renderControls(state, ui, handlers));
  if (ui.mode === 'entangle') wrapper.appendChild(renderEntanglePanel(state, ui, handlers));
  if (state.roundResult && !state.victory) wrapper.appendChild(renderRoundResult(state, handlers));
  if (state.victory) {
    if (state.roundResult) wrapper.appendChild(renderRoundResult(state, handlers));
    wrapper.appendChild(renderVictory(handlers));
  }
  root.appendChild(wrapper);
}
