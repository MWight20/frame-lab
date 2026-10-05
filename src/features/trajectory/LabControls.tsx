import { Button, Checkbox, NumberInput, SegmentedControl, Select } from '@mantine/core';
import { getRosterWithData } from '../../data/characters';
import type { Hit, Hitbox } from '../../data/types';
import { STALE_QUEUE_LENGTH } from '../../engine';
import { useTrajectoryStore } from '../../state/trajectoryStore';
import type { VictimPlacement } from './labScenario';
import classes from './trajectory.module.css';

const STRONGEST = 'strongest';
const FACING_OPTIONS = [
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' },
];

interface LabControlsProps {
  hit: Hit;
  /** The hitbox the strongest option resolves to, for its label. */
  strongestHitbox: Hitbox;
  placement: VictimPlacement;
  /** Id for the pin's position text, which the pin refers to for screen readers. */
  positionId: string;
}

/** The lab's inputs, apart from the joystick and the pin on the stage. */
export function LabControls({ hit, strongestHitbox, placement, positionId }: LabControlsProps) {
  const victimId = useTrajectoryStore((state) => state.victimId);
  const selectVictim = useTrajectoryStore((state) => state.selectVictim);
  const victimPercent = useTrajectoryStore((state) => state.victimPercent);
  const setVictimPercent = useTrajectoryStore((state) => state.setVictimPercent);
  const isCrouching = useTrajectoryStore((state) => state.isCrouching);
  const setCrouching = useTrajectoryStore((state) => state.setCrouching);
  const hitboxName = useTrajectoryStore((state) => state.hitboxName);
  const selectHitbox = useTrajectoryStore((state) => state.selectHitbox);
  const isFacingLeft = useTrajectoryStore((state) => state.isAttackerFacingLeft);
  const setFacingLeft = useTrajectoryStore((state) => state.setAttackerFacingLeft);
  const resetPosition = useTrajectoryStore((state) => state.resetVictimPosition);
  const staleUses = useTrajectoryStore((state) => state.staleUses);
  const setStaleUses = useTrajectoryStore((state) => state.setStaleUses);
  const techOnLanding = useTrajectoryStore((state) => state.techOnLanding);
  const setTechOnLanding = useTrajectoryStore((state) => state.setTechOnLanding);

  const victimOptions = getRosterWithData().map((entry) => ({
    value: entry.id,
    label: entry.name,
  }));
  const hitboxOptions = [
    { value: STRONGEST, label: `Strongest: ${describeHitbox(strongestHitbox)}` },
    ...hit.hitboxes.map((hitbox) => ({ value: hitbox.name, label: describeHitbox(hitbox) })),
  ];
  const isKnownHitbox = hit.hitboxes.some((hitbox) => hitbox.name === hitboxName);

  return (
    <div className={classes.labControls}>
      <Select
        label="Victim"
        data={victimOptions}
        value={victimId}
        onChange={(value) => value && selectVictim(value)}
        allowDeselect={false}
      />
      <NumberInput
        label="Victim percent (before the hit)"
        value={victimPercent}
        onChange={(value) => setVictimPercent(typeof value === 'number' ? value : 0)}
        min={0}
        max={999}
        clampBehavior="strict"
        allowDecimal={false}
        suffix="%"
      />
      <Select
        label="Hitbox"
        data={hitboxOptions}
        value={isKnownHitbox ? hitboxName : STRONGEST}
        onChange={(value) => selectHitbox(value === STRONGEST ? null : value)}
        allowDeselect={false}
      />
      <div className={classes.fieldRow}>
        <div>
          <span className={classes.fieldLabel} id="attacker-facing-label">
            Attacker faces
          </span>
          <SegmentedControl
            aria-labelledby="attacker-facing-label"
            size="xs"
            data={FACING_OPTIONS}
            value={isFacingLeft ? 'left' : 'right'}
            onChange={(value) => setFacingLeft(value === 'left')}
          />
        </div>
        <Checkbox
          label="Crouch cancel"
          description={placement.isGrounded ? undefined : 'Needs the victim on the ground'}
          checked={isCrouching && placement.isGrounded}
          disabled={!placement.isGrounded}
          onChange={(event) => setCrouching(event.currentTarget.checked)}
        />
      </div>
      <div className={classes.fieldRow}>
        <NumberInput
          className={classes.staleInput}
          label="Stale uses"
          description={`Times this move hit in the attacker's last ${STALE_QUEUE_LENGTH} hits`}
          value={staleUses}
          onChange={(value) => setStaleUses(typeof value === 'number' ? value : 0)}
          min={0}
          max={STALE_QUEUE_LENGTH}
          clampBehavior="strict"
          allowDecimal={false}
        />
        <Checkbox
          label="Tech on landing"
          description="Tumbling victims only"
          checked={techOnLanding}
          onChange={(event) => setTechOnLanding(event.currentTarget.checked)}
        />
      </div>
      <div className={classes.positionRow}>
        <p className={classes.positionText} id={positionId}>
          {describePlacement(placement)}
        </p>
        <Button size="compact-sm" variant="default" onClick={resetPosition}>
          Reset to center stage
        </Button>
      </div>
    </div>
  );
}

/** Short enough to fit the select; the frame data panel shows the full values. */
function describeHitbox(hitbox: Hitbox): string {
  return `${hitbox.name}: ${hitbox.damage}%, ${hitbox.angle}°`;
}

function describePlacement({ position, isGrounded, surfaceName }: VictimPlacement): string {
  const where = `x ${position.x.toFixed(1)}, y ${position.y.toFixed(1)}`;
  if (!isGrounded) return `Victim at ${where}, airborne`;
  return `Victim at ${where}, grounded on the ${surfaceName?.toLowerCase()}`;
}
