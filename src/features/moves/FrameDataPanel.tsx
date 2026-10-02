import { Badge, Select, SegmentedControl } from '@mantine/core';
import type { Hit, Move } from '../../data/types';
import { useSelectionStore } from '../../state/selectionStore';
import { describeHit, formatWindows, getActiveWindows, getStrongestHitbox } from './frameTimeline';
import classes from './moves.module.css';

/** More hits than this and the picker becomes a dropdown instead of a segmented control. */
const MAX_SEGMENTED_HITS = 4;

export function FrameDataPanel({ move }: { move: Move }) {
  const hitIndex = useSelectionStore((state) => state.hitIndex);
  const selectHit = useSelectionStore((state) => state.selectHit);
  const hit: Hit | undefined = move.hits[hitIndex] ?? move.hits[0];

  return (
    <section aria-labelledby="frame-data-title" style={{ display: 'grid', gap: 10 }}>
      <div className={classes.dataHeader}>
        <h2 className={classes.dataTitle} id="frame-data-title">
          Frame data
        </h2>
        {move.notes && <span className={classes.note}>{move.notes}</span>}
      </div>

      <dl className={classes.statGrid}>
        <StatCard label="Startup" value={move.firstActiveFrame} />
        <StatCard label="Active" value={formatWindows(getActiveWindows(move))} />
        <StatCard label="Total" value={move.totalFrames} />
        {move.category === 'aerial' ? (
          <StatCard
            label="Landing lag / L-cancel"
            value={formatPair(move.landingLag, move.lCancelledLandingLag)}
          />
        ) : (
          <StatCard label="Interruptible from" value={move.iasa} />
        )}
      </dl>

      {move.hits.length > 1 && <HitPicker hits={move.hits} value={hitIndex} onChange={selectHit} />}

      {hit ? <HitStats hit={hit} /> : <p className={classes.note}>No hitbox data for this move.</p>}
    </section>
  );
}

function HitPicker({
  hits,
  value,
  onChange,
}: {
  hits: Hit[];
  value: number;
  onChange: (index: number) => void;
}) {
  const options = hits.map((hit, index) => ({
    value: String(index),
    label: describeHit(hit, index),
  }));

  if (hits.length > MAX_SEGMENTED_HITS) {
    return (
      <Select
        label="Hit"
        data={options}
        value={String(value)}
        onChange={(next) => next !== null && onChange(Number(next))}
        allowDeselect={false}
        maw={260}
      />
    );
  }
  return (
    <SegmentedControl
      aria-label="Hit"
      data={options}
      value={String(value)}
      onChange={(next) => onChange(Number(next))}
      style={{ justifySelf: 'start' }}
    />
  );
}

function HitStats({ hit }: { hit: Hit }) {
  const hitbox = getStrongestHitbox(hit);
  if (!hitbox) return null;
  const hasSetKnockback = hitbox.setKnockback > 0;

  return (
    <>
      <dl className={`${classes.statGrid} ${classes.hitGrid}`}>
        <StatCard label="Damage" value={`${hitbox.damage}%`} />
        <StatCard
          label={hitbox.angle === 361 ? 'Angle (Sakurai)' : 'Angle'}
          value={hitbox.angle === 361 ? '361' : `${hitbox.angle}°`}
        />
        <StatCard
          label={hasSetKnockback ? 'Set knockback' : 'Base knockback'}
          value={hasSetKnockback ? hitbox.setKnockback : hitbox.baseKnockback}
        />
        <StatCard label="Knockback growth" value={hitbox.knockbackGrowth} />
        <StatCard label="Shield stun" value={hitbox.shieldstun} />
      </dl>
      {(hit.hitboxes.length > 1 || hitbox.effect !== 'Normal') && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {hit.hitboxes.length > 1 && (
            <span className={classes.note}>
              Showing the strongest of {hit.hitboxes.length} hitboxes.
            </span>
          )}
          {hitbox.effect !== 'Normal' && <Badge variant="light">{hitbox.effect}</Badge>}
        </div>
      )}
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className={classes.statCard}>
      <dt className={classes.statLabel}>{label}</dt>
      <dd className={classes.statValue}>{keepRangesTogether(value ?? '—')}</dd>
    </div>
  );
}

function formatPair(first: number | null, second: number | null): string {
  if (first === null && second === null) return '—';
  return `${first ?? '—'} / ${second ?? '—'}`;
}

/** Stops a line break from splitting a range like "24–26" across two lines. */
function keepRangesTogether(value: string | number): string | number {
  return typeof value === 'string' ? value.replace(/–/g, '\u2060–\u2060') : value;
}
