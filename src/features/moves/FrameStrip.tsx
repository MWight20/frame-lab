import type { Move } from '../../data/types';
import { buildFrameTimeline, type FramePhase } from './frameTimeline';
import classes from './moves.module.css';

const PHASE_LABELS: Record<FramePhase, string> = {
  startup: 'Startup',
  active: 'Active',
  gap: 'Between hits',
  recovery: 'Recovery',
  interruptible: 'Interruptible (IASA)',
};

interface FrameStripProps {
  move: Move;
  /** Frame the clip is showing, outlined in the strip. */
  currentFrame: number | null;
}

/** One cell per frame of the move, colored by what the move is doing on that frame. */
export function FrameStrip({ move, currentFrame }: FrameStripProps) {
  const timeline = buildFrameTimeline(move);
  if (timeline.length === 0) {
    return <p className={classes.note}>Total frame count is not in the data for this move.</p>;
  }

  const phasesPresent = Object.keys(PHASE_LABELS).filter((phase) =>
    timeline.some((frame) => frame.phase === phase),
  ) as FramePhase[];

  return (
    <div>
      <div
        className={classes.strip}
        style={{ gridTemplateColumns: `repeat(${timeline.length}, minmax(0, 1fr))` }}
        role="img"
        aria-label={describeTimeline(timeline.length, move)}
      >
        {timeline.map(({ frame, phase }) => (
          <div
            key={frame}
            className={classes.frameCell}
            data-phase={phase}
            data-current={frame === currentFrame || undefined}
            title={`Frame ${frame}: ${PHASE_LABELS[phase]}`}
          />
        ))}
      </div>
      <div className={classes.legend} style={{ marginTop: 8 }}>
        {phasesPresent.map((phase) => (
          <span key={phase} className={classes.legendItem}>
            <span className={`${classes.swatch} ${classes.frameCell}`} data-phase={phase} />
            {PHASE_LABELS[phase]}
          </span>
        ))}
      </div>
    </div>
  );
}

function describeTimeline(totalFrames: number, move: Move): string {
  const active =
    move.firstActiveFrame !== null ? `, first active on frame ${move.firstActiveFrame}` : '';
  return `${totalFrames} frame timeline${active}`;
}
