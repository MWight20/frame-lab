import type { StageSurface } from '../data/types';
import type { Point } from './simulateLaunch';

export interface SurfaceContact {
  surface: StageSurface;
  /** Where the path meets the surface's top. */
  position: Point;
}

/**
 * Finds the surface a one-frame move from `from` to `to` lands on, if any. Surfaces only
 * block from above: a path crossing one while moving up passes through, the way victims
 * fly up through platforms. When a fast fall crosses several surfaces in one frame, the
 * highest one is hit first.
 * Source: decomp mpColl_80044628_Floor (tests the segment from the previous position to
 * the current one against floor lines only).
 */
export function findLanding(
  from: Point,
  to: Point,
  surfaces: readonly StageSurface[],
): SurfaceContact | null {
  if (to.y >= from.y) return null;

  let landing: SurfaceContact | null = null;
  for (const surface of surfaces) {
    const crossesHeight = from.y >= surface.y && to.y < surface.y;
    if (!crossesHeight) continue;

    const share = (from.y - surface.y) / (from.y - to.y);
    const x = from.x + (to.x - from.x) * share;
    const isOverSurface = x >= surface.left && x <= surface.right;
    if (isOverSurface && (!landing || surface.y > landing.surface.y)) {
      landing = { surface, position: { x, y: surface.y } };
    }
  }
  return landing;
}
