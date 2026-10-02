import { clampToUnitCircle, readStick, type StickPosition } from '../../engine';

/**
 * Pure geometry for the on-screen joystick. Stick values run from -1 to 1 on each axis
 * with up positive, as the engine expects. The SVG is drawn in its own units, with
 * `GATE_RADIUS` units for a full tilt and y negated because SVG's y axis points down.
 */

/** SVG units from the center to a full tilt. */
export const GATE_RADIUS = 80;

/** Nudge sizes for the arrow keys: a tenth of a full tilt, or one controller step with Shift. */
export const KEY_STEP = 0.1;
export const FINE_KEY_STEP = 1 / 80;

/**
 * Corners of the octagonal gate. A GameCube gate has a notch at each of the eight
 * directions; the corners sit just outside the unit circle so its flat edges touch it.
 */
export function gateOctagonPoints(): string {
  const cornerRadius = GATE_RADIUS / Math.cos(Math.PI / 8);
  return Array.from({ length: 8 }, (_, index) => {
    const angle = (index * Math.PI) / 4;
    const x = cornerRadius * Math.cos(angle);
    const y = -cornerRadius * Math.sin(angle);
    return `${round(x)},${round(y)}`;
  }).join(' ');
}

/**
 * Converts a pointer position into a stick value. `bounds` is the on-screen box of the
 * joystick's drawing area, whose center is neutral and whose half-width is a full tilt.
 */
export function pointerToStick(
  clientX: number,
  clientY: number,
  bounds: { left: number; top: number; width: number; height: number },
  /** How many SVG units the drawing area spans from its center to its edge. */
  viewRadius: number,
): StickPosition {
  const halfWidth = bounds.width / 2;
  const halfHeight = bounds.height / 2;
  if (halfWidth === 0 || halfHeight === 0) return { x: 0, y: 0 };

  const unitsPerTilt = GATE_RADIUS / viewRadius;
  const x = (clientX - (bounds.left + halfWidth)) / halfWidth / unitsPerTilt;
  // Screen y grows downward and stick y grows upward, so measure from the pointer up.
  const y = (bounds.top + halfHeight - clientY) / halfHeight / unitsPerTilt;
  return clampToUnitCircle({ x, y });
}

/** Moves the stick by a step on each axis, staying inside the unit circle. */
export function nudgeStick(stick: StickPosition, dx: number, dy: number): StickPosition {
  return clampToUnitCircle({ x: stick.x + dx, y: stick.y + dy });
}

/** The stick's direction in degrees (0 = right, 90 = up), or null at neutral. */
export function stickAngleDegrees(stick: StickPosition): number | null {
  if (stick.x === 0 && stick.y === 0) return null;
  const degrees = (Math.atan2(stick.y, stick.x) * 180) / Math.PI;
  return (degrees + 360) % 360;
}

/** True when the game would read the stick as neutral, so it gives no DI. */
export function isInDeadzone(stick: StickPosition): boolean {
  const read = readStick(stick);
  return read.x === 0 && read.y === 0;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
