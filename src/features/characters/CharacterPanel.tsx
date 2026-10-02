import { getCharacterData, getRosterEntry } from '../../data/characters';
import { useSelectionStore } from '../../state/selectionStore';
import { CharacterIcon } from './CharacterIcon';
import classes from './characters.module.css';

export const ROSTER_DRAWER_ID = 'roster-drawer';

/** The selected character's icon, name and physics stats. Both buttons open the roster. */
export function CharacterPanel() {
  const characterId = useSelectionStore((state) => state.characterId);
  const isRosterOpen = useSelectionStore((state) => state.isRosterOpen);
  const toggleRoster = useSelectionStore((state) => state.toggleRoster);

  const entry = getRosterEntry(characterId);
  const attributes = getCharacterData(characterId)?.attributes;
  const name = entry?.name ?? characterId;

  return (
    <section className={classes.panel} aria-label="Selected character">
      <div className={classes.identity}>
        <button
          type="button"
          className={classes.iconButton}
          onClick={toggleRoster}
          aria-expanded={isRosterOpen}
          aria-controls={ROSTER_DRAWER_ID}
          aria-label="Select character"
        >
          <CharacterIcon characterId={characterId} name={name} size={48} />
        </button>
        <div>
          <div className={classes.name}>{name}</div>
          <button
            type="button"
            className={classes.linkButton}
            onClick={toggleRoster}
            aria-expanded={isRosterOpen}
            aria-controls={ROSTER_DRAWER_ID}
          >
            Select character
          </button>
        </div>
      </div>

      <dl className={classes.stats}>
        <Stat label="Weight" value={attributes?.weight} />
        <Stat label="Gravity" value={attributes?.gravity} />
        <Stat label="Fall speed" value={attributes?.fallSpeed} />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div>
      <dt className={classes.statLabel}>{label}</dt>
      <dd className={classes.statValue}>{value ?? '—'}</dd>
    </div>
  );
}
