// Shared inline-SVG card face builders. Used by the live game renderer and by
// the deck export page so both draw from the exact same visual source.

import type { Rank, Suit } from '../game/cards';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CARD_W = 64;
const CARD_H = 90;

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag) as SVGElementTagNameMap[K];
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

function newSvgRoot(): SVGSVGElement {
  return svgEl('svg', { viewBox: `0 0 ${CARD_W} ${CARD_H}`, width: '100%', height: '100%' });
}

export const SUIT_COLORS: Record<Suit, string> = {
  hearts: '#c22',
  diamonds: '#c22',
  clubs: '#111',
  spades: '#111',
};

// Pip glyph paths normalized to a 0..10 box, centered near (5,5).
const HEART_D =
  'M5 9 C5 9 1 5.5 1 3 C1 1.3 2.3 0.3 3.8 0.3 C4.6 0.3 5 0.9 5 1.4 C5 0.9 5.4 0.3 6.2 0.3 C7.7 0.3 9 1.3 9 3 C9 5.5 5 9 5 9 Z';
const DIAMOND_D = 'M5 0.3 L9.2 5 L5 9.7 L0.8 5 Z';
const SPADE_D =
  'M5 1 C5 1 9 4.5 9 7 C9 8.4 7.9 9.4 6.6 9.2 C5.8 9.1 5.2 8.6 5 8 C4.8 8.6 4.2 9.1 3.4 9.2 C2.1 9.4 1 8.4 1 7 C1 4.5 5 1 5 1 Z M4.3 8.6 L5.7 8.6 L5.2 9.8 L4.8 9.8 Z';

function buildClubShape(color: string): SVGGElement {
  const g = svgEl('g');
  g.appendChild(svgEl('circle', { cx: '5', cy: '2.6', r: '1.9', fill: color }));
  g.appendChild(svgEl('circle', { cx: '3', cy: '5.2', r: '1.9', fill: color }));
  g.appendChild(svgEl('circle', { cx: '7', cy: '5.2', r: '1.9', fill: color }));
  g.appendChild(svgEl('path', { d: 'M4.3 9.7 L5.7 9.7 L5.3 5.5 L4.7 5.5 Z', fill: color }));
  return g;
}

function buildSuitShape(suit: Suit, color: string): SVGElement {
  if (suit === 'clubs') return buildClubShape(color);
  const d = suit === 'hearts' ? HEART_D : suit === 'diamonds' ? DIAMOND_D : SPADE_D;
  return svgEl('path', { d, fill: color });
}

/** Suit glyph centered at the local origin, scaled to `size` px. */
function buildSuitGlyph(suit: Suit, size: number, color: string): SVGGElement {
  const g = svgEl('g', { transform: `translate(${-size / 2},${-size / 2}) scale(${size / 10})` });
  g.appendChild(buildSuitShape(suit, color));
  return g;
}

function buildCornerIndex(rank: Rank, suit: Suit, color: string): SVGGElement {
  const g = svgEl('g', { transform: 'translate(5,5)' });
  const text = svgEl('text', { x: '0', y: '8', 'font-size': '9', 'font-weight': '700', fill: color });
  text.textContent = rank;
  g.appendChild(text);
  const glyphWrap = svgEl('g', { transform: 'translate(4,16)' });
  glyphWrap.appendChild(buildSuitGlyph(suit, 7, color));
  g.appendChild(glyphWrap);
  return g;
}

interface PipPos {
  x: number;
  y: number;
  /** Upper-half pips render upside down, like real cards. */
  flipped?: boolean;
}

