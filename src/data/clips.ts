import availableClips from 'virtual:clip-manifest';

const CLIP_KEYS = new Set(availableClips);

/**
 * Whether public/clips/<characterId>/<moveId>.mp4 exists. The list is read when the dev
 * server starts or the app is built (see vite/clipManifestPlugin.ts), so the page knows
 * without requesting the file.
 */
export function hasClip(characterId: string, moveId: string): boolean {
  return CLIP_KEYS.has(`${characterId}/${moveId}`);
}
