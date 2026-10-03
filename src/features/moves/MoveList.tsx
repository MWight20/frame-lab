import { getCharacterData, groupMovesByCategory } from '../../data/characters';
import { useSelectionStore } from '../../state/selectionStore';
import classes from './moves.module.css';

/** The selected character's moves, grouped by category. */
export function MoveList() {
  const characterId = useSelectionStore((state) => state.characterId);
  const selectedMoveId = useSelectionStore((state) => state.moveId);
  const selectMove = useSelectionStore((state) => state.selectMove);

  const character = getCharacterData(characterId);
  if (!character) {
    return (
      <p className={`${classes.list} ${classes.note}`}>No moves imported for this character yet.</p>
    );
  }

  return (
    <nav className={classes.list} aria-label={`${character.name} moves`}>
      {groupMovesByCategory(character.moves).map((group) => (
        <div key={group.category}>
          <h3 className={classes.groupLabel} id={`move-group-${group.category}`}>
            {group.label}
          </h3>
          <ul className={classes.groupMoves} aria-labelledby={`move-group-${group.category}`}>
            {group.moves.map((move) => (
              <li key={move.id}>
                <button
                  type="button"
                  className={classes.moveButton}
                  aria-current={move.id === selectedMoveId}
                  onClick={() => selectMove(move.id)}
                >
                  {move.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
