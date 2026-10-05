import { useState } from 'react';
import { findMove, getRosterEntry, MOVE_CATEGORY_LABELS } from '../../data/characters';
import { findClip } from '../../data/clips';
import { useCharacterData, type CharacterDataState } from '../characters/useCharacterData';
import { useSelectionStore } from '../../state/selectionStore';
import { FrameDataPanel } from './FrameDataPanel';
import { FrameStrip } from './FrameStrip';
import { MoveClip } from './MoveClip';
import classes from './moves.module.css';

/** The selected move: clip (when there is one), frame strip and frame data. */
export function MoveViewer() {
  const characterId = useSelectionStore((state) => state.characterId);
  const moveId = useSelectionStore((state) => state.moveId);
  const [currentFrame, setCurrentFrame] = useState<number | null>(null);

  const characterData = useCharacterData(characterId);
  if (characterData.status !== 'ready') {
    return <CharacterStatus characterId={characterId} state={characterData} />;
  }

  const { character } = characterData;
  const move = findMove(character, moveId);
  // Right after switching characters the old move id can be briefly unknown, until the
  // store picks one of the new character's moves.
  if (!move) {
    return <CharacterStatus characterId={characterId} state={{ status: 'loading' }} />;
  }

  // Moves without a clip skip the player entirely, so the frame data moves up.
  const clip = findClip(characterId, move.id);

  return (
    <section className={classes.viewer} aria-labelledby="move-title">
      <div className={classes.titleRow}>
        <h1 className={classes.title} id="move-title">
          {move.name}
        </h1>
        <span className={classes.subtitle}>
          {character.name}, {MOVE_CATEGORY_LABELS[move.category].toLowerCase()}
        </span>
        {!clip && <span className={classes.clipTag}>No clip</span>}
        {clip?.variant && <span className={classes.clipTag}>Clip: {clip.variant}</span>}
      </div>

      {clip && (
        <MoveClip
          key={`${characterId}/${move.id}`}
          characterId={characterId}
          clipFileId={clip.fileId}
          moveName={move.name}
          totalFrames={move.totalFrames}
          onFrameChange={setCurrentFrame}
        />
      )}
      <FrameStrip move={move} currentFrame={clip ? currentFrame : null} />
      <FrameDataPanel move={move} />
    </section>
  );
}

/** Stands in for the move while its character loads, or explains why there's nothing. */
function CharacterStatus({
  characterId,
  state,
}: {
  characterId: string;
  state: Exclude<CharacterDataState, { status: 'ready' }>;
}) {
  const name = getRosterEntry(characterId)?.name ?? characterId;
  return (
    <section className={classes.viewer}>
      <h1 className={classes.title}>{name}</h1>
      <p className={classes.empty} aria-live="polite">
        <StatusMessage name={name} characterId={characterId} status={state.status} />
      </p>
    </section>
  );
}

function StatusMessage({
  name,
  characterId,
  status,
}: {
  name: string;
  characterId: string;
  status: 'loading' | 'failed' | 'missing';
}) {
  switch (status) {
    case 'loading':
      return <>Loading {name}&apos;s frame data…</>;
    case 'failed':
      return (
        <>
          {name}&apos;s frame data couldn&apos;t be loaded. Check your connection and reload the
          page.
        </>
      );
    case 'missing':
      return (
        <>
          {name}&apos;s frame data hasn&apos;t been imported yet. Run{' '}
          <code>npm run import:data -- --only {characterId}</code> to add it.
        </>
      );
  }
}
