import { describe, expect, it } from 'vitest';
import { calculateHitstunFrames, calculateKnockback, causesTumble } from './knockback';

const MARTH_WEIGHT = 87;

/** Fox up smash, clean hit. */
const FOX_UP_SMASH = { damage: 18, baseKnockback: 30, knockbackGrowth: 112, setKnockback: 0 };

/** Fox up air, first hit: set knockback 30. */
const FOX_UP_AIR_HIT_1 = { damage: 5, baseKnockback: 0, knockbackGrowth: 120, setKnockback: 30 };

// Expected values come from running ikneedata's calculatormaths.js with the same inputs.
describe('calculateKnockback', () => {
  it('matches ikneedata for a scaling hit', () => {
    const knockback = calculateKnockback({
      hitbox: FOX_UP_SMASH,
      victimPercent: 79,
      victimWeight: MARTH_WEIGHT,
    });
    expect(knockback).toBeCloseTo(212.8295, 3);
  });

  it('adds the hit damage to the victim percent before scaling', () => {
    const atZero = calculateKnockback({
      hitbox: FOX_UP_SMASH,
      victimPercent: 0,
      victimWeight: MARTH_WEIGHT,
    });
    // p = 18 after the hit: ((1.8 + 16.2) * 200/187 * 1.4 + 18) * 1.12 + 30
    expect(atZero).toBeCloseTo(((1.8 + 16.2) * (200 / 187) * 1.4 + 18) * 1.12 + 30, 6);
  });

  it('drops the fraction of the victim percent, as the game does', () => {
    const whole = calculateKnockback({ hitbox: FOX_UP_SMASH, victimPercent: 79, victimWeight: 87 });
    const fraction = calculateKnockback({
      hitbox: FOX_UP_SMASH,
      victimPercent: 79.9,
      victimWeight: 87,
    });
    expect(fraction).toBe(whole);
  });

  it('gives lighter victims more knockback', () => {
    const light = calculateKnockback({ hitbox: FOX_UP_SMASH, victimPercent: 50, victimWeight: 60 });
    const heavy = calculateKnockback({
      hitbox: FOX_UP_SMASH,
      victimPercent: 50,
      victimWeight: 120,
    });
    expect(light).toBeGreaterThan(heavy);
  });

  it('uses set knockback regardless of percent, but still uses weight', () => {
    const atZero = calculateKnockback({
      hitbox: FOX_UP_AIR_HIT_1,
      victimPercent: 0,
      victimWeight: MARTH_WEIGHT,
    });
    const atHigh = calculateKnockback({
      hitbox: FOX_UP_AIR_HIT_1,
      victimPercent: 150,
      victimWeight: MARTH_WEIGHT,
    });
    const onLighter = calculateKnockback({
      hitbox: FOX_UP_AIR_HIT_1,
      victimPercent: 0,
      victimWeight: 60,
    });

    expect(atZero).toBeCloseTo(50.3487, 3);
    expect(atHigh).toBe(atZero);
    expect(onLighter).toBeGreaterThan(atZero);
  });

  it('uses staled damage for the percent but full damage for d', () => {
    // Used 3 times in a row: 1 - (0.09 + 0.08 + 0.07) = 0.76, so 18 becomes 13.68.
    const knockback = calculateKnockback({
      hitbox: FOX_UP_SMASH,
      victimPercent: 79,
      victimWeight: MARTH_WEIGHT,
      staleUses: 3,
    });
    const p = 79 + 18 * 0.76;
    const d = 18;
    const expected = ((p / 10 + (p * d) / 20) * (200 / 187) * 1.4 + 18) * 1.12 + 30;
    expect(knockback).toBeCloseTo(expected, 6);
    expect(knockback).toBeLessThan(212.8295);
  });

  it('ignores staleness for set knockback', () => {
    const fresh = calculateKnockback({
      hitbox: FOX_UP_AIR_HIT_1,
      victimPercent: 50,
      victimWeight: MARTH_WEIGHT,
    });
    const stale = calculateKnockback({
      hitbox: FOX_UP_AIR_HIT_1,
      victimPercent: 50,
      victimWeight: MARTH_WEIGHT,
      staleUses: 9,
    });
    expect(stale).toBe(fresh);
  });

  it('applies crouch cancel to set knockback too', () => {
    const crouched = calculateKnockback({
      hitbox: FOX_UP_AIR_HIT_1,
      victimPercent: 50,
      victimWeight: MARTH_WEIGHT,
      isCrouching: true,
    });
    // ikneedata uses 0.667 (33.5826); the game's 2/3 gives slightly less.
    expect(crouched).toBeCloseTo(50.348663 * (2 / 3), 4);
  });

  it('uses weight 100 for throws', () => {
    const throwOnLight = calculateKnockback({
      hitbox: FOX_UP_SMASH,
      victimPercent: 50,
      victimWeight: 60,
      isThrow: true,
    });
    const throwOnHeavy = calculateKnockback({
      hitbox: FOX_UP_SMASH,
      victimPercent: 50,
      victimWeight: 120,
      isThrow: true,
    });
    expect(throwOnLight).toBe(throwOnHeavy);
  });

  it('caps knockback at 2500', () => {
    const knockback = calculateKnockback({
      hitbox: { damage: 50, baseKnockback: 100, knockbackGrowth: 200, setKnockback: 0 },
      victimPercent: 999,
      victimWeight: 60,
    });
    expect(knockback).toBe(2500);
  });
});

describe('calculateHitstunFrames', () => {
  it('is knockback × 0.4, rounded down', () => {
    expect(calculateHitstunFrames(212.8295)).toBe(85);
    expect(calculateHitstunFrames(50.3487)).toBe(20);
    expect(calculateHitstunFrames(0)).toBe(0);
  });
});

describe('causesTumble', () => {
  it('starts at exactly 80 knockback', () => {
    expect(causesTumble(79.999)).toBe(false);
    expect(causesTumble(80)).toBe(true);
  });
});
