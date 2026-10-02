import { STICK_DEADZONE, STICK_RAW_MAX } from './constants';

/** A control stick position. Each axis runs from -1 to 1; up and right are positive. */
export interface StickPosition {
  x: number;
  y: number;
}

export const NEUTRAL_STICK: StickPosition = { x: 0, y: 0 };

/**
 * Converts a stick position to what the game reads: kept inside the unit circle, snapped
 * to the controller's 1/80 steps, and with each axis inside the deadzone set to zero.
 */
export function readStick(stick: StickPosition): StickPosition {
  const clamped = clampToUnitCircle(stick);
  return {
    x: applyDeadzone(snapToRawStep(clamped.x)),
    y: applyDeadzone(snapToRawStep(clamped.y)),
  };
}

/** The raw -80..80 values a controller would report for this position. */
export function toRawStick(stick: StickPosition): StickPosition {
  const clamped = clampToUnitCircle(stick);
  return {
    x: Math.round(clamped.x * STICK_RAW_MAX),
    y: Math.round(clamped.y * STICK_RAW_MAX),
  };
}

export function clampToUnitCircle(stick: StickPosition): StickPosition {
  const magnitude = Math.hypot(stick.x, stick.y);
  if (magnitude <= 1) return stick;
  return { x: stick.x / magnitude, y: stick.y / magnitude };
}

function snapToRawStep(axis: number): number {
  return Math.round(axis * STICK_RAW_MAX) / STICK_RAW_MAX;
}

function applyDeadzone(axis: number): number {
  return Math.abs(axis) < STICK_DEADZONE ? 0 : axis;
}
