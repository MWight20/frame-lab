import type { Hit, Hitbox, Move } from '../../data/types';

/**
 * What a move is doing on a given frame.
 * - startup: before the first hitbox comes out
 * - active: at least one hitbox is out
 * - gap: between two active windows (multi-hit moves such as Fox's forward air)
 * - recovery: after the last hitbox, before the move can be interrupted
 * - interruptible: from IASA until the move ends
 */
export type FramePhase = 'startup' | 'active' | 'gap' | 'recovery' | 'interruptible';

export interface TimelineFrame {
  frame: number;
  phase: FramePhase;
}

export interface FrameWindow {
  start: number;
  end: number;
}

/** Active windows for the move, with touching or overlapping windows merged. */
export function getActiveWindows(move: Move): FrameWindow[] {
  const hitWindows = move.hits
    .filter((hit) => hit.startFrame !== null && hit.endFrame !== null)
    .map((hit) => ({ start: hit.startFrame!, end: hit.endFrame! }));

  if (hitWindows.length === 0) {
    if (move.firstActiveFrame === null || move.lastActiveFrame === null) return [];
    return [{ start: move.firstActiveFrame, end: move.lastActiveFrame }];
  }

  const sorted = hitWindows.sort((a, b) => a.start - b.start);
  const merged: FrameWindow[] = [{ ...sorted[0]! }];

  for (const window of sorted.slice(1)) {
    const last = merged[merged.length - 1]!;
    if (window.start <= last.end + 1) {
      last.end = Math.max(last.end, window.end);
    } else {
      merged.push({ ...window });
    }
  }
  return merged;
}

/** One entry per frame of the move, from frame 1 to its total frame count. */
export function buildFrameTimeline(move: Move): TimelineFrame[] {
  if (move.totalFrames === null) return [];

  const windows = getActiveWindows(move);
  const firstActive = windows[0]?.start ?? Infinity;
  const lastActive = windows[windows.length - 1]?.end ?? -Infinity;

  const frames: TimelineFrame[] = [];
  for (let frame = 1; frame <= move.totalFrames; frame++) {
    frames.push({ frame, phase: phaseForFrame(frame) });
  }
  return frames;

  function phaseForFrame(frame: number): FramePhase {
    if (windows.some((window) => frame >= window.start && frame <= window.end)) return 'active';
    if (frame < firstActive) return 'startup';
    if (frame < lastActive) return 'gap';
    if (move.iasa !== null && frame >= move.iasa) return 'interruptible';
    return 'recovery';
  }
}

/** "7–17", or "6–8, 16–18" for moves with separate windows. */
export function formatWindows(windows: FrameWindow[]): string {
  if (windows.length === 0) return '—';
  return windows
    .map((window) =>
      window.start === window.end ? `${window.start}` : `${window.start}–${window.end}`,
    )
    .join(', ');
}

/** A short label for a hit, used in the hit picker: "Clean", "Frames 7–9", or "Hit 2". */
export function describeHit(hit: Hit, index: number): string {
  if (hit.name) return hit.name.charAt(0).toUpperCase() + hit.name.slice(1);
  if (hit.startFrame !== null && hit.endFrame !== null) {
    return `Frames ${formatWindows([{ start: hit.startFrame, end: hit.endFrame }])}`;
  }
  return `Hit ${index + 1}`;
}

/** The hitbox that deals the most damage, which is usually the one players care about. */
export function getStrongestHitbox(hit: Hit): Hitbox | undefined {
  return hit.hitboxes.reduce<Hitbox | undefined>(
    (strongest, hitbox) => (!strongest || hitbox.damage > strongest.damage ? hitbox : strongest),
    undefined,
  );
}
