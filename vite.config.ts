import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

const CARD_ART_PATH = resolve(import.meta.dirname, 'src/ui/cardArt.ts');
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const VALUE_KEYS = [...Array.from({ length: 10 }, (_, i) => i + 1), ...Array.from({ length: 10 }, (_, i) => -(i + 1))];

interface SaveColorsPayload {
  valueColors: Record<string, string>;
  wavePositive: string;
  waveNegative: string;
}

function isValidPayload(payload: unknown): payload is SaveColorsPayload {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Partial<SaveColorsPayload>;
  if (typeof p.wavePositive !== 'string' || !HEX_COLOR_RE.test(p.wavePositive)) return false;
  if (typeof p.waveNegative !== 'string' || !HEX_COLOR_RE.test(p.waveNegative)) return false;
  if (typeof p.valueColors !== 'object' || p.valueColors === null) return false;
  for (const v of VALUE_KEYS) {
    const color = p.valueColors[String(v)];
    if (typeof color !== 'string' || !HEX_COLOR_RE.test(color)) return false;
  }
  return true;
}

/** Dev-only API so preview.html can write live color edits straight into cardArt.ts. */
function cardColorsDevApi(): Plugin {
  return {
    name: 'card-colors-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/card-colors', (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          void (async () => {
            try {
              const payload: unknown = JSON.parse(body);
              if (!isValidPayload(payload)) {
                res.statusCode = 400;
                res.end('Invalid color payload');
                return;
              }

              const valueColorsBlock = [
                '// auto-colors:value-colors:start',
                'export const VALUE_COLORS: Record<number, string> = {',
                ...VALUE_KEYS.map((v) => {
                  const key = v < 0 ? `'${v}'` : String(v);
                  return `  ${key}: '${payload.valueColors[String(v)]}',`;
                }),
                '};',
                '// auto-colors:value-colors:end',
              ].join('\n');
              const waveBlock = [
                '// auto-colors:wave-colors:start',
                `export const WAVE_POSITIVE_COLOR = '${payload.wavePositive}';`,
                `export const WAVE_NEGATIVE_COLOR = '${payload.waveNegative}';`,
                '// auto-colors:wave-colors:end',
              ].join('\n');

              let source = await readFile(CARD_ART_PATH, 'utf-8');
              source = source.replace(
                /\/\/ auto-colors:value-colors:start[\s\S]*?\/\/ auto-colors:value-colors:end/,
                valueColorsBlock,
              );
              source = source.replace(
                /\/\/ auto-colors:wave-colors:start[\s\S]*?\/\/ auto-colors:wave-colors:end/,
                waveBlock,
              );
              await writeFile(CARD_ART_PATH, source, 'utf-8');

              res.statusCode = 200;
              res.end('ok');
            } catch (err) {
              res.statusCode = 500;
              res.end(err instanceof Error ? err.message : 'Unknown error');
            }
          })();
        });
      });
    },
  };
}

// Three pages: the game itself, the dev-only deck export tool, and the dev-only color/card preview tool.
export default defineConfig({
  plugins: [cardColorsDevApi()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        export: resolve(import.meta.dirname, 'export.html'),
        preview: resolve(import.meta.dirname, 'preview.html'),
      },
    },
  },
});
