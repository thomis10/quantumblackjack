import { describe, expect, it } from 'vitest';
import { buildExportEntries } from './main';

describe('deck export paths', () => {
  it('uses jpeg filenames for exported cards', () => {
    const entries = buildExportEntries();
    expect(entries.some((entry) => entry.path.endsWith('.png'))).toBe(false);
    expect(entries.some((entry) => entry.path.endsWith('.jpg'))).toBe(true);
    expect(entries[0]?.path).toContain('regular/');
    expect(entries.at(-1)?.path).toBe('back.jpg');
  });
});
