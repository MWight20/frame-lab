import type { Stage } from '../data/types';
import {
  GROUND_BOUNCE_MULTIPLIER,
  LAUNCH_SPEED_DECAY,
  LAUNCH_SPEED_EPSILON,
  LAUNCH_SPEED_PER_KNOCKBACK,
  MAX_SIMULATED_FRAMES,
  TOP_BLAST_ZONE_MIN_SPEED,
} from './constants';
import { calculateHitstunFrames, causesTumble } from './knockback';

export interface Point {
  x: number;
  y: number;
}

export interface VictimPhysics {
  /** Downward acceleration per frame while airborne. */
  gravity: number;
  /** Maximum falling speed. Victims can't fast-fall during hitstun. */
  fallSpeed: number;
}

export interface LaunchInput {
  knockback: number;
  /** The final launch angle in degrees, from `resolveLaunchAngle`. */
  angle: number;
  /** The victim's position (at their feet) when hitlag ends. */
  start: Point;
  victim: VictimPhysics;
  stage: Pick<Stage, 'blastZones'>;
  /** Grounded victims hit downward bounce off the floor or stay on it. */
  isGrounded?: boolean;
}

export type BlastZoneSide = 'left' | 'right' | 'top' | 'bottom';

export type LaunchOutcome =
  /** `frame` can be after hitstun ends; the victim could act before then. */
  | { type: 'ko'; side: BlastZoneSide; frame: number; position: Point }
  | { type: 'survives'; hitstunEnd: Point };

export interface LaunchResult {
  /** `path[0]` is the start; `path[n]` is the position after frame n. */
  path: Point[];
  hitstunFrames: number;
  isTumble: boolean;
  outcome: LaunchOutcome;
}

/**
 * Steps the victim's flight one frame at a time, in the game's order: gravity, then
 * launch-speed decay, then the position update, then the blast-zone check.
 * Source: decomp Fighter_procUpdate and ftCo_800D3158; ikneedata knockbackTravel.
 *
 * The victim is assumed to do nothing after hitstun ends (no drift, jump or fast-fall).
 * The simulation runs until the launch speed has fully decayed, so a KO can land after
 * hitstun, as in ikneedata.
 *
 * Not modelled: stage and platform collision during flight, techs, ASDI and SDI, and
 * traction for victims who slide along the floor.
 */
export function simulateLaunch(input: LaunchInput): LaunchResult {
  const hitstunFrames = calculateHitstunFrames(input.knockback);
  const isTumble = causesTumble(input.knockback);
  const launch = initialLaunchVelocity(input, isTumble);
  const decay = decayPerFrame(launch);
  const { gravity, fallSpeed } = input.victim;
  // A grounded victim launched flat along the floor slides instead of falling.
  const slidesOnFloor = input.isGrounded === true && launch.y === 0;

  const path: Point[] = [input.start];
  let position = input.start;
  let fallVelocity = 0;

  for (let frame = 1; frame <= MAX_SIMULATED_FRAMES; frame += 1) {
    if (!slidesOnFloor) fallVelocity = Math.max(fallVelocity - gravity, -fallSpeed);
    decayLaunchVelocity(launch, decay);
    position = { x: position.x + launch.x, y: position.y + launch.y + fallVelocity };
    path.push(position);

    const side = crossedBlastZone(position, launch, input.stage.blastZones);
    if (side) {
      return { path, hitstunFrames, isTumble, outcome: { type: 'ko', side, frame, position } };
    }
    if (frame >= hitstunFrames && isLaunchSpent(launch)) break;
  }

  const hitstunEnd = path[Math.min(hitstunFrames, path.length - 1)] ?? input.start;
  return { path, hitstunFrames, isTumble, outcome: { type: 'survives', hitstunEnd } };
}

function initialLaunchVelocity(input: LaunchInput, isTumble: boolean): Point {
  const speed = input.knockback * LAUNCH_SPEED_PER_KNOCKBACK;
  const radians = (input.angle * Math.PI) / 180;
  const velocity = { x: speed * Math.cos(radians), y: speed * Math.sin(radians) };

  if (input.isGrounded && velocity.y < 0) {
    // The floor stops a downward launch. Tumbling victims bounce up off it; others stay
    // on the ground. Source: decomp (x1EC), ikneedata getVerticalVelocity.
    velocity.y = isTumble ? -velocity.y * GROUND_BOUNCE_MULTIPLIER : 0;
  }
  return velocity;
}

/**
 * Speed lost per frame on each axis. The game takes it along the current direction, which
 * never changes during flight, so it can be worked out once.
 */
function decayPerFrame(velocity: Point): Point {
  const direction = Math.atan2(velocity.y, velocity.x);
  return {
    x: LAUNCH_SPEED_DECAY * Math.cos(direction),
    y: LAUNCH_SPEED_DECAY * Math.sin(direction),
  };
}

/** Reduces each axis toward zero without letting it change sign. Mutates `velocity`. */
function decayLaunchVelocity(velocity: Point, decay: Point): void {
  velocity.x = reduceTowardZero(velocity.x, decay.x);
  velocity.y = reduceTowardZero(velocity.y, decay.y);
}

function reduceTowardZero(value: number, amount: number): number {
  const reduced = value - amount;
  return Math.sign(reduced) === Math.sign(value) ? reduced : 0;
}

function isLaunchSpent(velocity: Point): boolean {
  return Math.abs(velocity.x) < LAUNCH_SPEED_EPSILON && Math.abs(velocity.y) < LAUNCH_SPEED_EPSILON;
}

/**
 * Checked in the game's order. The top blast zone only KOs while the victim is still
 * rising fast from the launch itself; gravity doesn't count toward that speed.
 * Source: decomp ftCo_800D3158.
 */
function crossedBlastZone(
  position: Point,
  launchVelocity: Point,
  blastZones: Stage['blastZones'],
): BlastZoneSide | null {
  if (position.x > blastZones.right) return 'right';
  if (position.x < blastZones.left) return 'left';
  if (position.y > blastZones.top && launchVelocity.y > TOP_BLAST_ZONE_MIN_SPEED) return 'top';
  if (position.y < blastZones.bottom) return 'bottom';
  return null;
}
