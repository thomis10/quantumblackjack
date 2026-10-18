// Shared inline-SVG card face builders. Used by the live game renderer and by
// the deck export page so both draw from the exact same visual source.

import type { Rank, Suit, QuantumSuit } from '../game/cards';
import { QUANTUM_CARD_DEFS } from '../game/cards';

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
  '-2': '#2b4591',
  '-3': '#3d2583',
  '-4': '#2b4591',
  '-5': '#3d2583',
  '-6': '#2b4591',
  '-7': '#3d2583',
  '-8': '#2b4591',
  '-9': '#3d2583',
  '-10': '#2b4591',
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

/*
// ============================================================================
// OLD QUANTUM CARD CODE (COMMENTED OUT AS REQUESTED)
// ============================================================================

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

export function buildOldQuantumCardSvg(
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
*/

// ============================================================================
// NEW QUANTUM CARD ART:
// - Traditional playing card clean white background
// - Top-left corner: card value + suit
// - Bottom-right corner: other value + same suit (rotated 180°)
// - Diagonally from bottom-left to top-right:
//   * Red standing wave envelope with as many nodes as top-left value
//   * Green standing wave envelope with as many nodes as bottom-right value
//   * Central string axis and node dots at zero crossings
// ============================================================================

export const QUANTUM_SUIT_COLORS: Record<QuantumSuit, string> = {
  hearts: '#d32f2f',
  diamonds: '#d32f2f',
  clubs: '#1a1a1a',
  spades: '#1a1a1a',
  joker: '#7c3aed',
};

const JOKER_STAR_D =
  'M5 0.6 L6.35 3.33 L9.36 3.77 L7.18 5.89 L7.7 8.89 L5 7.47 L2.3 8.89 L2.82 5.89 L0.64 3.77 L3.65 3.33 Z';

function buildQuantumSuitShape(suit: QuantumSuit, color: string): SVGElement {
  if (suit === 'joker') {
    return svgEl('path', { d: JOKER_STAR_D, fill: color });
  }
  return buildSuitShape(suit, color);
}

function buildQuantumSuitGlyph(suit: QuantumSuit, size: number, color: string): SVGGElement {
  const g = svgEl('g', { transform: `translate(${-size / 2},${-size / 2}) scale(${size / 10})` });
  g.appendChild(buildQuantumSuitShape(suit, color));
  return g;
}

function buildQuantumCornerIndex(
  value: number,
  suit: QuantumSuit,
  waveColor: string,
  highlighted: boolean = false,
  dimmed: boolean = false,
): SVGGElement {
  const g = svgEl('g', {
    transform: 'translate(4.5, 4.5)',
    opacity: dimmed ? '0.35' : '1',
  });

  const suitColor = QUANTUM_SUIT_COLORS[suit] ?? '#1a1a1a';
  const valStr = String(value);
  const fontSize = valStr.length >= 3 ? '7' : valStr.length === 2 ? '8' : '9.5';
  const boxWidth = valStr.length >= 3 ? 14 : valStr.length === 2 ? 12 : 10.5;
  const boxHeight = 11;
  const boxX = 4.5 - boxWidth / 2;
  const boxY = -0.5;

  // Border box with corresponding wave color to pair the number with its wave
  const box = svgEl('rect', {
    x: boxX.toFixed(2),
    y: boxY.toFixed(2),
    width: boxWidth.toFixed(2),
    height: String(boxHeight),
    rx: '2.5',
    fill: waveColor,
    'fill-opacity': highlighted ? '0.22' : '0.07',
    stroke: waveColor,
    'stroke-width': highlighted ? '1.4' : '1.0',
  });
  g.appendChild(box);

  const text = svgEl('text', {
    x: '4.5',
    y: '5.2',
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    'font-size': fontSize,
    'font-weight': '800',
    'font-family': 'system-ui, -apple-system, sans-serif',
    fill: suitColor,
  });
  text.textContent = valStr;
  g.appendChild(text);

  const suitWrap = svgEl('g', { transform: 'translate(4.5, 16.5)' });
  suitWrap.appendChild(buildQuantumSuitGlyph(suit, 7, suitColor));
  g.appendChild(suitWrap);

  return g;
}

interface StandingWaveParams {
  value: number;
  color: string;
  amplitude: number;
  highlighted?: boolean;
  dimmed?: boolean;
}

