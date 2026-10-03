import availableClips from 'virtual:clip-manifest';

/** The clip to play for a move: its file name (without .mp4) and, for a variant, which one. */
export interface ClipChoice {
  /** File name in public/clips/<characterId>/, for example "neutralb-uncharged". */
  fileId: string;
  /** The part after the move id, for example "uncharged", or null for the move's own clip. */
  variant: string | null;
}

/**
 * Variants chosen by hand, for moves whose clips are all variants and where neither the
 * uncharged one nor the first one alphabetically is the best pick. Keyed by
 * "<characterId>/<moveId>"; the value is the variant name.
 */
const PREFERRED_VARIANTS: Record<string, string> = {
  'peach/fsmash': 'pan',
  'mr-game-and-watch/sideb': '9',
  'mr-game-and-watch/asideb': '9',
};

const UNCHARGED_VARIANT = 'uncharged';

/** Clip file names per character, from the list the build makes (vite/clipManifestPlugin.ts). */
const CLIPS_BY_CHARACTER = groupByCharacter(availableClips);

function groupByCharacter(clipKeys: readonly string[]): Map<string, Set<string>> {
  const groups = new Map<string, Set<string>>();
  for (const key of clipKeys) {
    const [characterId, fileId] = key.split('/') as [string, string];
    const files = groups.get(characterId) ?? new Set<string>();
    files.add(fileId);
    groups.set(characterId, files);
  }
  return groups;
}

/**
 * Picks the clip to play for a move, or null when there is none. Some moves only have
 * variant clips (the clip pack names them "<moveId>-<variant>", like "neutralb-uncharged").
 * In order, it uses:
 *   1. the move's own clip, "<moveId>.mp4"
 *   2. a hand-picked variant from PREFERRED_VARIANTS
 *   3. the uncharged variant
 *   4. the first variant alphabetically
 */
export function findClip(characterId: string, moveId: string): ClipChoice | null {
  const files = CLIPS_BY_CHARACTER.get(characterId);
  if (!files) return null;
  if (files.has(moveId)) return { fileId: moveId, variant: null };

  const variants = [...files]
    .filter((file) => file.startsWith(`${moveId}-`))
    .map((file) => file.slice(moveId.length + 1))
    .sort();
  if (variants.length === 0) return null;

  const preferred = PREFERRED_VARIANTS[`${characterId}/${moveId}`];
  const variant = [preferred, UNCHARGED_VARIANT, variants[0]].find(
    (candidate) => candidate !== undefined && variants.includes(candidate),
  )!;
  return { fileId: `${moveId}-${variant}`, variant };
}
