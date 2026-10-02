import { describe, expect, it } from 'vitest';
import { findMove, getCharacterData } from '../../data/characters';
import type { Move } from '../../data/types';
import { buildFrameTimeline, describeHit, formatWindows, getActiveWindows } from './frameTimeline';

function foxMove(moveId: string): Move {
  const move = findMove(getCharacterData('fox')!, moveId);
  if (!move) throw new Error(`Fox has no move ${moveId}`);
  return move;
}

describe('getActiveWindows', () => {
  it('merges back-to-back hits into one window', () => {
    // Up smash is two hits, frames 7–9 and 10–17, with no gap between them.
    expect(getActiveWindows(foxMove('usmash'))).toEqual([{ start: 7, end: 17 }]);
  });

  it('keeps separate windows for moves with gaps', () => {
    expect(formatWindows(getActiveWindows(foxMove('fair')))).toBe(
      '6–8, 16–18, 24–26, 33–35, 43–45',
    );
  });

  it("falls back to the move's active frames when hits have no windows", () => {
    // Back air's hits are labelled clean/late without frame windows in the source.
    expect(getActiveWindows(foxMove('bair'))).toEqual([{ start: 4, end: 19 }]);
  });
});

describe('buildFrameTimeline', () => {
  it('labels every frame of up smash', () => {
    const timeline = buildFrameTimeline(foxMove('usmash'));
    expect(timeline).toHaveLength(41);
    expect(timeline[0]).toEqual({ frame: 1, phase: 'startup' });
    expect(timeline[5]?.phase).toBe('startup'); // frame 6
    expect(timeline[6]?.phase).toBe('active'); // frame 7
    expect(timeline[16]?.phase).toBe('active'); // frame 17
    expect(timeline[17]?.phase).toBe('recovery'); // frame 18
  });

  it('marks gaps between hits and frames after IASA', () => {
    const timeline = buildFrameTimeline(foxMove('nair')); // hits 4–7 and 8–31, IASA 42
    expect(timeline[7]?.phase).toBe('active');
    expect(timeline[40]?.phase).toBe('recovery'); // frame 41
    expect(timeline[41]?.phase).toBe('interruptible'); // frame 42

    const fair = buildFrameTimeline(foxMove('fair'));
    expect(fair[9]?.phase).toBe('gap'); // frame 10, between the first two hits
  });

  it('returns nothing when the total frame count is unknown', () => {
    expect(buildFrameTimeline(foxMove('rjab'))).toEqual([]);
  });
});

describe('describeHit', () => {
  it('prefers the source name, then the frame window', () => {
    const bair = foxMove('bair');
    expect(describeHit(bair.hits[0]!, 0)).toBe('Clean');
    expect(describeHit(foxMove('usmash').hits[1]!, 1)).toBe('Frames 10–17');
  });
});