function buildStandingWave(params: StandingWaveParams): SVGGElement {
  const { value, color, amplitude, highlighted = false, dimmed = false } = params;
  const nodes = Math.max(1, Math.abs(value));

  const g = svgEl('g', {
    opacity: dimmed ? '0.18' : '1',
    style: highlighted ? `filter: drop-shadow(0 0 2px ${color});` : '',
  });

  const x0 = 4;
  const y0 = 86;
  const x1 = 60;
  const y1 = 4;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const L = Math.hypot(dx, dy);
  const nx = -dy / L;
  const ny = dx / L;

  const samples = Math.max(80, nodes * 16);
  const sign = value < 0 ? -1 : 1;

  // Single sine wave across the diagonal (inverted for negative values)
  const wavePts: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const bx = x0 + t * dx;
    const by = y0 + t * dy;
    const wave = sign * amplitude * Math.sin(nodes * Math.PI * t);
    wavePts.push(`${(bx + wave * nx).toFixed(2)},${(by + wave * ny).toFixed(2)}`);
  }

  const wavePath = svgEl('path', {
    d: `M ${wavePts.join(' L ')}`,
    fill: 'none',
    stroke: color,
    'stroke-width': highlighted ? '1.8' : '1.3',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });
  g.appendChild(wavePath);

  // Node markers along diagonal baseline
  const nodeRadius = amplitude > 5 ? 1.0 : 0.85;
  for (let k = 0; k <= nodes; k++) {
    const t = k / nodes;
    const nxPos = (x0 + t * dx).toFixed(2);
    const nyPos = (y0 + t * dy).toFixed(2);
    g.appendChild(
      svgEl('circle', {
        cx: nxPos,
        cy: nyPos,
        r: String(nodeRadius),
        fill: color,
      }),
    );
  }

  return g;
}

function resolveQuantumSuit(values: [number, number], suit?: QuantumSuit): QuantumSuit {
  if (suit) return suit;
  const match = QUANTUM_CARD_DEFS.find(
    (def) => def.values[0] === values[0] && def.values[1] === values[1],
  );
  return match?.suit ?? 'spades';
}

/**
 * Quantum card face:
 * - White card background matching traditional playing cards
 * - Top-left corner: value 0 + suit
 * - Bottom-right corner: value 1 + same suit (rotated 180°)
 * - Diagonally from bottom-left to top-right:
 *   * Red standing wave with as many nodes as the top-left value
 *   * Green standing wave with as many nodes as the bottom-right value
 */
export function buildQuantumCardSvg(
  values: [number, number],
  observed: boolean = false,
  chosenSide: 0 | 1 = 0,
  suitOrOverrides?: QuantumSuit | QuantumColorOverrides,
  colorOverrides?: QuantumColorOverrides,
): SVGSVGElement {
  const svg = newSvgRoot();

  let suit: QuantumSuit | undefined;
  let overrides = colorOverrides;
  if (typeof suitOrOverrides === 'string') {
    suit = suitOrOverrides;
  } else if (typeof suitOrOverrides === 'object' && suitOrOverrides !== null) {
    overrides = suitOrOverrides;
  }

  const resolvedSuit = resolveQuantumSuit(values, suit);
  const redColor = overrides?.waveNegative ?? WAVE_NEGATIVE_COLOR;
  const greenColor = overrides?.wavePositive ?? WAVE_POSITIVE_COLOR;

  // 1. Clean white playing-card background
  svg.appendChild(
    svgEl('rect', {
      x: '0.5',
      y: '0.5',
      width: `${CARD_W - 1}`,
      height: `${CARD_H - 1}`,
      rx: '7',
      fill: '#ffffff',
      stroke: '#e2e8f0',
      'stroke-width': '1',
    }),
  );

  // 2. Diagonal string baseline
  svg.appendChild(
    svgEl('line', {
      x1: '4',
      y1: '86',
      x2: '60',
      y2: '4',
      stroke: '#dbe0ea',
      'stroke-width': '0.75',
      'stroke-dasharray': '2 2',
      'stroke-linecap': 'round',
    }),
  );

  // 3. Standing waves along the diagonal
  // Red wave: top-left value (side 0)
  svg.appendChild(
    buildStandingWave({
      value: values[0],
      color: redColor,
      amplitude: 5.2,
      highlighted: observed && chosenSide === 0,
      dimmed: observed && chosenSide === 1,
    }),
  );

  // Green wave: bottom-right value (side 1)
  svg.appendChild(
    buildStandingWave({
      value: values[1],
      color: greenColor,
      amplitude: 5.2,
      highlighted: observed && chosenSide === 1,
      dimmed: observed && chosenSide === 0,
    }),
  );

  // 4. Top-left corner index (value 0 framed in red wave border box + suit)
  svg.appendChild(
    buildQuantumCornerIndex(
      values[0],
      resolvedSuit,
      redColor,
      observed && chosenSide === 0,
      observed && chosenSide === 1,
    ),
  );

  // 5. Bottom-right corner index (value 1 framed in green wave border box + suit, rotated 180°)
  const brWrap = svgEl('g', { transform: `rotate(180 ${CARD_W / 2} ${CARD_H / 2})` });
  brWrap.appendChild(
    buildQuantumCornerIndex(
      values[1],
      resolvedSuit,
      greenColor,
      observed && chosenSide === 1,
      observed && chosenSide === 0,
    ),
  );
  svg.appendChild(brWrap);

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
