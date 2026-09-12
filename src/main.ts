import './style.css';
import type { GameState } from './game/engine';
import {
  createInitialGameState,
  startRound,
  playerHit,
  playerStand,
  observeCard,
  entangleCards,
} from './game/engine';
import type { EntanglementMode } from './game/quantum';
import type { UiState, Handlers } from './ui/render';
import { render, createInitialUiState } from './ui/render';

const root = document.querySelector<HTMLDivElement>('#app')!;

let state: GameState = startRound(createInitialGameState());
let ui: UiState = createInitialUiState();

function resetUi(): void {
  ui = createInitialUiState();
}

function rerender(): void {
  render(root, state, ui, handlers);
}

const handlers: Handlers = {
  onHit() {
    state = playerHit(state);
    rerender();
  },
  onStand() {
    state = playerStand(state);
    rerender();
  },
  onStartObserve() {
    ui = { mode: 'observe', selected: [], pendingMode: null };
    rerender();
  },
  onStartEntangle() {
    ui = { mode: 'entangle', selected: [], pendingMode: null };
    rerender();
  },
  onCardClick(cardId: string) {
    if (ui.mode === 'observe') {
      state = observeCard(state, cardId);
      resetUi();
    } else if (ui.mode === 'entangle') {
      if (ui.selected.includes(cardId)) {
        ui = { ...ui, selected: ui.selected.filter((id) => id !== cardId) };
      } else if (ui.selected.length < 2) {
        ui = { ...ui, selected: [...ui.selected, cardId] };
      }
    }
    rerender();
  },
  onChooseEntangleMode(mode: EntanglementMode) {
    ui = { ...ui, pendingMode: mode };
    rerender();
  },
  onConfirmEntangle() {
    if (ui.selected.length === 2 && ui.pendingMode) {
      state = entangleCards(state, ui.selected[0], ui.selected[1], ui.pendingMode);
    }
    resetUi();
    rerender();
  },
  onCancel() {
    resetUi();
    rerender();
  },
  onNextRound() {
    state = startRound(state);
    resetUi();
    rerender();
  },
  onRestart() {
    state = startRound(createInitialGameState());
    resetUi();
    rerender();
  },
};

rerender();
