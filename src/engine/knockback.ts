import {
  CROUCH_CANCEL_MULTIPLIER,
  HITSTUN_PER_KNOCKBACK,
  MAX_KNOCKBACK,
  THROW_WEIGHT,
  TUMBLE_THRESHOLD,
} from './constants';

/** The hitbox values that decide knockback. These match the fields on `Hitbox`. */
export interface KnockbackHitbox {
  damage: number;
  baseKnockback: number;
  knockbackGrowth: number;
  /** Non-zero means set knockback: the result no longer depends on the victim's percent. */
  setKnockback: number;
}

export interface KnockbackInput {
  hitbox: KnockbackHitbox;
  /** The victim's percent before this hit lands, as shown on screen. */
  victimPercent: number;
  victimWeight: number;
  isCrouching?: boolean;
  /** Throws use a fixed weight of 100 whatever the victim weighs. */
  isThrow?: boolean;
}

/**
 * Knockback dealt by one hitbox, following the decomp's ftColl_80079AB0 and SmashWiki
 * (https://www.ssbwiki.com/Knockback):
 *
 *   kb = (((p/10 + p*d/20) * 200/(w+100) * 1.4) + 18) * s/100 + b
 *
 * where p is the victim's percent after the hit, d the hit's damage, w the weight,
 * s the knockback growth and b the base knockback. The knockback ratio (handicap and
 * the damage-ratio rule) is 1 in normal play, so it is left out. Stale-move negation
 * is not modelled yet, so staled and unstaled damage are the same.
 */
export function calculateKnockback(input: KnockbackInput): number {
  const { hitbox } = input;
  const weight = input.isThrow ? THROW_WEIGHT : input.victimWeight;

  const raw =
    hitbox.setKnockback > 0
      ? setKnockbackFormula(hitbox, weight)
      : scalingKnockbackFormula(hitbox, weight, input.victimPercent);

  // Crouch cancel is applied after the formula in the game, so it affects set knockback too.
  const afterCrouch = input.isCrouching ? raw * CROUCH_CANCEL_MULTIPLIER : raw;
  return Math.min(afterCrouch, MAX_KNOCKBACK);
}

function scalingKnockbackFormula(
  hitbox: KnockbackHitbox,
  weight: number,
  percentBeforeHit: number,
): number {
  // The game drops any fraction of the victim's percent before adding this hit's damage.
  const percentAfterHit = Math.floor(percentBeforeHit) + hitbox.damage;
  const damageTerm = percentAfterHit / 10 + (percentAfterHit * hitbox.damage) / 20;
  return applyWeightAndGrowth(damageTerm, hitbox, weight);
}

/**
 * Set knockback ("weight-dependent set knockback") swaps the damage term for a fixed one:
 * the formula behaves as if the victim had 10% and the hit dealt `setKnockback` damage.
 * The victim's weight still counts. Melee has no separate weight-independent flag, so
 * `isWeightIndependent` in the data is just another name for this case.
 * Source: decomp ftColl_80079AB0 (x118 = 10), ikneedata getKnockback.
 */
function setKnockbackFormula(hitbox: KnockbackHitbox, weight: number): number {
  const damageTerm = 1 + (hitbox.setKnockback * 10) / 20;
  return applyWeightAndGrowth(damageTerm, hitbox, weight);
}

function applyWeightAndGrowth(damageTerm: number, hitbox: KnockbackHitbox, weight: number): number {
  const weightFactor = 200 / (weight + 100);
  return (
    (damageTerm * weightFactor * 1.4 + 18) * (hitbox.knockbackGrowth / 100) + hitbox.baseKnockback
  );
}

/**
 * Frames the victim spends in hitstun. The game truncates, which is the same as rounding
 * down for the positive values knockback takes. Source: decomp ftCo_8008DCE0.
 */
export function calculateHitstunFrames(knockback: number): number {
  return Math.floor(knockback * HITSTUN_PER_KNOCKBACK);
}

/** Tumbling victims can't act until they tech, land or input something after hitstun. */
export function causesTumble(knockback: number): boolean {
  return knockback >= TUMBLE_THRESHOLD;
}
