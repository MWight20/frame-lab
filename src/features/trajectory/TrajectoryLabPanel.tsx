import { SegmentedControl } from '@mantine/core';
import { getStage, STAGES } from '../../data/stages';
import { useSelectionStore } from '../../state/selectionStore';
import { StageView } from './StageView';
import classes from './trajectory.module.css';

const STAGE_OPTIONS = STAGES.map((stage) => ({ value: stage.id, label: stage.shortName }));

/**
 * The knockback and DI lab. For now it shows the selected stage and its blast zones;
 * the knockback engine, joystick and launch paths are added in the next steps.
 */
export function TrajectoryLabPanel() {
  const stageId = useSelectionStore((state) => state.stageId);
  const selectStage = useSelectionStore((state) => state.selectStage);
  const stage = getStage(stageId);

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
      <p className={classes.upcoming}>
        {stage.name}. Victim percent, DI and predicted launch paths will appear here once the
        knockback engine is in place.
      </p>
    </section>
  );
}
