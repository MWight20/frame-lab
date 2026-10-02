import type { HitResult, Point } from '../../engine';
import classes from './trajectory.module.css';

interface LaunchOverlayProps {
  noDi: HitResult;
  withDi: HitResult;
}

/**
 * Draws both launches on the stage: the no-DI path faintly behind, the DI path on top
 * with a dot for each frame of hitstun, a ring where hitstun ends, and a cross where a
 * blast zone is crossed. Coordinates are game units with y negated for SVG.
 */
export function LaunchOverlay({ noDi, withDi }: LaunchOverlayProps) {
  const hitstunDots = withDi.path.slice(1, withDi.hitstunFrames + 1);
  const hitstunEnd = withDi.path[withDi.hitstunFrames];

  return (
    <g aria-hidden="true">
      <polyline className={classes.ghostPath} points={toPolyline(noDi.path)} />
      {noDi.outcome.type === 'ko' && (
        <KoMarker point={noDi.outcome.position} className={classes.ghostKo} />
      )}

      <polyline className={classes.diPath} points={toPolyline(withDi.path)} />
      {hitstunDots.map((point, index) => (
        <circle key={index} className={classes.frameDot} cx={point.x} cy={-point.y} r={1.1} />
      ))}
      {hitstunEnd && withDi.hitstunFrames > 0 && (
        <circle className={classes.hitstunRing} cx={hitstunEnd.x} cy={-hitstunEnd.y} r={5} />
      )}
      {withDi.outcome.type === 'ko' && (
        <KoMarker point={withDi.outcome.position} className={classes.koMarker} />
      )}
    </g>
  );
}

function KoMarker({ point, className }: { point: Point; className?: string }) {
  const size = 6;
  const x = point.x;
  const y = -point.y;
  return (
    <g className={className}>
      <line x1={x - size} y1={y - size} x2={x + size} y2={y + size} />
      <line x1={x - size} y1={y + size} x2={x + size} y2={y - size} />
    </g>
  );
}

function toPolyline(path: Point[]): string {
  return path.map((point) => `${round(point.x)},${round(-point.y)}`).join(' ');
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
