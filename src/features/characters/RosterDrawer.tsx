import { CloseButton, FocusTrap, Transition } from '@mantine/core';
import { useEffect, useRef } from 'react';
import { hasCharacterData, ROSTER } from '../../data/characters';
import { useSelectionStore } from '../../state/selectionStore';
import { CharacterIcon } from './CharacterIcon';
import { ROSTER_DRAWER_ID } from './CharacterPanel';
import classes from './characters.module.css';

/**
 * The character picker. It slides out beside the move list (not from the screen edge,
 * which is why this is a small custom component rather than Mantine's Drawer).
 * Closes on Escape, on a click outside, or when a character is picked.
 */
export function RosterDrawer() {
  const isOpen = useSelectionStore((state) => state.isRosterOpen);
  const closeRoster = useSelectionStore((state) => state.closeRoster);
  const selectedId = useSelectionStore((state) => state.characterId);
  const selectCharacter = useSelectionStore((state) => state.selectCharacter);

  useReturnFocusOnClose(isOpen);

  return (
    <Transition mounted={isOpen} transition="slide-right" duration={150}>
      {(transitionStyles) => (
        <>
          <button
            type="button"
            className={classes.scrim}
            aria-label="Close roster"
            tabIndex={-1}
            onClick={closeRoster}
          />
          <FocusTrap active={isOpen}>
            <aside
              id={ROSTER_DRAWER_ID}
              className={classes.drawer}
              style={transitionStyles}
              aria-label="Roster"
              onKeyDown={(event) => {
                if (event.key === 'Escape') closeRoster();
              }}
            >
              <div className={classes.drawerHeader}>
                <span>Roster</span>
                <CloseButton size="sm" aria-label="Close roster" onClick={closeRoster} />
              </div>
              <div className={classes.grid}>
                {ROSTER.map((entry) => {
                  const isSelected = entry.id === selectedId;
                  const hasData = hasCharacterData(entry.id);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      className={classes.tile}
                      aria-pressed={isSelected}
                      aria-label={hasData ? entry.name : `${entry.name} (no data yet)`}
                      data-has-data={hasData}
                      data-autofocus={isSelected || undefined}
                      onClick={() => selectCharacter(entry.id)}
                    >
                      <CharacterIcon
                        characterId={entry.id}
                        name={entry.name}
                        size={24}
                        isHighlighted={isSelected}
                      />
                      {entry.shortName}
                    </button>
                  );
                })}
              </div>
            </aside>
          </FocusTrap>
        </>
      )}
    </Transition>
  );
}

/** Puts keyboard focus back where it was (usually the button that opened the drawer). */
function useReturnFocusOnClose(isOpen: boolean) {
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement | null;
    } else {
      previousFocus.current?.focus();
      previousFocus.current = null;
    }
  }, [isOpen]);
}
