// Dev-only deck export tool: rasterizes every unique card face to JPEG and
// zips them for download. Not linked from the normal game UI.

import '../style.css';
import JSZip from 'jszip';
import { createRegularDeck, QUANTUM_CARD_DEFS } from '../game/cards';
import { buildCardBackSvg, buildQuantumCardSvg, buildRegularCardSvg } from '../ui/cardArt';

const CARD_W = 64;
const CARD_H = 90;
const EXPORT_SCALE = 8; // raster resolution multiplier over the card's native SVG size

async function svgToJpgBlob(svg: SVGSVGElement): Promise<Blob> {
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const svgText = new XMLSerializer().serializeToString(svg);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;

  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Failed to rasterize card SVG'));
    image.src = svgUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W * EXPORT_SCALE;
  canvas.height = CARD_H * EXPORT_SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  if (!blob) throw new Error('Failed to encode JPEG');
  return blob;
}

interface ExportEntry {
  path: string;
  buildSvg: () => SVGSVGElement;
}

export function buildExportEntries(): ExportEntry[] {
  const entries: ExportEntry[] = [];
  for (const card of createRegularDeck()) {
    entries.push({ path: `regular/${card.suit}-${card.rank}.jpg`, buildSvg: () => buildRegularCardSvg(card.rank, card.suit) });
  }
  QUANTUM_CARD_DEFS.forEach((def) => {
    const [v0, v1] = def.values;
    const suit = def.suit ?? 'card';
    entries.push({ path: `quantum/${suit}-${v0}-${v1}.jpg`, buildSvg: () => buildQuantumCardSvg(def.values, false, 0, def.suit) });
  });
  entries.push({ path: 'back.jpg', buildSvg: () => buildCardBackSvg() });
  return entries;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function renderPage(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'max-width:480px;margin:60px auto;padding:24px;text-align:center;';

  const title = document.createElement('h1');
  title.textContent = 'Quantum Blackjack — Deck Export';
  wrap.appendChild(title);

  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Generates a ZIP of every regular card, every quantum value pair, and the card back as JPGs.';
  wrap.appendChild(hint);

  const button = document.createElement('button');
  button.className = 'btn';
  button.textContent = 'Generate & Download Deck ZIP';
  wrap.appendChild(button);

  const status = document.createElement('p');
  status.className = 'hint';
  wrap.appendChild(status);

  button.addEventListener('click', async () => {
    button.disabled = true;
    const entries = buildExportEntries();
    const zip = new JSZip();
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      status.textContent = `Rendering ${i + 1} / ${entries.length}: ${entry.path}`;
      const blob = await svgToJpgBlob(entry.buildSvg());
      zip.file(entry.path, blob);
    }
    status.textContent = 'Zipping…';
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'quantum-blackjack-deck.zip');
    status.textContent = `Done — ${entries.length} cards exported.`;
    button.disabled = false;
  });

  app.appendChild(wrap);
}

if (typeof document !== 'undefined') {
  renderPage();
}
