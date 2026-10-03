import type { LandingKind, LaunchOutcome } from '../../engine';
import type { LabResult } from './labScenario';
import classes from './trajectory.module.css';

interface ResultCardProps {
  title: string;
  result: LabResult;
}

/** One launch's numbers: outcome, damage, angle, knockback, hitstun and the kill percent. */
export function ResultCard({ title, result }: ResultCardProps) {
  const { hit, killPercent } = result;
  const isKo = hit.outcome.type === 'ko';
  const lateEvent = describeEventAfterHitstun(hit.outcome, hit.hitstunFrames);

  return (
    <section className={classes.resultCard} data-ko={isKo || undefined} aria-label={title}>
      <h3 className={classes.resultTitle}>{title}</h3>
      <p className={classes.outcome}>{describeOutcome(hit.outcome)}</p>
      <dl className={classes.resultList}>
        <dt>Damage</dt>
        <dd>{formatPercent(hit.damage)}</dd>
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
      {lateEvent && (
        <p className={classes.resultNote}>
          The {lateEvent} comes after hitstun ends on frame {hit.hitstunFrames}, so the victim could
          act first.
        </p>
      )}
    </section>
  );
}

const LANDING_DESCRIPTIONS: Record<LandingKind, string> = {
  tech: 'techs',
  'missed-tech': 'missed tech',
  land: 'lands',
};

function describeOutcome(outcome: LaunchOutcome): string {
  switch (outcome.type) {
    case 'survives':
      return 'Survives';
    case 'lands': {
      const surface = outcome.surfaceName.toLowerCase();
      const how = LANDING_DESCRIPTIONS[outcome.landing];
      return `Lands on the ${surface}, frame ${outcome.frame} (${how})`;
    }
    case 'ko':
      return `KO through the ${outcome.side} blast zone, frame ${outcome.frame}`;
  }
}

/** "KO" or "landing" when it happens after hitstun ends, otherwise null. */
function describeEventAfterHitstun(outcome: LaunchOutcome, hitstunFrames: number): string | null {
  if (outcome.type === 'survives' || outcome.frame <= hitstunFrames) return null;
  return outcome.type === 'ko' ? 'KO' : 'landing';
}

/** Staled damage keeps its fraction; show up to two decimals without trailing zeros. */
function formatPercent(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}
