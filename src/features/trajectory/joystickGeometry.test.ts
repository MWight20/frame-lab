import { describe, expect, it } from 'vitest';
import {
  gateOctagonPoints,
  isInDeadzone,
  nudgeStick,
  pointerToStick,
  stickAngleDegrees,
} from './joystickGeometry';

/** A 200 × 200 px drawing at (100, 50), showing ±100 SVG units, so full tilt is 80 px out. */
const BOUNDS = { left: 100, top: 50, width: 200, height: 200 };
const VIEW_RADIUS = 100;

describe('pointerToStick', () => {
  it('reads the center as neutral', () => {
    expect(pointerToStick(200, 150, BOUNDS, VIEW_RADIUS)).toEqual({ x: 0, y: 0 });
  });

  it('reads up as positive y', () => {
    const stick = pointerToStick(200, 150 - 80, BOUNDS, VIEW_RADIUS);
    expect(stick.x).toBeCloseTo(0, 9);
    expect(stick.y).toBeCloseTo(1, 9);
  });

  it('scales halfway out to half tilt', () => {
    const stick = pointerToStick(200 + 40, 150, BOUNDS, VIEW_RADIUS);
    expect(stick.x).toBeCloseTo(0.5, 9);
  });

  it('clamps a pointer past the gate to a full tilt', () => {
    const stick = pointerToStick(300, 250, BOUNDS, VIEW_RADIUS);
    expect(Math.hypot(stick.x, stick.y)).toBeCloseTo(1, 9);
    expect(stick.x).toBeCloseTo(-stick.y, 9);
  });

  it('returns neutral for an element with no size', () => {
    const empty = { left: 0, top: 0, width: 0, height: 0 };
    expect(pointerToStick(10, 10, empty, VIEW_RADIUS)).toEqual({ x: 0, y: 0 });
  });
});

describe('nudgeStick', () => {
  it('moves by the step and stays inside the unit circle', () => {
    expect(nudgeStick({ x: 0, y: 0 }, 0.1, 0)).toEqual({ x: 0.1, y: 0 });
    expect(nudgeStick({ x: 1, y: 0 }, 0.1, 0)).toEqual({ x: 1, y: 0 });
  });
});

describe('stickAngleDegrees', () => {
  it('measures counterclockwise from the right', () => {
    expect(stickAngleDegrees({ x: 1, y: 0 })).toBe(0);
    expect(stickAngleDegrees({ x: 0, y: 1 })).toBe(90);
    expect(stickAngleDegrees({ x: 0, y: -1 })).toBe(270);
  });

  it('is null at neutral', () => {
    expect(stickAngleDegrees({ x: 0, y: 0 })).toBeNull();
  });
});

describe('isInDeadzone', () => {
  it('uses the game’s per-axis deadzone', () => {
    expect(isInDeadzone({ x: 0.27, y: 0.27 })).toBe(true);
    expect(isInDeadzone({ x: 0.3, y: 0 })).toBe(false);
  });
});

describe('gateOctagonPoints', () => {
  it('has eight corners', () => {
    expect(gateOctagonPoints().split(' ')).toHaveLength(8);
  });
});
