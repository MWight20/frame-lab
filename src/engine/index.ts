/**
 * Knockback, DI and launch engine. Pure TypeScript with no React, so the Trajectory Lab
 * and the tests share the same code.
 */
export { calculateKnockback, calculateHitstunFrames, causesTumble } from './knockback';
export type { KnockbackHitbox, KnockbackInput } from './knockback';
export { resolveLaunchAngle } from './launchAngle';
export type { LaunchAngleOptions } from './launchAngle';
export { simulateLaunch } from './simulateLaunch';
export type {
  BlastZoneSide,
  LaunchInput,
  LaunchOutcome,
  LaunchResult,
  Point,
  VictimPhysics,
} from './simulateLaunch';
export { findKillPercent, simulateHit } from './killPercent';
export type { HitResult, HitScenario } from './killPercent';
export { STICK_DEADZONE } from './constants';
export { NEUTRAL_STICK, clampToUnitCircle, readStick, toRawStick } from './stick';
export type { StickPosition } from './stick';
