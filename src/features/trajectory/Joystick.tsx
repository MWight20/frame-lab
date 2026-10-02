import { Button, Switch } from '@mantine/core';
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { NEUTRAL_STICK, STICK_DEADZONE, toRawStick, type StickPosition } from '../../engine';
import {
  FINE_KEY_STEP,
  GATE_RADIUS,
  KEY_STEP,
  gateOctagonPoints,
  isInDeadzone,
  nudgeStick,
  pointerToStick,
  stickAngleDegrees,
} from './joystickGeometry';
import classes from './joystick.module.css';

/** SVG units from the center to the edge of the drawing, leaving room for the gate. */
const VIEW_RADIUS = 100;
const VIEW_BOX = `${-VIEW_RADIUS} ${-VIEW_RADIUS} ${VIEW_RADIUS * 2} ${VIEW_RADIUS * 2}`;
const KNOB_RADIUS = 14;
const DEADZONE_HALF_WIDTH = STICK_DEADZONE * GATE_RADIUS;
const GATE_POINTS = gateOctagonPoints();

const ARROW_DIRECTIONS: Record<string, [number, number]> = {
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

export interface JoystickProps {
  /** Stick position, each axis -1 to 1, up positive. */
  value: StickPosition;
  onChange: (value: StickPosition) => void;
  label?: string;
}

/**
 * An on-screen GameCube control stick for choosing DI. Drag the knob with a mouse or
 * finger, or focus it and use the arrow keys (Shift for single controller steps). The
 * stick returns to neutral when released unless "Hold position" is on, the way a real
 * stick springs back.
 */
export function Joystick({ value, onChange, label = 'DI stick' }: JoystickProps) {
  const [isHeld, setHeld] = useState(false);
  const isDragging = useRef(false);
  const readoutId = useId();

  function moveToPointer(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    onChange(pointerToStick(event.clientX, event.clientY, bounds, VIEW_RADIUS));
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    isDragging.current = true;
    // Capturing keeps the drag going when the pointer leaves the drawing.
    event.currentTarget.setPointerCapture?.(event.pointerId);
    moveToPointer(event);
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (isDragging.current) moveToPointer(event);
  }

  function handlePointerEnd() {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (!isHeld) onChange(NEUTRAL_STICK);
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    const direction = ARROW_DIRECTIONS[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? FINE_KEY_STEP : KEY_STEP;
    onChange(nudgeStick(value, direction[0] * step, direction[1] * step));
  }

  const knobX = value.x * GATE_RADIUS;
  const knobY = -value.y * GATE_RADIUS;

  return (
    <div className={classes.joystick}>
      <svg
        className={classes.pad}
        viewBox={VIEW_BOX}
        tabIndex={0}
        role="application"
        aria-roledescription="joystick"
        aria-label={label}
        aria-describedby={readoutId}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onKeyDown={handleKeyDown}
      >
        <polygon className={classes.gate} points={GATE_POINTS} />
        {/* The game zeroes each axis separately inside the deadzone, so the area that reads
            as fully neutral is a square, not a circle. */}
        <rect
          className={classes.deadzone}
          x={-DEADZONE_HALF_WIDTH}
          y={-DEADZONE_HALF_WIDTH}
          width={DEADZONE_HALF_WIDTH * 2}
          height={DEADZONE_HALF_WIDTH * 2}
        />
        <line className={classes.crosshair} x1={-GATE_RADIUS} y1={0} x2={GATE_RADIUS} y2={0} />
        <line className={classes.crosshair} x1={0} y1={-GATE_RADIUS} x2={0} y2={GATE_RADIUS} />
        <line className={classes.shaft} x1={0} y1={0} x2={knobX} y2={knobY} />
        <circle className={classes.knob} cx={knobX} cy={knobY} r={KNOB_RADIUS} />
      </svg>

      <StickReadout id={readoutId} value={value} />

      <div className={classes.controls}>
        <Switch
          label="Hold position"
          size="sm"
          checked={isHeld}
          onChange={(event) => setHeld(event.currentTarget.checked)}
        />
        <Button size="compact-sm" variant="default" onClick={() => onChange(NEUTRAL_STICK)}>
          Reset to neutral
        </Button>
      </div>
    </div>
  );
}

/** Shows the stick's angle and the raw values a controller would report. */
function StickReadout({ id, value }: { id: string; value: StickPosition }) {
  const raw = toRawStick(value);
  const angle = stickAngleDegrees(value);
  const direction = angle === null ? 'Neutral' : `${Math.round(angle)}°`;

  return (
    <p className={classes.readout} id={id} aria-live="polite">
      <span>{direction}</span>
      <span>
        x {raw.x} · y {raw.y}
      </span>
      {angle !== null && isInDeadzone(value) && <span className={classes.note}>in deadzone</span>}
    </p>
  );
}
