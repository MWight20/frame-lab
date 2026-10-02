import { SegmentedControl } from '@mantine/core';
import { useState } from 'react';
import { NEUTRAL_STICK } from '../../engine';
import { getStage, STAGES } from '../../data/stages';
import { useSelectionStore } from '../../state/selectionStore';
import { Joystick } from './Joystick';
import { StageView } from './StageView';
import classes from './trajectory.module.css';

const STAGE_OPTIONS = STAGES.map((stage) => ({ value: stage.id, label: stage.shortName }));

/**
 * The knockback and DI lab. For now it shows the selected stage and the DI joystick;
 * launch paths and results are wired up in the next step, which also moves the stick
 * value into the shared store.
 */
export function TrajectoryLabPanel() {
  const stageId = useSelectionStore((state) => state.stageId);
  const selectStage = useSelectionStore((state) => state.selectStage);
  const stage = getStage(stageId);
  const [stick, setStick] = useState(NEUTRAL_STICK);

  return (
    <section className={classes.panel} aria-labelledby="trajectory-lab-title">
      <div className={classes.header}>
        <h2 className={classes.title} id="trajectory-lab-title">
          Trajectory Lab
        </h2>
        <SegmentedControl
          aria-label="Stage"
          size="xs"
          data={STAGE_OPTIONS}
          value={stage.id}
          onChange={selectStage}
        />
      </div>

      <div className={classes.stageFrame}>
        <StageView stage={stage} />
      </div>
      <div className={classes.controlsRow}>
        <Joystick value={stick} onChange={setStick} />
        <p className={classes.upcoming}>
          {stage.name}. Victim, percent and predicted launch paths will appear here in the next
          step.
        </p>
      </div>
    </section>
  );
}
