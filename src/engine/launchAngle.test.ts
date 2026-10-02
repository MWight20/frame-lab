import { describe, expect, it } from 'vitest';
import { resolveLaunchAngle } from './launchAngle';

const STRONG = 150;

describe('resolveLaunchAngle', () => {
  it('returns the hitbox angle with no DI', () => {
    expect(resolveLaunchAngle(80, { knockback: STRONG, isGrounded: true })).toBe(80);
  });

  it('mirrors the angle when the hit is reversed', () => {
    expect(resolveLaunchAngle(80, { knockback: STRONG, isGrounded: true, isReversed: true })).toBe(
      100,
    );
  });

  describe('Sakurai angle (361)', () => {
    it('sends grounded victims along the floor below 32 knockback', () => {
      expect(resolveLaunchAngle(361, { knockback: 31.9, isGrounded: true })).toBe(0);
    });

    it('sends grounded victims at 44° from 32.1 knockback up', () => {
      expect(resolveLaunchAngle(361, { knockback: 32.1, isGrounded: true })).toBe(44);
      expect(resolveLaunchAngle(361, { knockback: STRONG, isGrounded: true })).toBe(44);
    });

    it('ramps between 32 and 32.1 as the game does', () => {
      expect(resolveLaunchAngle(361, { knockback: 32.05, isGrounded: true })).toBeCloseTo(23, 6);
    });

    it('sends airborne victims at 45° whatever the knockback', () => {
      expect(resolveLaunchAngle(361, { knockback: 10, isGrounded: false })).toBe(45);
      expect(resolveLaunchAngle(361, { knockback: STRONG, isGrounded: false })).toBe(45);
    });

    it('mirrors to 136° when reversed', () => {
      const options = { knockback: STRONG, isGrounded: true, isReversed: true };
      expect(resolveLaunchAngle(361, options)).toBe(136);
    });
  });

  describe('DI', () => {
    it('rotates by the full 18° when the stick is perpendicular', () => {
      const towardLeft = resolveLaunchAngle(90, {
        knockback: STRONG,
        isGrounded: false,
        stick: { x: -1, y: 0 },
      });
      const towardRight = resolveLaunchAngle(90, {
        knockback: STRONG,
        isGrounded: false,
        stick: { x: 1, y: 0 },
      });
      expect(towardLeft).toBeCloseTo(108, 6);
      expect(towardRight).toBeCloseTo(72, 6);
    });

    it('does nothing when the stick points along the launch', () => {
      const options = { knockback: STRONG, isGrounded: false };
      expect(resolveLaunchAngle(90, { ...options, stick: { x: 0, y: 1 } })).toBeCloseTo(90, 6);
      expect(resolveLaunchAngle(90, { ...options, stick: { x: 0, y: -1 } })).toBeCloseTo(90, 6);
    });

    it('scales with the square of the perpendicular amount', () => {
      // Half the stick sideways gives a quarter of the rotation: 18 × 0.5² = 4.5°.
      const angle = resolveLaunchAngle(90, {
        knockback: STRONG,
        isGrounded: false,
        stick: { x: 0.5, y: 0 },
      });
      expect(angle).toBeCloseTo(85.5, 6);
    });

    it('ignores a stick inside the deadzone', () => {
      const angle = resolveLaunchAngle(90, {
        knockback: STRONG,
        isGrounded: false,
        stick: { x: 0.27, y: -0.27 },
      });
      expect(angle).toBe(90);
    });

    it('wraps the result into 0..360', () => {
      // A 0° launch DI'd down rotates clockwise past 0.
      const angle = resolveLaunchAngle(0, {
        knockback: STRONG,
        isGrounded: false,
        stick: { x: 0, y: -1 },
      });
      expect(angle).toBeCloseTo(342, 6);
    });

    it('is not possible on a grounded floor-level hit that doesn’t tumble', () => {
      const angle = resolveLaunchAngle(361, {
        knockback: 20,
        isGrounded: true,
        stick: { x: 0, y: 1 },
      });
      expect(angle).toBe(0);
    });

    it('does nothing with zero knockback', () => {
      const angle = resolveLaunchAngle(45, {
        knockback: 0,
        isGrounded: false,
        stick: { x: 1, y: -1 },
      });
      expect(angle).toBe(45);
    });
  });
});
