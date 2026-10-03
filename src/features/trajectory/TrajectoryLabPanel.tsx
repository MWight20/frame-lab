import { SegmentedControl } from '@mantine/core';
import { useId, useMemo } from 'react';
import { findMove, getCharacterData } from '../../data/characters';
import { getStage, STAGES } from '../../data/stages';
import type { CharacterData, Hit, Move, Stage } from '../../data/types';
import type { Point } from '../../engine';
import { useSelectionStore } from '../../state/selectionStore';
import { useTrajectoryStore } from '../../state/trajectoryStore';
import { Joystick } from './Joystick';
import { LabControls } from './LabControls';
import {
  findStrongestHitbox,
  launchingHits,
  pickLaunchingHit,
  placeVictim,
  runLab,
  SURFACE_SNAP_DISTANCE,
} from './labScenario';
import { LaunchOverlay } from './LaunchOverlay';
import { ResultCard } from './ResultCard';
import { StageView } from './StageView';
import { VictimPin } from './VictimPin';
import classes from './trajectory.module.css';

/** Initials keep the picker compact; hovering one shows the stage's full name. */
const STAGE_OPTIONS = STAGES.map((stage) => ({
  value: stage.id,
  label: <span title={stage.name}>{stage.shortName}</span>,
}));

/**
 * The knockback and DI lab: pick a victim, percent, spot and DI, and see where the
 * selected hit sends them, with and without that DI.
 */
export function TrajectoryLabPanel() {
  const stageId = useSelectionStore((state) => state.stageId);
  const selectStage = useSelectionStore((state) => state.selectStage);
  const stage = getStage(stageId);

  return (
    <section className={classes.panel} aria-labelledby="trajectory-lab-title">
      <div className={classes.header}>
        <div className={classes.titleGroup}>
          <h2 className={classes.title} id="trajectory-lab-title">
            Trajectory Lab
          </h2>
          {/* The stage picker only shows initials, so name the current stage in full. */}
          <span className={classes.stageName} aria-live="polite">
            {stage.name}
          </span>
        </div>
        <SegmentedControl
          aria-label="Stage"
          size="xs"
          data={STAGE_OPTIONS}
          value={stage.id}
          onChange={selectStage}
        />
      </div>
      <LabBody stage={stage} />
    </section>
  );
}

/** Everything below the header, or a short explanation when there is nothing to launch. */
function LabBody({ stage }: { stage: Stage }) {
  const characterId = useSelectionStore((state) => state.characterId);
  const moveId = useSelectionStore((state) => state.moveId);
  const hitIndex = useSelectionStore((state) => state.hitIndex);
  const victimId = useTrajectoryStore((state) => state.victimId);

  const attacker = getCharacterData(characterId);
  const move = attacker ? findMove(attacker, moveId) : undefined;
  const victim = getCharacterData(victimId);

  if (!move || !victim) {
    return <EmptyStage stage={stage} message="Pick a character with frame data to launch." />;
  }
  if (launchingHits(move).length === 0) {
    return (
      <EmptyStage
        stage={stage}
        message={`${move.name} doesn't launch anyone: grabs catch the victim and pummels hit them while held. Pick a throw or an attack instead.`}
      />
    );
  }
  return (
    <LabWorkspace
      stage={stage}
      move={move}
      hit={pickLaunchingHit(move, hitIndex)}
      victim={victim}
    />
  );
}

interface LabWorkspaceProps {
  stage: Stage;
  move: Move;
  hit: Hit;
  victim: CharacterData;
}

function LabWorkspace({ stage, move, hit, victim }: LabWorkspaceProps) {
  const victimPercent = useTrajectoryStore((state) => state.victimPercent);
  const isCrouching = useTrajectoryStore((state) => state.isCrouching);
  const stick = useTrajectoryStore((state) => state.stick);
  const setStick = useTrajectoryStore((state) => state.setStick);
  const hitboxName = useTrajectoryStore((state) => state.hitboxName);
  const victimPosition = useTrajectoryStore((state) => state.victimPosition);
  const setVictimPosition = useTrajectoryStore((state) => state.setVictimPosition);
  const isAttackerFacingLeft = useTrajectoryStore((state) => state.isAttackerFacingLeft);
  const positionId = useId();

  // Pointer drags have already snapped to a surface, so only an exact match counts here.
  const placement = useMemo(() => placeVictim(victimPosition, stage, 0), [victimPosition, stage]);
  const strongestHitbox = findStrongestHitbox(hit, victim, victimPercent)!;
  const hitbox = hit.hitboxes.find((candidate) => candidate.name === hitboxName) ?? strongestHitbox;

  const results = useMemo(
    () =>
      runLab({
        move,
        hitbox,
        victim,
        victimPercent,
        stage,
        placement,
        isCrouching,
        isAttackerFacingLeft,
        stick,
      }),
    [
      move,
      hitbox,
      victim,
      victimPercent,
      stage,
      placement,
      isCrouching,
      isAttackerFacingLeft,
      stick,
    ],
  );

  function moveVictimTo(point: Point, snapDistance: number) {
    setVictimPosition(placeVictim(point, stage, snapDistance).position);
  }

  return (
    <>
      <div className={classes.stageFrame}>
        <StageView
          stage={stage}
          onPointPicked={(point) => moveVictimTo(point, SURFACE_SNAP_DISTANCE)}
        >
          <LaunchOverlay noDi={results.noDi.hit} withDi={results.withDi.hit} />
          <VictimPin
            position={placement.position}
            onMove={(point) => moveVictimTo(point, 0)}
            describedBy={positionId}
          />
        </StageView>
      </div>
      <p className={classes.hint}>
        Drag on the stage to place the victim. Near a floor or platform, they snap onto it.
      </p>

      <div className={classes.controlsRow}>
        <Joystick value={stick} onChange={setStick} />
        <LabControls
          hit={hit}
          strongestHitbox={strongestHitbox}
          placement={placement}
          positionId={positionId}
        />
      </div>

      <div className={classes.results}>
        <ResultCard title="No DI" result={results.noDi} />
        <ResultCard title="With this DI" result={results.withDi} />
      </div>
    </>
  );
}

function EmptyStage({ stage, message }: { stage: Stage; message: string }) {
  return (
    <>
      <div className={classes.stageFrame}>
        <StageView stage={stage} />
      </div>
      <p className={classes.upcoming}>{message}</p>
    </>
  );
}
