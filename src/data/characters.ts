import rosterJson from './roster.json';
import type { CharacterData, Move, MoveCategory, RosterEntry } from './types';

export const ROSTER: RosterEntry[] = rosterJson;

/**
 * Every JSON file in ./characters is loaded automatically, so running the import
 * script for more characters is all it takes to add them to the app.
 */
const characterFiles = import.meta.glob<CharacterData>('./characters/*.json', {
  eager: true,
  import: 'default',
});

const charactersById = new Map<string, CharacterData>(
  Object.values(characterFiles).map((character) => [character.id, character]),
);

export const DEFAULT_CHARACTER_ID = 'fox';

export function getRosterEntry(characterId: string): RosterEntry | undefined {
  return ROSTER.find((entry) => entry.id === characterId);
}

/** Returns undefined for characters whose data has not been imported yet. */
export function getCharacterData(characterId: string): CharacterData | undefined {
  return charactersById.get(characterId);
}

export function hasCharacterData(characterId: string): boolean {
  return charactersById.has(characterId);
}

export function findMove(character: CharacterData, moveId: string | null): Move | undefined {
  return character.moves.find((move) => move.id === moveId);
}

export const MOVE_CATEGORY_LABELS: Record<MoveCategory, string> = {
  ground: 'Ground',
  aerial: 'Aerials',
  special: 'Specials',
  grab: 'Grabs and throws',
};

export interface MoveGroup {
  category: MoveCategory;
  label: string;
  moves: Move[];
}

/** Splits a character's moves into labelled groups, keeping the data's order. */
export function groupMovesByCategory(moves: Move[]): MoveGroup[] {
  const categories = Object.keys(MOVE_CATEGORY_LABELS) as MoveCategory[];
  return categories
    .map((category) => ({
      category,
      label: MOVE_CATEGORY_LABELS[category],
      moves: moves.filter((move) => move.category === category),
    }))
    .filter((group) => group.moves.length > 0);
}
