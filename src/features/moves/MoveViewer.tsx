import { useState } from 'react';
import {
  findMove,
  getCharacterData,
  getRosterEntry,
  MOVE_CATEGORY_LABELS,
} from '../../data/characters';
import { useSelectionStore } from '../../state/selectionStore';
import { FrameDataPanel } from './FrameDataPanel';
import { FrameStrip } from './FrameStrip';
import { MoveClip } from './MoveClip';
import classes from './moves.module.css';

/** The selected move: clip, frame strip and frame data. */
export function MoveViewer() {
  const characterId = useSelectionStore((state) => state.characterId);
  const moveId = useSelectionStore((state) => state.moveId);
  const [currentFrame, setCurrentFrame] = useState<number | null>(null);

  const character = getCharacterData(characterId);
  const move = character ? findMove(character, moveId) : undefined;

  if (!character || !move) {
    const name = getRosterEntry(characterId)?.name ?? characterId;
    return (
      <section className={classes.viewer}>
        <h1 className={classes.title}>{name}</h1>
        <p className={classes.empty}>
          {name}&apos;s frame data hasn&apos;t been imported yet. Run{' '}
          <code>npm run import:data -- --only {characterId}</code> to add it.
        </p>
      </section>
    );
  }

  return (
    <section className={classes.viewer} aria-labelledby="move-title">
      <div className={classes.titleRow}>
        <h1 className={classes.title} id="move-title">
          {move.name}
        </h1>
        <span className={classes.subtitle}>
          {character.name}, {MOVE_CATEGORY_LABELS[move.category].toLowerCase()}
        </span>
      </div>

      <MoveClip
        key={`${characterId}/${move.id}`}
        characterId={characterId}
        moveId={move.id}
        moveName={move.name}
        totalFrames={move.totalFrames}
        onFrameChange={setCurrentFrame}
      />
      <FrameStrip move={move} currentFrame={currentFrame} />
      <FrameDataPanel move={move} />
    </section>
  );
}
