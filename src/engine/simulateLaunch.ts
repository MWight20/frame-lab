import { getStageSurfaces } from '../data/stages';
import type { Stage } from '../data/types';
import {
  GROUND_BOUNCE_MIN_DEGREES,
  GROUND_BOUNCE_MULTIPLIER,
  LAUNCH_SPEED_DECAY,
  LAUNCH_SPEED_EPSILON,
  LAUNCH_SPEED_PER_KNOCKBACK,
  MAX_SIMULATED_FRAMES,
  TOP_BLAST_ZONE_MIN_SPEED,
} from './constants';
import { calculateHitstunFrames, causesTumble } from './knockback';
import { findLanding } from './stageCollision';

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
  stage: Pick<Stage, 'blastZones' | 'edgeX' | 'platforms'>;
  /** Grounded victims hit downward bounce off the floor or stay on it. */
  isGrounded?: boolean;
  /** Whether a tumbling victim techs on landing (pressed L or R in time). Defaults to no. */
  techOnLanding?: boolean;
}

export type BlastZoneSide = 'left' | 'right' | 'top' | 'bottom';

/**
 * How a landing goes. Only tumbling victims can tech; if they don't, they're knocked down
 * (a missed tech). Victims who aren't tumbling just land.
 */
export type LandingKind = 'tech' | 'missed-tech' | 'land';

export type LaunchOutcome =
  /** `frame` can be after hitstun ends; the victim could act before then. */
  | { type: 'ko'; side: BlastZoneSide; frame: number; position: Point }
  /** The victim reached the main stage or a platform from above, which ends the flight. */
  | {
      type: 'lands';
      frame: number;
      position: Point;
      surfaceName: string;
      landing: LandingKind;
    }
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
 * launch-speed decay, then the position update, then stage collision, then the
 * blast-zone check. Source: decomp Fighter_procUpdate and ftCo_800D3158; ikneedata
 * knockbackTravel.
 *
 * Coming down onto the main stage or a platform ends the flight: Melee has no floor bounce
 * for an airborne victim, only a tech or a knockdown, and either way the vertical launch
 * speed is dropped. Surfaces only block from above, so victims fly up through platforms.
 * Source: decomp ftCo_80090184 (tech roll, tech in place, else DownBound),
 * https://www.ssbwiki.com/Meteor_smash.
 *
 * The victim is assumed to do nothing after hitstun ends (no drift, jump or fast-fall).
 * The simulation runs until the launch speed has fully decayed, so a KO can land after
 * hitstun, as in ikneedata.
 *
 * Not modelled: walls and ceilings (the stages' side and underside shapes aren't in the
 * data, and the game's bounce threshold isn't confirmed), where a tech roll ends up, the
 * slide after landing, ASDI and SDI, and traction for victims who slide along the floor.
 */
export function simulateLaunch(input: LaunchInput): LaunchResult {
  const hitstunFrames = calculateHitstunFrames(input.knockback);
  const isTumble = causesTumble(input.knockback);
  const launch = initialLaunchVelocity(input, isTumble);
  const decay = decayPerFrame(launch);
  const { gravity, fallSpeed } = input.victim;
  const surfaces = getStageSurfaces(input.stage);
  // A grounded victim launched flat along the floor slides instead of falling.
  const slidesOnFloor = input.isGrounded === true && launch.y === 0;

  const path: Point[] = [input.start];
  let position = input.start;
  let fallVelocity = 0;

  for (let frame = 1; frame <= MAX_SIMULATED_FRAMES; frame += 1) {
    if (!slidesOnFloor) fallVelocity = Math.max(fallVelocity - gravity, -fallSpeed);
    decayLaunchVelocity(launch, decay);
    const next = { x: position.x + launch.x, y: position.y + launch.y + fallVelocity };

    const contact = slidesOnFloor ? null : findLanding(position, next, surfaces);
    if (contact) {
      path.push(contact.position);
      const landing = landingKind(isTumble, input.techOnLanding === true);
      return {
        path,
        hitstunFrames,
        isTumble,
        outcome: {
          type: 'lands',
          frame,
          position: contact.position,
          surfaceName: contact.surface.name,
          landing,
        },
      };
    }

    position = next;
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

function landingKind(isTumble: boolean, techOnLanding: boolean): LandingKind {
  if (!isTumble) return 'land';
  return techOnLanding ? 'tech' : 'missed-tech';
}

function initialLaunchVelocity(input: LaunchInput, isTumble: boolean): Point {
  const speed = input.knockback * LAUNCH_SPEED_PER_KNOCKBACK;
  const radians = (input.angle * Math.PI) / 180;
  const velocity = { x: speed * Math.cos(radians), y: speed * Math.sin(radians) };
  if (!input.isGrounded || velocity.y >= 0) return velocity;

  // The floor stops a downward launch. Victims who don't tumble stay on the ground.
  // Tumbling victims bounce up off it when the launch points steeply enough into the
  // floor; a shallower one isn't reflected, so they land on the first frame.
  // Source: decomp ftCo_8008DCE0 (x1E8, x1EC), ikneedata getVerticalVelocity.
  if (!isTumble) velocity.y = 0;
  else if (degreesBelowFloor(velocity) > GROUND_BOUNCE_MIN_DEGREES) {
    velocity.y = -velocity.y * GROUND_BOUNCE_MULTIPLIER;
  }
  return velocity;
}

function degreesBelowFloor(velocity: Point): number {
  return (Math.atan2(-velocity.y, Math.abs(velocity.x)) * 180) / Math.PI;
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
