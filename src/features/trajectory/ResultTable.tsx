import type { ReactNode } from 'react';
import type { LandingKind, LaunchOutcome } from '../../engine';
import type { LabResult } from './labScenario';
import classes from './trajectory.module.css';

interface ResultTableProps {
  noDi: LabResult;
  withDi: LabResult;
}

interface ResultRow {
  label: string;
  value: (result: LabResult) => ReactNode;
}

const ROWS: ResultRow[] = [
  { label: 'Outcome', value: ({ hit }) => describeOutcome(hit.outcome) },
  { label: 'Damage', value: ({ hit }) => formatPercent(hit.damage) },
  { label: 'Launch angle', value: ({ hit }) => `${hit.angle.toFixed(1)}°` },
  { label: 'Knockback', value: ({ hit }) => hit.knockback.toFixed(1) },
  {
    label: 'Hitstun',
    value: ({ hit }) => `${hit.hitstunFrames} frames${hit.isTumble ? ', tumble' : ''}`,
  },
  {
    label: 'Kills from here at',
    value: ({ killPercent }) => (killPercent === null ? 'Never' : `${killPercent}%`),
  },
];

/**
 * Both launches side by side, one row per measure, so the effect of the DI reads across a
 * row. Columns that end in a KO are tinted.
 */
export function ResultTable({ noDi, withDi }: ResultTableProps) {
  const columns = [
    { title: 'No DI', result: noDi },
    { title: 'With this DI', result: withDi },
  ];

  return (
    <div className={classes.results}>
      <table className={classes.resultTable} aria-label="Results">
        <thead>
          <tr>
            <th scope="col">
              <span className={classes.visuallyHidden}>Measure</span>
            </th>
            {columns.map(({ title }) => (
              <th key={title} scope="col">
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {columns.map(({ title, result }) => (
                <td key={title} data-ko={result.hit.outcome.type === 'ko' || undefined}>
                  {row.value(result)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {columns.map(({ title, result }) => (
        <LateEventNote key={title} title={title} result={result} />
      ))}
    </div>
  );
}

/** Says when a KO or landing comes after hitstun ends, so the victim could act first. */
function LateEventNote({ title, result }: { title: string; result: LabResult }) {
  const { outcome, hitstunFrames } = result.hit;
  if (outcome.type === 'survives' || outcome.frame <= hitstunFrames) return null;
  const event = outcome.type === 'ko' ? 'KO' : 'landing';
  return (
    <p className={classes.resultNote}>
      {title}: the {event} comes after hitstun ends on frame {hitstunFrames}, so the victim could
      act first.
    </p>
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

/** Staled damage keeps its fraction; show up to two decimals without trailing zeros. */
function formatPercent(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}