/** Simplified (not museum-accurate) pip positions, normalized to the card's full width/height. */
const PIP_LAYOUTS: Record<number, PipPos[]> = {
  1: [{ x: 0.5, y: 0.5 }],
  2: [
    { x: 0.5, y: 0.2 },
    { x: 0.5, y: 0.8, flipped: true },
  ],
  3: [{ x: 0.5, y: 0.2 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.8, flipped: true }],
  4: [
    { x: 0.3, y: 0.2 },
    { x: 0.7, y: 0.2 },
    { x: 0.3, y: 0.8, flipped: true },
    { x: 0.7, y: 0.8, flipped: true },
  ],
  5: [
    { x: 0.3, y: 0.2 },
    { x: 0.7, y: 0.2 },
    { x: 0.5, y: 0.5 },
    { x: 0.3, y: 0.8, flipped: true },
    { x: 0.7, y: 0.8, flipped: true },
  ],
  6: [
    { x: 0.3, y: 0.18 },
    { x: 0.7, y: 0.18 },
    { x: 0.3, y: 0.5 },
    { x: 0.7, y: 0.5 },
    { x: 0.3, y: 0.82, flipped: true },
    { x: 0.7, y: 0.82, flipped: true },
  ],
  7: [
    { x: 0.3, y: 0.18 },
    { x: 0.7, y: 0.18 },
    { x: 0.5, y: 0.34 },
    { x: 0.3, y: 0.5 },
    { x: 0.7, y: 0.5 },
    { x: 0.3, y: 0.82, flipped: true },
    { x: 0.7, y: 0.82, flipped: true },
  ],
  8: [
    { x: 0.3, y: 0.15 },
    { x: 0.7, y: 0.15 },
    { x: 0.3, y: 0.37 },
    { x: 0.7, y: 0.37 },
    { x: 0.3, y: 0.63, flipped: true },
    { x: 0.7, y: 0.63, flipped: true },
    { x: 0.3, y: 0.85, flipped: true },
    { x: 0.7, y: 0.85, flipped: true },
  ],
  9: [
    { x: 0.3, y: 0.15 },
    { x: 0.7, y: 0.15 },
    { x: 0.3, y: 0.37 },
    { x: 0.7, y: 0.37 },
    { x: 0.5, y: 0.5 },
    { x: 0.3, y: 0.63, flipped: true },
    { x: 0.7, y: 0.63, flipped: true },
    { x: 0.3, y: 0.85, flipped: true },
    { x: 0.7, y: 0.85, flipped: true },
  ],
  10: [
    { x: 0.3, y: 0.14 },
    { x: 0.7, y: 0.14 },
    { x: 0.3, y: 0.33 },
    { x: 0.7, y: 0.33 },
    { x: 0.3, y: 0.5 },
    { x: 0.7, y: 0.5 },
    { x: 0.3, y: 0.67, flipped: true },
    { x: 0.7, y: 0.67, flipped: true },
    { x: 0.3, y: 0.86, flipped: true },
    { x: 0.7, y: 0.86, flipped: true },
  ],
};

/** Traditional-playing-card face: corner rank+suit indices plus center pips matching the rank's count. */
export function buildRegularCardSvg(rank: Rank, suit: Suit): SVGSVGElement {
  const svg = newSvgRoot();
  const color = SUIT_COLORS[suit];
  const count = rank === 'A' ? 1 : Number(rank);
  const pipSize = count === 1 ? 20 : 11;
  for (const pip of PIP_LAYOUTS[count]) {
    const transform = `translate(${pip.x * CARD_W},${pip.y * CARD_H})${pip.flipped ? ' rotate(180)' : ''}`;
    const wrap = svgEl('g', { transform });
    wrap.appendChild(buildSuitGlyph(suit, pipSize, color));
    svg.appendChild(wrap);
  }
  svg.appendChild(buildCornerIndex(rank, suit, color));
  const brCorner = svgEl('g', { transform: `rotate(180 ${CARD_W / 2} ${CARD_H / 2})` });
  brCorner.appendChild(buildCornerIndex(rank, suit, color));
  svg.appendChild(brCorner);
  return svg;
}

// Placeholder per-value palette for quantum cards — replace with final colors later.
// Editable live via preview.html (which patches this block through the dev-only save API).
// auto-colors:value-colors:start
export const VALUE_COLORS: Record<number, string> = {
  1: '#6926ba',
  2: '#2b4591',
  3: '#6926ba',
  4: '#2b4591',
  5: '#6926ba',
  6: '#2b4591',
  7: '#6926ba',
  8: '#2b4591',
  9: '#6926ba',
  10: '#2b4591',
  '-1': '#3d2583',
  '-2': '#6fd1fb',
  '-3': '#3d2583',
  '-4': '#6fd1fb',
  '-5': '#3d2583',
  '-6': '#6fd1fb',
  '-7': '#3d2583',
  '-8': '#6fd1fb',
  '-9': '#3d2583',
  '-10': '#6fd1fb',
};
// auto-colors:value-colors:end

// auto-colors:wave-colors:start
export const WAVE_POSITIVE_COLOR = '#2f9e44';
export const WAVE_NEGATIVE_COLOR = '#e03131';
// auto-colors:wave-colors:end

export interface QuantumColorOverrides {
  valueColors?: Record<number, string>;
  wavePositive?: string;
  waveNegative?: string;
}

/**
 * Corner "wavefunction" icon: a plain circle plus a wavy circle whose peak
 * count equals the card's value, ported from circle_waves_AQT_QuantumBlackJack.py.
 * The wave is colored red for negative values, green otherwise.
 */
