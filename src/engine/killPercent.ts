import type { Stage } from '../data/types';
import { calculateKnockback, type KnockbackHitbox } from './knockback';
import { resolveLaunchAngle } from './launchAngle';
import {
  simulateLaunch,
  type LaunchResult,
  type Point,
  type VictimPhysics,
} from './simulateLaunch';
import type { StickPosition } from './stick';

export interface HitScenario {
  hitbox: KnockbackHitbox & { angle: number };
  victim: VictimPhysics & { weight: number };
  stage: Pick<Stage, 'blastZones'>;
  start: Point;
  isGrounded: boolean;
  isCrouching?: boolean;
  isReversed?: boolean;
  /** Throws use a fixed weight of 100 for knockback. */
  isThrow?: boolean;
  stick?: StickPosition;
}

/** A launch plus the knockback and final angle that produced it. */
export interface HitResult extends LaunchResult {
  knockback: number;
  /** Launch angle in degrees after the Sakurai angle, facing and DI. */
  angle: number;
}

/** Runs the whole chain for one hit: knockback, launch angle, then the flight. */
export function simulateHit(scenario: HitScenario, victimPercent: number): HitResult {
  const knockback = calculateKnockback({
    hitbox: scenario.hitbox,
    victimPercent,
    victimWeight: scenario.victim.weight,
    isCrouching: scenario.isCrouching,
    isThrow: scenario.isThrow,
  });
  const angle = resolveLaunchAngle(scenario.hitbox.angle, {
    knockback,
    isGrounded: scenario.isGrounded,
    stick: scenario.stick,
    isReversed: scenario.isReversed,
  });
  const launch = simulateLaunch({
    knockback,
    angle,
    start: scenario.start,
    victim: scenario.victim,
    stage: scenario.stage,
    isGrounded: scenario.isGrounded,
  });
  return { ...launch, knockback, angle };
}

/**
 * The lowest whole percent (before the hit) at which this hit KOs, or null if it never
 * does up to 999%. Checks every percent in turn because the answer is not always
 * monotonic: the Sakurai angle and grounded rules change the angle as knockback grows.
 */
export function findKillPercent(scenario: HitScenario): number | null {
  for (let percent = 0; percent <= 999; percent += 1) {
    if (simulateHit(scenario, percent).outcome.type === 'ko') return percent;
  }
  return null;
}
