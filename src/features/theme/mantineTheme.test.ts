import { describe, expect, it } from 'vitest';
import { mixHex } from './mantineTheme';
import { PALETTES } from './palettes';

describe('mixHex', () => {
  it('blends between two colors', () => {
    expect(mixHex('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(mixHex('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });
});

describe('palettes', () => {
  it('all define the same tokens', () => {
    const [first, ...rest] = Object.values(PALETTES);
    const expected = Object.keys(first!.tokens).sort();
    for (const palette of rest) {
      expect(Object.keys(palette.tokens).sort(), palette.id).toEqual(expected);
    }
  });
});
