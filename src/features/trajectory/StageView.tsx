import type { Stage } from '../../data/types';
import classes from './trajectory.module.css';

const PADDING = 12;

/**
 * Draws a stage in game units. SVG's y axis points down and the game's points up,
 * so every y value is negated when drawn. The underside of the main stage is a
 * generic shape for readability; only its top surface and edges are real geometry.
 */
export function StageView({ stage }: { stage: Stage }) {
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

  return (
    <svg
      className={classes.stage}
      viewBox={viewBox}
      role="img"
      aria-label={`${stage.name}: blast zones ${left} to ${right} wide, ${top} high, ${bottom} low`}
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
    </svg>
  );
}
