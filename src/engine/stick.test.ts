import { describe, expect, it } from 'vitest';
import { clampToUnitCircle, readStick, toRawStick } from './stick';

describe('readStick', () => {
  it('zeroes each axis inside the deadzone separately', () => {
    // 22/80 = 0.275 is inside the deadzone; 23/80 = 0.2875 is the first value outside it.
    expect(readStick({ x: 22 / 80, y: 0.9 })).toEqual({ x: 0, y: 0.9 });
    expect(readStick({ x: 23 / 80, y: -22 / 80 })).toEqual({ x: 0.2875, y: 0 });
  });

  it('snaps to the controller’s 1/80 steps', () => {
    expect(readStick({ x: 0.5004, y: 0 })).toEqual({ x: 40 / 80, y: 0 });
  });

  it('keeps the stick inside the unit circle', () => {
    const { x, y } = readStick({ x: 1, y: 1 });
    expect(x).toBeCloseTo(57 / 80, 6);
    expect(y).toBeCloseTo(57 / 80, 6);
  });
});

describe('toRawStick', () => {
  it('reports -80..80 values', () => {
    expect(toRawStick({ x: 1, y: 0 })).toEqual({ x: 80, y: 0 });
    expect(toRawStick({ x: 0.8, y: -0.5 })).toEqual({ x: 64, y: -40 });
    expect(toRawStick({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });
});

describe('clampToUnitCircle', () => {
  it('leaves positions inside the circle alone', () => {
    expect(clampToUnitCircle({ x: 0.3, y: 0.4 })).toEqual({ x: 0.3, y: 0.4 });
  });

  it('scales positions outside the circle back onto it', () => {
    const { x, y } = clampToUnitCircle({ x: 3, y: 4 });
    expect(x).toBeCloseTo(0.6, 9);
    expect(y).toBeCloseTo(0.8, 9);
  });
});
