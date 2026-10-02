import type { LaunchOutcome } from '../../engine';
import type { LabResult } from './labScenario';
import classes from './trajectory.module.css';

interface ResultCardProps {
  title: string;
  result: LabResult;
}

/** One launch's numbers: outcome, angle, knockback, hitstun and the kill percent. */
export function ResultCard({ title, result }: ResultCardProps) {
  const { hit, killPercent } = result;
  const isKo = hit.outcome.type === 'ko';
  const isKoAfterHitstun = hit.outcome.type === 'ko' && hit.outcome.frame > hit.hitstunFrames;

  return (
    <section className={classes.resultCard} data-ko={isKo || undefined} aria-label={title}>
      <h3 className={classes.resultTitle}>{title}</h3>
      <p className={classes.outcome}>{describeOutcome(hit.outcome)}</p>
      <dl className={classes.resultList}>
        <dt>Launch angle</dt>
        <dd>{hit.angle.toFixed(1)}°</dd>
        <dt>Knockback</dt>
        <dd>{hit.knockback.toFixed(1)}</dd>
        <dt>Hitstun</dt>
        <dd>
          {hit.hitstunFrames} frames{hit.isTumble ? ', tumble' : ''}
        </dd>
        <dt>Kills from here at</dt>
        <dd>{killPercent === null ? 'Never' : `${killPercent}%`}</dd>
      </dl>
      {isKoAfterHitstun && (
        <p className={classes.resultNote}>
          The KO comes after hitstun ends on frame {hit.hitstunFrames}, so the victim could act
          first.
        </p>
      )}
    </section>
  );
}

function describeOutcome(outcome: LaunchOutcome): string {
  if (outcome.type === 'survives') return 'Survives';
  return `KO through the ${outcome.side} blast zone, frame ${outcome.frame}`;
}
