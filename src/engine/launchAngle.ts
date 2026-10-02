import {
  MAX_DI_DEGREES,
  SAKURAI_AIRBORNE_ANGLE,
  SAKURAI_ANGLE,
  SAKURAI_GROUNDED_ANGLE,
  SAKURAI_GROUNDED_HIGH_KNOCKBACK,
  SAKURAI_GROUNDED_LOW_KNOCKBACK,
} from './constants';
import { causesTumble } from './knockback';
import { NEUTRAL_STICK, readStick, type StickPosition } from './stick';

export interface LaunchAngleOptions {
  knockback: number;
  isGrounded: boolean;
  /** The victim's stick on the last frame of hitlag. Neutral means no DI. */
  stick?: StickPosition;
  /**
   * True when the hit sends the victim left, for example when the attacker faces left.
   * Hitbox angles are written for an attacker facing right.
   */
  isReversed?: boolean;
}

/**
 * The final launch angle in degrees (0 = right, 90 = up, counterclockwise), after the
 * Sakurai angle, the attacker's facing and the victim's DI are applied. The result is
 * in the range [0, 360).
 */
export function resolveLaunchAngle(hitboxAngle: number, options: LaunchAngleOptions): number {
  const { knockback, isGrounded } = options;
  const facingAngle = sakuraiOrHitboxAngle(hitboxAngle, knockback, isGrounded);
  const launchAngle = options.isReversed ? 180 - facingAngle : facingAngle;

  if (!canDirectionalInfluence(launchAngle, knockback, isGrounded)) {
    return normalizeDegrees(launchAngle);
  }
  const stick = readStick(options.stick ?? NEUTRAL_STICK);
  return normalizeDegrees(launchAngle + diOffsetDegrees(launchAngle, stick));
}

/**
 * The Sakurai angle (361) depends on the victim. Grounded victims are sent along the floor
 * by weak hits and at 44° by strong ones; airborne victims always go at 45°.
 * Source: decomp ftCo_Damage_CalcAngle, https://www.ssbwiki.com/Sakurai_angle.
 */
function sakuraiOrHitboxAngle(hitboxAngle: number, knockback: number, isGrounded: boolean): number {
  if (hitboxAngle !== SAKURAI_ANGLE) return hitboxAngle;
  if (!isGrounded) return SAKURAI_AIRBORNE_ANGLE;
  if (knockback < SAKURAI_GROUNDED_LOW_KNOCKBACK) return 0;

  // The game ramps between the two thresholds. The ramp is only 0.1 knockback wide, so in
  // practice the angle jumps from 0° to 44°. The "+ 1" is in the game's code.
  const rampWidth = SAKURAI_GROUNDED_HIGH_KNOCKBACK - SAKURAI_GROUNDED_LOW_KNOCKBACK;
  const ramp =
    (SAKURAI_GROUNDED_ANGLE * (knockback - SAKURAI_GROUNDED_LOW_KNOCKBACK)) / rampWidth + 1;
  return Math.min(ramp, SAKURAI_GROUNDED_ANGLE);
}

/**
 * DI needs some knockback to rotate. A grounded victim hit straight sideways without enough
 * knockback to tumble slides along the floor and can't DI. Source: ikneedata getAngle; the
 * decomp sends this case down the ground-velocity path instead.
 */
function canDirectionalInfluence(angle: number, knockback: number, isGrounded: boolean): boolean {
  if (knockback <= 0) return false;
  const isAlongFloor = angle === 0 || angle === 180;
  return !(isGrounded && isAlongFloor && !causesTumble(knockback));
}

/**
 * DI rotates the launch toward the side the stick is held, by up to 18°. The effect grows
 * with the square of how far the stick points perpendicular to the launch, so holding
 * straight along the launch line does nothing. Holding the stick clockwise of the launch
 * rotates it clockwise. Source: decomp ftCo_8008E5A4, ikneedata getAngle.
 */
function diOffsetDegrees(launchAngle: number, stick: StickPosition): number {
  if (stick.x === 0 && stick.y === 0) return 0;

  const radians = (launchAngle * Math.PI) / 180;
  // Z of the cross product (launch direction × stick): |stick| × sin(angle between them).
  const perpendicular = Math.cos(radians) * stick.y - Math.sin(radians) * stick.x;
  // Snapping the stick to 1/80 steps can push it just past the unit circle; ikneedata caps
  // the result at 18° for that reason.
  const strength = Math.min(perpendicular * perpendicular, 1);
  return Math.sign(perpendicular) * strength * MAX_DI_DEGREES;
}

function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
