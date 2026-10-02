import { useRef, type PointerEvent, type ReactNode } from 'react';
import type { Stage } from '../../data/types';
import type { Point } from '../../engine';
import classes from './trajectory.module.css';

const PADDING = 12;

interface StageViewProps {
  stage: Stage;
  /** Drawn on top of the stage, in game units with y already negated by the caller. */
  children?: ReactNode;
  /** Called with a game-unit point when the stage is pressed or dragged on. */
  onPointPicked?: (point: Point) => void;
}

/**
 * Draws a stage in game units. SVG's y axis points down and the game's points up,
 * so every y value is negated when drawn. The underside of the main stage is a
 * generic shape for readability; only its top surface and edges are real geometry.
 */
export function StageView({ stage, children, onPointPicked }: StageViewProps) {
  const isDragging = useRef(false);
  const { left, right, top, bottom } = stage.blastZones;
  const viewBox = [
    left - PADDING,
    -top - PADDING,
    right - left + PADDING * 2,
    top - bottom + PADDING * 2,
  ].join(' ');

  const edge = stage.edgeX;
  const underside = [
    [-edge, 0],
    [edge, 0],
    [edge * 0.93, 8],
    [edge * 0.68, 30],
    [-edge * 0.68, 30],
    [-edge * 0.93, 8],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(' ');

  function pickPoint(event: PointerEvent<SVGSVGElement>) {
    const point = toGamePoint(event.currentTarget, event.clientX, event.clientY);
    if (point) onPointPicked?.(point);
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!onPointPicked) return;
    isDragging.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pickPoint(event);
  }

  return (
    <svg
      className={classes.stage}
      data-interactive={onPointPicked ? true : undefined}
      viewBox={viewBox}
      // A group rather than an image, so the focusable pin inside stays reachable.
      role="group"
      aria-label={`${stage.name}: blast zones ${left} to ${right} wide, ${top} high, ${bottom} low`}
      onPointerDown={handlePointerDown}
      onPointerMove={(event) => isDragging.current && pickPoint(event)}
      onPointerUp={() => (isDragging.current = false)}
      onPointerCancel={() => (isDragging.current = false)}
    >
      <rect
        className={classes.blastZone}
        x={left}
        y={-top}
        width={right - left}
        height={top - bottom}
      />
      <text className={classes.blastLabel} x={left + 4} y={-top + 12}>
        Top {top}
      </text>
      <text className={classes.blastLabel} x={left + 4} y={-bottom - 5}>
        Bottom {bottom}
      </text>
      <text className={classes.blastLabel} x={right - 4} y={-top + 12} textAnchor="end">
        Sides {left} / {right}
      </text>

      <polygon className={classes.stageBody} points={underside} />
      <line className={classes.surface} x1={-edge} y1={0} x2={edge} y2={0} />

      {stage.platforms.map((platform) => (
        <line
          key={`${platform.left}:${platform.y}`}
          className={classes.surface}
          data-moving={platform.isMoving || undefined}
          x1={platform.left}
          y1={-platform.y}
          x2={platform.right}
          y2={-platform.y}
        />
      ))}

      {children}
    </svg>
  );
}

/**
 * Converts a screen position to game units using the SVG's own transform, which accounts
 * for the viewBox and any letterboxing. Returns null where layout isn't available (tests).
 */
function toGamePoint(svg: SVGSVGElement, clientX: number, clientY: number): Point | null {
  const toScreen = svg.getScreenCTM?.();
  if (!toScreen) return null;
  const inSvg = new DOMPoint(clientX, clientY).matrixTransform(toScreen.inverse());
  return { x: inSvg.x, y: -inSvg.y };
}
