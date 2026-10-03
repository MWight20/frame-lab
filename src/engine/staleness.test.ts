import { describe, expect, it } from 'vitest';
import { staledDamage, staleMultiplier } from './staleness';

describe('staleMultiplier', () => {
  it('is 1 for a fresh move, with no freshness bonus', () => {
    expect(staleMultiplier(0)).toBe(1);
  });

  it('takes 0.09, then 0.08, and so on, for each recent use', () => {
    expect(staleMultiplier(1)).toBeCloseTo(0.91, 10);
    expect(staleMultiplier(2)).toBeCloseTo(0.83, 10);
    expect(staleMultiplier(3)).toBeCloseTo(0.76, 10);
  });

  it('bottoms out at 0.55 once the move fills all 9 slots', () => {
    expect(staleMultiplier(9)).toBeCloseTo(0.55, 10);
    expect(staleMultiplier(20)).toBeCloseTo(0.55, 10);
  });

  it('treats out-of-range input as the nearest valid count', () => {
    expect(staleMultiplier(-2)).toBe(1);
    expect(staleMultiplier(2.7)).toBeCloseTo(0.83, 10);
  });
});

describe('staledDamage', () => {
  it('keeps the fraction', () => {
    expect(staledDamage(18, 1)).toBeCloseTo(16.38, 10);
  });
});
