import rosterJson from './roster.json';
import type { CharacterData, Move, MoveCategory, RosterEntry } from './types';

export const ROSTER: RosterEntry[] = rosterJson;

/**
 * Every JSON file in ./characters is picked up automatically, so running the import script
 * for more characters is all it takes to add them to the app. Each file becomes its own
 * small chunk that is only downloaded when that character is first needed; bundling all 26
 * up front made the app's main file about 1.2 MB.
 */
const characterLoaders = new Map(
  Object.entries(import.meta.glob<CharacterData>('./characters/*.json', { import: 'default' })).map(
    ([path, load]) => [characterIdFromPath(path), load],
  ),
);

function characterIdFromPath(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1, -'.json'.length);
}

/** Characters loaded so far. Data never changes once loaded, so nothing is evicted. */
const loadedCharacters = new Map<string, CharacterData>();
/** Characters whose download failed, so the UI can say so instead of waiting forever. */
const failedCharacterIds = new Set<string>();
const pendingLoads = new Map<string, Promise<CharacterData | undefined>>();
const listeners = new Set<() => void>();

export const DEFAULT_CHARACTER_ID = 'fox';

export function getRosterEntry(characterId: string): RosterEntry | undefined {
  return ROSTER.find((entry) => entry.id === characterId);
}

/** Whether frame data exists for this character, loaded or not. */
export function hasCharacterData(characterId: string): boolean {
  return characterLoaders.has(characterId);
}

/** Roster entries for characters with frame data, in roster order. Needs no loading. */
export function getRosterWithData(): RosterEntry[] {
  return ROSTER.filter((entry) => hasCharacterData(entry.id));
}

/**
 * The character's data if it has been loaded, else undefined. Use `loadCharacterData` (or
 * the `useCharacterData` hook in components) to load it.
 */
export function getCharacterData(characterId: string): CharacterData | undefined {
  return loadedCharacters.get(characterId);
}

export function hasCharacterLoadFailed(characterId: string): boolean {
  return failedCharacterIds.has(characterId);
}

/**
 * Downloads the character's data once and caches it. Resolves to undefined for characters
 * without data, or if the download fails (`hasCharacterLoadFailed` then says so).
 */
export function loadCharacterData(characterId: string): Promise<CharacterData | undefined> {
  const loaded = loadedCharacters.get(characterId);
  if (loaded) return Promise.resolve(loaded);
  const load = characterLoaders.get(characterId);
  if (!load) return Promise.resolve(undefined);

  let pending = pendingLoads.get(characterId);
  if (!pending) {
    failedCharacterIds.delete(characterId);
    pending = load()
      .then((character) => {
        loadedCharacters.set(characterId, character);
        return character;
      })
      .catch(() => {
        failedCharacterIds.add(characterId);
        return undefined;
      })
      .finally(() => {
        pendingLoads.delete(characterId);
        notifyListeners();
      });
    pendingLoads.set(characterId, pending);
  }
  return pending;
}

/** Calls `listener` whenever a character finishes loading (or fails). Returns an unsubscribe. */
export function subscribeToCharacterData(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(): void {
  for (const listener of listeners) listener();
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
