import type { KeyboardEvent } from 'react';
import type { Point } from '../../engine';
import classes from './trajectory.module.css';

/** Game units per arrow-key press, and with Shift held. */
const KEY_STEP = 1;
const LARGE_KEY_STEP = 10;

const ARROW_DIRECTIONS: Record<string, [number, number]> = {
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

interface VictimPinProps {
  position: Point;
  /** Called with a new position when an arrow key moves the pin. */
  onMove: (position: Point) => void;
  /** Id of the text describing where the pin is, for screen readers. */
  describedBy: string;
}

/**
 * Marks where the victim stands when the hit lands. Pointer drags are handled by the
 * stage drawing (pressing anywhere moves the pin there); this element handles focus and
 * the arrow keys.
 */
export function VictimPin({ position, onMove, describedBy }: VictimPinProps) {
  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    const direction = ARROW_DIRECTIONS[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? LARGE_KEY_STEP : KEY_STEP;
    onMove({ x: position.x + direction[0] * step, y: position.y + direction[1] * step });
  }

  const x = position.x;
  const y = -position.y;

  return (
    <g
      className={classes.pin}
      tabIndex={0}
      role="application"
      aria-roledescription="draggable pin"
      aria-label="Victim position"
      aria-describedby={describedBy}
      onKeyDown={handleKeyDown}
    >
      {/* A larger invisible circle makes the pin easier to grab. */}
      <circle className={classes.pinHitArea} cx={x} cy={y} r={10} />
      <line className={classes.pinStem} x1={x} y1={y} x2={x} y2={y - 12} />
      <circle className={classes.pinHead} cx={x} cy={y - 12} r={4} />
      <circle className={classes.victimDot} cx={x} cy={y} r={2.6} />
    </g>
  );
}
