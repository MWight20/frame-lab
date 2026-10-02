import { create } from 'zustand';
import { DEFAULT_CHARACTER_ID, getCharacterData } from '../data/characters';
import { DEFAULT_STAGE_ID } from '../data/stages';

/**
 * App-wide selection state: which character, move and stage are showing, and which
 * panels are open. Components read single fields with selectors, for example
 * `useSelectionStore((state) => state.moveId)`, so they only re-render when that field changes.
 */
interface SelectionState {
  characterId: string;
  moveId: string | null;
  /** Index into the selected move's hits, for the frame data panel. */
  hitIndex: number;
  stageId: string;
  isRosterOpen: boolean;
  isTrajectoryLabOpen: boolean;

  selectCharacter: (characterId: string) => void;
  selectMove: (moveId: string) => void;
  selectHit: (hitIndex: number) => void;
  selectStage: (stageId: string) => void;
  openRoster: () => void;
  closeRoster: () => void;
  toggleRoster: () => void;
  setTrajectoryLabOpen: (isOpen: boolean) => void;
}

const DEFAULT_MOVE_ID = 'usmash';

/** The move to show after switching characters: the same move if they have it, else their first. */
function pickMoveFor(characterId: string, preferredMoveId: string | null): string | null {
  const character = getCharacterData(characterId);
  if (!character) return null;
  const preferred = character.moves.find((move) => move.id === preferredMoveId);
  return preferred?.id ?? character.moves[0]?.id ?? null;
}

export const useSelectionStore = create<SelectionState>()((set) => ({
  characterId: DEFAULT_CHARACTER_ID,
  moveId: pickMoveFor(DEFAULT_CHARACTER_ID, DEFAULT_MOVE_ID),
  hitIndex: 0,
  stageId: DEFAULT_STAGE_ID,
  isRosterOpen: false,
  isTrajectoryLabOpen: true,

  selectCharacter: (characterId) =>
    set((state) => ({
      characterId,
      moveId: pickMoveFor(characterId, state.moveId),
      hitIndex: 0,
      isRosterOpen: false,
    })),
  selectMove: (moveId) => set({ moveId, hitIndex: 0 }),
  selectHit: (hitIndex) => set({ hitIndex }),
  selectStage: (stageId) => set({ stageId }),
  openRoster: () => set({ isRosterOpen: true }),
  closeRoster: () => set({ isRosterOpen: false }),
  toggleRoster: () => set((state) => ({ isRosterOpen: !state.isRosterOpen })),
  setTrajectoryLabOpen: (isOpen) => set({ isTrajectoryLabOpen: isOpen }),
}));
