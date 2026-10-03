import { describe, expect, it } from 'vitest';
import { findClip } from './clips';

describe('findClip', () => {
  it("uses the move's own clip when there is one", () => {
    expect(findClip('fox', 'usmash')).toEqual({ fileId: 'usmash', variant: null });
  });

  it('returns null for moves without any clip', () => {
    // The clip pack has no throws.
    expect(findClip('fox', 'fthrow')).toBeNull();
    expect(findClip('not-a-character', 'usmash')).toBeNull();
  });

  it('prefers the uncharged variant', () => {
    expect(findClip('samus', 'neutralb')).toEqual({
      fileId: 'neutralb-uncharged',
      variant: 'uncharged',
    });
    // Luigi's Green Missile has both "charged" and "uncharged"; uncharged wins.
    expect(findClip('luigi', 'sideb')?.variant).toBe('uncharged');
  });

  it('uses the hand-picked variants', () => {
    expect(findClip('peach', 'fsmash')?.fileId).toBe('fsmash-pan');
    expect(findClip('mr-game-and-watch', 'sideb')?.fileId).toBe('sideb-9');
    expect(findClip('mr-game-and-watch', 'asideb')?.fileId).toBe('asideb-9');
  });

  it('falls back to the first variant alphabetically', () => {
    // PK Thunder has "hit" and "miss" clips, and no uncharged one.
    expect(findClip('ness', 'upb')).toEqual({ fileId: 'upb-hit', variant: 'hit' });
  });
});