export function buildCornerValueIconSvg(value: number, colors?: QuantumColorOverrides): SVGGElement {
  const R = 4;
  const amplitude = 0.9;
  const waves = Math.abs(value);
  const samples = 48;
  const positive = colors?.wavePositive ?? WAVE_POSITIVE_COLOR;
  const negative = colors?.waveNegative ?? WAVE_NEGATIVE_COLOR;
  const waveColor = value < 0 ? negative : positive;
  const polarPoints = (radiusAt: (theta: number) => number): string => {
    const pts: string[] = [];
    for (let i = 0; i <= samples; i++) {
      const theta = (i / samples) * Math.PI * 2;
      const r = radiusAt(theta);
      pts.push(`${(r * Math.cos(theta)).toFixed(2)},${(r * Math.sin(theta)).toFixed(2)}`);
    }
    return pts.join(' ');
  };
  const g = svgEl('g');
  g.appendChild(
    svgEl('polygon', { points: polarPoints(() => R), fill: 'none', stroke: '#111', 'stroke-width': '0.9' }),
  );
  g.appendChild(
    svgEl('polygon', {
      points: polarPoints((theta) => R + amplitude * Math.sin(waves * theta)),
      fill: 'none',
      stroke: waveColor,
      'stroke-width': '0.9',
    }),
  );
  return g;
}

function buildQuantumCenterText(values: [number, number], observed: boolean, chosenSide: 0 | 1): SVGGElement {
  const g = svgEl('g');
  g.appendChild(
    svgEl('rect', { x: '14', y: '36', width: '36', height: '18', rx: '4', fill: 'rgba(10,8,20,0.55)' }),
  );
  if (!observed) {
    const text = svgEl('text', {
      x: '32',
      y: '48',
      'text-anchor': 'middle',
      'font-size': '11',
      'font-weight': '700',
      fill: '#e9d8ff',
    });
    text.textContent = `${values[0]} | ${values[1]}`;
    g.appendChild(text);
    return g;
  }
  const marker = svgEl('text', {
    x: chosenSide === 0 ? '23' : '41',
    y: '40',
    'text-anchor': 'middle',
    'font-size': '8',
    fill: '#4f9dff',
  });
  marker.textContent = '▼';
  const makeValueText = (value: number, side: 0 | 1) => {
    const text = svgEl('text', {
      x: side === 0 ? '23' : '41',
      y: '52',
      'text-anchor': 'middle',
      'font-size': side === chosenSide ? '13' : '9',
      'font-weight': side === chosenSide ? '800' : '600',
      fill: side === chosenSide ? '#4f9dff' : '#9aa4b8',
      opacity: side === chosenSide ? '1' : '0.6',
    });
    text.textContent = String(value);
    return text;
  };
  const v0 = makeValueText(values[0], 0);
  const divider = svgEl('text', { x: '32', y: '52', 'text-anchor': 'middle', 'font-size': '10', fill: '#9aa4b8' });
  divider.textContent = '|';
  const v1 = makeValueText(values[1], 1);
  g.append(marker, v0, divider, v1);
  return g;
}

/** Quantum card face: diagonal value-colored split, corner wavefunction icons, center value text. */
export function buildQuantumCardSvg(
  values: [number, number],
  observed: boolean,
  chosenSide: 0 | 1,
  colorOverrides?: QuantumColorOverrides,
): SVGSVGElement {
  const svg = newSvgRoot();
  const valueColors = colorOverrides?.valueColors ?? VALUE_COLORS;
  svg.appendChild(
    svgEl('polygon', { points: `0,0 ${CARD_W},0 0,${CARD_H}`, fill: valueColors[values[0]] ?? '#333' }),
  );
  svg.appendChild(
    svgEl('polygon', { points: `${CARD_W},0 ${CARD_W},${CARD_H} 0,${CARD_H}`, fill: valueColors[values[1]] ?? '#555' }),
  );
  const iconTL = svgEl('g', { transform: 'translate(12,13)' });
  iconTL.appendChild(buildCornerValueIconSvg(values[0], colorOverrides));
  svg.appendChild(iconTL);
  const iconBR = svgEl('g', { transform: `rotate(180 ${CARD_W / 2} ${CARD_H / 2})` });
  const iconBRInner = svgEl('g', { transform: 'translate(12,13)' });
  iconBRInner.appendChild(buildCornerValueIconSvg(values[1], colorOverrides));
  iconBR.appendChild(iconBRInner);
  svg.appendChild(iconBR);
  svg.appendChild(buildQuantumCenterText(values, observed, chosenSide));
  return svg;
}

/** Placeholder card-back design — swap with real art later. */
export function buildCardBackSvg(): SVGSVGElement {
  const svg = newSvgRoot();
  svg.appendChild(
    svgEl('rect', {
      x: '3',
      y: '3',
      width: `${CARD_W - 6}`,
      height: `${CARD_H - 6}`,
      rx: '6',
      fill: 'none',
      stroke: '#4f9dff',
      'stroke-width': '2',
      'stroke-dasharray': '4 3',
    }),
  );
  const text = svgEl('text', {
    x: `${CARD_W / 2}`,
    y: `${CARD_H / 2 + 7}`,
    'text-anchor': 'middle',
    'font-size': '20',
    fill: '#4f9dff',
    opacity: '0.6',
  });
  text.textContent = '?';
  svg.appendChild(text);
  return svg;
}
