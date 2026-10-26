import { Drawer, SegmentedControl } from '@mantine/core';
import { useId, useMemo } from 'react';
import { findMove } from '../../data/characters';
import { getStage, STAGES } from '../../data/stages';
import type { CharacterData, Hit, Move, Stage } from '../../data/types';
import type { Point } from '../../engine';
import { useSelectionStore } from '../../state/selectionStore';
import { useTrajectoryStore } from '../../state/trajectoryStore';
import { useCharacterData } from '../characters/useCharacterData';
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
import { ResultTable } from './ResultTable';
import { StageView } from './StageView';
import { VictimPin } from './VictimPin';
import classes from './trajectory.module.css';

/** Initials keep the picker compact; hovering one shows the stage's full name. */
const STAGE_OPTIONS = STAGES.map((stage) => ({
  value: stage.id,
  label: <span title={stage.name}>{stage.shortName}</span>,
}));

export const TRAJECTORY_LAB_ID = 'trajectory-lab';

interface TrajectoryLabTrayProps {
  /** Any CSS width. The app passes "everything but the move list", or 100% on phones. */
  width: string;
}

/**
 * The knockback and DI lab, in a tray that slides over the page from the right: pick a
 * victim, percent, spot and DI, and see where the selected hit sends them, with and
 * without that DI. It closes with its × button, Escape, or a click outside.
 */
export function TrajectoryLabTray({ width }: TrajectoryLabTrayProps) {
  const isOpen = useSelectionStore((state) => state.isTrajectoryLabOpen);
  const setOpen = useSelectionStore((state) => state.setTrajectoryLabOpen);
  const stageId = useSelectionStore((state) => state.stageId);
  const stage = getStage(stageId);

  return (
    <Drawer
      id={TRAJECTORY_LAB_ID}
      opened={isOpen}
      onClose={() => setOpen(false)}
      position="right"
      size={width}
      title={<LabTitle stageName={stage.name} />}
      classNames={{ header: classes.trayHeader, body: classes.trayBody }}
    >
      <LabBody stage={stage} />
    </Drawer>
  );
}

function LabTitle({ stageName }: { stageName: string }) {
  return (
    <span className={classes.titleGroup}>
      <span className={classes.title}>Trajectory Lab</span>
      {/* The stage picker only shows initials, so name the current stage in full. */}
      <span className={classes.stageName}>{stageName}</span>
    </span>
  );
}

function StagePicker({ stage }: { stage: Stage }) {
  const selectStage = useSelectionStore((state) => state.selectStage);
  return (
    <SegmentedControl
      aria-label="Stage"
      size="xs"
      data={STAGE_OPTIONS}
      value={stage.id}
      onChange={selectStage}
    />
  );
}

/** Everything below the header, or a short explanation when there is nothing to launch. */
function LabBody({ stage }: { stage: Stage }) {
  const characterId = useSelectionStore((state) => state.characterId);
  const moveId = useSelectionStore((state) => state.moveId);
  const hitIndex = useSelectionStore((state) => state.hitIndex);
  const victimId = useTrajectoryStore((state) => state.victimId);

  const attacker = useCharacterData(characterId);
  const victim = useCharacterData(victimId);

  if (attacker.status === 'loading' || victim.status === 'loading') {
    return <EmptyStage stage={stage} message="Loading frame data…" />;
  }
  const move = attacker.status === 'ready' ? findMove(attacker.character, moveId) : undefined;
  if (!move || victim.status !== 'ready') {
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
      victim={victim.character}
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
  const staleUses = useTrajectoryStore((state) => state.staleUses);
  const techOnLanding = useTrajectoryStore((state) => state.techOnLanding);
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
        staleUses,
        techOnLanding,
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
      staleUses,
      techOnLanding,
    ],
  );

  function moveVictimTo(point: Point, snapDistance: number) {
    setVictimPosition(placeVictim(point, stage, snapDistance).position);
  }

  return (
    <div className={classes.labLayout}>
      <div className={classes.stageColumn}>
        <StagePicker stage={stage} />
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
        <p className={classes.hint}>Drag on the stage to place the victim; it snaps onto floors.</p>
        <ResultTable noDi={results.noDi} withDi={results.withDi} />
      </div>

      <div className={classes.sideColumn}>
        <div className={classes.controlsRow}>
          <Joystick value={stick} onChange={setStick} />
          <LabControls
            hit={hit}
            strongestHitbox={strongestHitbox}
            placement={placement}
            positionId={positionId}
          />
        </div>
      </div>
    </div>
  );
}

function EmptyStage({ stage, message }: { stage: Stage; message: string }) {
  return (
    <div className={classes.labLayout}>
      <div className={classes.stageColumn}>
        <StagePicker stage={stage} />
        <div className={classes.stageFrame}>
          <StageView stage={stage} />
        </div>
      </div>
      <p className={classes.upcoming}>{message}</p>
    </div>
  );
}
