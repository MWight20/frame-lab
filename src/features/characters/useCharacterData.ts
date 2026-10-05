import { useEffect, useSyncExternalStore } from 'react';
import {
  getCharacterData,
  hasCharacterData,
  hasCharacterLoadFailed,
  loadCharacterData,
  subscribeToCharacterData,
} from '../../data/characters';
import type { CharacterData } from '../../data/types';

export type CharacterDataState =
  | { status: 'ready'; character: CharacterData }
  | { status: 'loading' }
  /** The download failed (for example, offline). Reloading the page tries again. */
  | { status: 'failed' }
  /** No frame data has been imported for this character. */
  | { status: 'missing' };

/**
 * A character's frame data for a component, loading it on first use. Re-renders when the
 * download finishes. Character files are small and cached, so after the first visit this
 * is instant.
 */
export function useCharacterData(characterId: string): CharacterDataState {
  const snapshot = useSyncExternalStore(subscribeToCharacterData, () => readSnapshot(characterId));

  useEffect(() => {
    if (snapshot === 'loading') void loadCharacterData(characterId);
  }, [characterId, snapshot]);

  return typeof snapshot === 'string'
    ? { status: snapshot }
    : { status: 'ready', character: snapshot };
}

/**
 * useSyncExternalStore compares snapshots by identity, so this returns either the cached
 * character object or a plain string, never a new object.
 */
function readSnapshot(characterId: string): CharacterData | 'loading' | 'failed' | 'missing' {
  if (!hasCharacterData(characterId)) return 'missing';
  const character = getCharacterData(characterId);
  if (character) return character;
  return hasCharacterLoadFailed(characterId) ? 'failed' : 'loading';
}
