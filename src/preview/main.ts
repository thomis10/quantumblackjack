// Dev-only live color/card preview tool. Edits here auto-save straight into
// cardArt.ts via the dev server's /api/card-colors endpoint (see vite.config.ts),
// so changes take effect in the real game through Vite's own hot-reload.

import '../style.css';
import { QUANTUM_CARD_DEFS } from '../game/cards';
import { shuffle } from '../game/deck';
import {
  buildQuantumCardSvg,
  VALUE_COLORS,
  WAVE_NEGATIVE_COLOR,
  WAVE_POSITIVE_COLOR,
  type QuantumColorOverrides,
} from '../ui/cardArt';

const POSITIVE_VALUES = Array.from({ length: 10 }, (_, i) => i + 1);
const NEGATIVE_VALUES = POSITIVE_VALUES.map((v) => -v);
const ALL_VALUES = [...POSITIVE_VALUES, ...NEGATIVE_VALUES];

const state: { valueColors: Record<number, string>; wavePositive: string; waveNegative: string } = {
  valueColors: { ...VALUE_COLORS },
  wavePositive: WAVE_POSITIVE_COLOR,
  waveNegative: WAVE_NEGATIVE_COLOR,
};

function currentOverrides(): QuantumColorOverrides {
  return { valueColors: state.valueColors, wavePositive: state.wavePositive, waveNegative: state.waveNegative };
}

function pickRandomDefs(count: number): [number, number][] {
  return shuffle(QUANTUM_CARD_DEFS)
    .slice(0, count)
    .map((def) => def.values);
}

let currentDefs = pickRandomDefs(3);

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleSave(statusEl: HTMLElement): void {
  if (saveTimer) clearTimeout(saveTimer);
  statusEl.textContent = 'Saving…';
  saveTimer = setTimeout(() => {
    void fetch('/api/card-colors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueColors: Object.fromEntries(ALL_VALUES.map((v) => [v, state.valueColors[v]])),
        wavePositive: state.wavePositive,
        waveNegative: state.waveNegative,
      }),
    })
      .then((res) => {
        statusEl.textContent = res.ok
          ? 'Saved to src/ui/cardArt.ts'
          : 'Auto-save failed (is `npm run dev` running?)';
      })
      .catch(() => {
        statusEl.textContent = 'Auto-save unavailable (requires `npm run dev`)';
      });
  }, 400);
}

function renderCardPreviews(container: HTMLElement): void {
  container.innerHTML = '';
  for (const values of currentDefs) {
    const slot = document.createElement('div');
    slot.className = 'card card--quantum';
    slot.style.cssText = 'width:120px;height:168px;border:2px solid #fff;';
    slot.appendChild(buildQuantumCardSvg(values, false, 0, currentOverrides()));
    container.appendChild(slot);
  }
}

function renderPage(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'max-width:720px;margin:40px auto;padding:24px;';

  const title = document.createElement('h1');
  title.textContent = 'Quantum Blackjack — Card/Color Preview';
  wrap.appendChild(title);

  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Live-edit quantum card colors below. Changes apply instantly here and auto-save into the game.';
  wrap.appendChild(hint);

  const status = document.createElement('p');
  status.className = 'hint';
  status.textContent = 'No changes yet.';
  wrap.appendChild(status);

  // Card previews
  const cardsRow = document.createElement('div');
  cardsRow.className = 'cards-row';
  cardsRow.style.cssText = 'gap:16px;margin:16px 0;';
  wrap.appendChild(cardsRow);

  const rerollBtn = document.createElement('button');
  rerollBtn.className = 'btn';
  rerollBtn.textContent = 'Show 3 Different Random Quantum Cards';
  rerollBtn.addEventListener('click', () => {
    currentDefs = pickRandomDefs(3);
    renderCardPreviews(cardsRow);
  });
  wrap.appendChild(rerollBtn);

  // Color editor
  const buildValueGrid = (title: string, values: number[]) => {
    const groupTitle = document.createElement('h2');
    groupTitle.textContent = title;
    wrap.appendChild(groupTitle);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:10px;';
    wrap.appendChild(grid);

    for (const value of values) {
      const label = document.createElement('label');
      label.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;font-size:0.85rem;';
      label.textContent = String(value);
      const input = document.createElement('input');
      input.type = 'color';
      input.value = state.valueColors[value];
      input.addEventListener('input', () => {
        state.valueColors[value] = input.value;
        renderCardPreviews(cardsRow);
        scheduleSave(status);
      });
      label.appendChild(input);
      grid.appendChild(label);
    }
  };

  buildValueGrid('Background split colors — positive values', POSITIVE_VALUES);
  buildValueGrid('Background split colors — negative values', NEGATIVE_VALUES);

  const waveTitle = document.createElement('h2');
  waveTitle.textContent = 'Wave icon colors (by sign)';
  wrap.appendChild(waveTitle);

  const waveRow = document.createElement('div');
  waveRow.style.cssText = 'display:flex;gap:24px;';
  wrap.appendChild(waveRow);

  const makeWaveInput = (labelText: string, get: () => string, set: (v: string) => void) => {
    const label = document.createElement('label');
    label.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;font-size:0.85rem;';
    label.textContent = labelText;
    const input = document.createElement('input');
    input.type = 'color';
    input.value = get();
    input.addEventListener('input', () => {
      set(input.value);
      renderCardPreviews(cardsRow);
      scheduleSave(status);
    });
    label.appendChild(input);
    waveRow.appendChild(label);
  };
  makeWaveInput(
    'Positive',
    () => state.wavePositive,
    (v) => (state.wavePositive = v),
  );
  makeWaveInput(
    'Negative',
    () => state.waveNegative,
    (v) => (state.waveNegative = v),
  );

  app.appendChild(wrap);
  renderCardPreviews(cardsRow);
}

renderPage();
