import { describe, expect, it } from 'vitest';
import { hasClip } from './clips';

describe('hasClip', () => {
  it('finds clips that are in public/clips', () => {
    expect(hasClip('fox', 'usmash')).toBe(true);
  });

  it('reports moves without a clip file', () => {
    // The clip pack has no throws for Fox.
    expect(hasClip('fox', 'fthrow')).toBe(false);
    expect(hasClip('not-a-character', 'usmash')).toBe(false);
  });
});
