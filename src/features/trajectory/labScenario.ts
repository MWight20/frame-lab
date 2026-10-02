import type { CharacterData, Hit, Hitbox, Move, Stage } from '../../data/types';
import {
  calculateKnockback,
  findKillPercent,
  NEUTRAL_STICK,
  simulateHit,
  type HitResult,
  type HitScenario,
  type Point,
  type StickPosition,
} from '../../engine';

/**
 * Pure logic behind the Trajectory Lab: which hitbox to use, where the victim stands, and
 * the two results (no DI and with DI). No React, so it can be unit-tested directly.
 */

/** A dragged pin this close above or below a surface snaps onto it, in game units. */
export const SURFACE_SNAP_DISTANCE = 4;

/** Throws use a fixed weight of 100 for knockback, whatever the victim weighs. */
const THROW_MOVE_IDS = new Set(['fthrow', 'bthrow', 'uthrow', 'dthrow']);

export interface VictimPlacement {
  position: Point;
  isGrounded: boolean;
  /** "Main stage", "Top platform" and so on, or null when airborne. */
  surfaceName: string | null;
}

interface Surface {
  name: string;
  y: number;
  left: number;
  right: number;
}

/** Pummels hit a held victim, who stays in the grab instead of being launched. */
const NON_LAUNCHING_MOVE_IDS = new Set(['pummel']);

/**
 * The hits of a move that can launch the victim, with grab boxes removed (they catch the
 * victim rather than hitting them). Empty for grabs and pummels.
 */
export function launchingHits(move: Move): Hit[] {
  if (NON_LAUNCHING_MOVE_IDS.has(move.id)) return [];
  return move.hits.map(withoutGrabBoxes).filter((hit) => hit.hitboxes.length > 0);
}

/**
 * The hit chosen in the frame data panel if it can launch, else the move's first one
 * that can. Assumes the move has at least one launching hit.
 */
export function pickLaunchingHit(move: Move, hitIndex: number): Hit {
  const selected = move.hits[hitIndex];
  const launching = selected && withoutGrabBoxes(selected);
  if (launching && launching.hitboxes.length > 0) return launching;
  return launchingHits(move)[0]!;
}

function withoutGrabBoxes(hit: Hit): Hit {
  return { ...hit, hitboxes: hit.hitboxes.filter((hitbox) => hitbox.effect !== 'Grab') };
}

/**
 * The hitbox dealing the most knockback to this victim at this percent. Moves often list
 * several hitboxes for one hit (sweetspot, sourspot); the strongest is the one players
 * usually care about. Ties keep the first, which matches the data's order.
 */
export function findStrongestHitbox(
  hit: Hit,
  victim: CharacterData,
  victimPercent: number,
): Hitbox | undefined {
  let strongest: Hitbox | undefined;
  let strongestKnockback = -Infinity;
  for (const hitbox of hit.hitboxes) {
    const knockback = calculateKnockback({
      hitbox,
      victimPercent,
      victimWeight: victim.attributes.weight,
    });
    if (knockback > strongestKnockback) {
      strongest = hitbox;
      strongestKnockback = knockback;
    }
  }
  return strongest;
}

/**
 * Works out where the victim stands and whether they are on the ground. With a snap
 * distance (pointer drags), a point near a surface lands on it; with 0 (keyboard steps),
 * only a point exactly on a surface counts as grounded. The point is kept inside the
 * blast zones.
 */
export function placeVictim(point: Point, stage: Stage, snapDistance: number): VictimPlacement {
  const { left, right, top, bottom } = stage.blastZones;
  const clamped = {
    x: clamp(point.x, left + 1, right - 1),
    y: clamp(point.y, bottom + 1, top - 1),
  };

  const surface = stageSurfaces(stage).find(
    (candidate) =>
      clamped.x >= candidate.left &&
      clamped.x <= candidate.right &&
      Math.abs(clamped.y - candidate.y) <= snapDistance,
  );
  if (!surface) return { position: clamped, isGrounded: false, surfaceName: null };
  return {
    position: { x: clamped.x, y: surface.y },
    isGrounded: true,
    surfaceName: surface.name,
  };
}

function stageSurfaces(stage: Stage): Surface[] {
  const mainStage = { name: 'Main stage', y: 0, left: -stage.edgeX, right: stage.edgeX };
  return [
    mainStage,
    ...stage.platforms.map((platform) => ({ ...platform, name: platformName(platform, stage) })),
  ];
}

/** Names platforms by position, which is how players refer to them. */
function platformName(platform: Stage['platforms'][number], stage: Stage): string {
  const isHighest = stage.platforms.every((other) => other.y <= platform.y);
  const center = (platform.left + platform.right) / 2;
  if (isHighest && Math.abs(center) < 1) return 'Top platform';
  return center < 0 ? 'Left platform' : 'Right platform';
}

export interface LabInput {
  move: Move;
  hitbox: Hitbox;
  victim: CharacterData;
  victimPercent: number;
  stage: Stage;
  placement: VictimPlacement;
  isCrouching: boolean;
  /** True when the attacker faces left, which mirrors the launch angle. */
  isAttackerFacingLeft: boolean;
  stick: StickPosition;
}

export interface LabResult {
  hit: HitResult;
  /** Lowest whole percent (before the hit) that KOs from this spot, or null if none does. */
  killPercent: number | null;
}

/** Runs the hit twice, without and with the chosen DI. */
export function runLab(input: LabInput): { noDi: LabResult; withDi: LabResult } {
  return {
    noDi: runOnce(input, NEUTRAL_STICK),
    withDi: runOnce(input, input.stick),
  };
}

function runOnce(input: LabInput, stick: StickPosition): LabResult {
  const scenario: HitScenario = {
    hitbox: input.hitbox,
    victim: { ...input.victim.attributes },
    stage: input.stage,
    start: input.placement.position,
    isGrounded: input.placement.isGrounded,
    // Crouching needs the ground under the victim.
    isCrouching: input.isCrouching && input.placement.isGrounded,
    isReversed: input.isAttackerFacingLeft,
    isThrow: THROW_MOVE_IDS.has(input.move.id),
    stick,
  };
  return {
    hit: simulateHit(scenario, input.victimPercent),
    killPercent: findKillPercent(scenario),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
