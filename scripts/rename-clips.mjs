/**
 * Renames move clips from the names used in Emi House's clip pack (for example
 * `uSmash.mp4`, `AirNB.mp4`, `fSmashHi.mp4`) to the move ids the player looks for
 * (`usmash.mp4`, `aneutralb.mp4`, `fsmash-hi.mp4`).
 *
 *   npm run rename:clips              # preview the renames
 *   npm run rename:clips -- --apply   # rename the files
 *
 * The rules, in order:
 *   1. A few names are spelled out exactly (Marth and Roy's Dancing Blade parts, typos).
 *   2. Otherwise the longest matching move prefix gives the move id, and anything after it
 *      becomes a lowercase, hyphenated variant: `fSmashHi` -> `fsmash-hi`.
 *   3. If a forward smash or rapid jab has no plain clip, its obvious default variant takes
 *      the plain name: the middle angle, or the repeating loop.
 *
 * Names it can't match are reported and left alone. Re-running is safe: names that already
 * start with a move id (`usmash`, `fsmash-hi`) are recognized and stay where they are.
 */
import { readdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Clip-pack prefixes and the move id each one stands for. Matching ignores case. */
const PREFIX_TO_MOVE_ID = {
  jab: 'jab1',
  jab1: 'jab1',
  jab2: 'jab2',
  jab3: 'jab3',
  multijab: 'rjab',
  fTilt: 'ftilt',
  fTiltMid: 'ftilt',
  fTiltHi: 'uaft',
  fTiltLow: 'daft',
  uTilt: 'utilt',
  dTilt: 'dtilt',
  dashattack: 'dattack',
  fSmash: 'fsmash',
  uSmash: 'usmash',
  dSmash: 'dsmash',
  nAir: 'nair',
  fAir: 'fair',
  bAir: 'bair',
  uAir: 'uair',
  dAir: 'dair',
  zAir: 'zair',
  nB: 'neutralb',
  sideB: 'sideb',
  upB: 'upb',
  downB: 'downb',
  AirNB: 'aneutralb',
  AirSideB: 'asideb',
  AirUpB: 'aupb',
  AirDownB: 'adownb',
  grab: 'grab',
  dashgrab: 'dashgrab',
  rollForw: 'rollforward',
  rollBack: 'rollbackwards',
  spotdodge: 'spotdodge',
  airdodge: 'airdodge',
  taunt: 'taunt',
};

/**
 * Names the prefix rule would get wrong, including typos in the pack. Dancing Blade parts map to FightCore's ids
 * (`sideb2`, `sideb3up`, ...); the aerial versions have no FightCore id, so they follow the
 * same pattern with an `a` in front.
 */
const EXACT_NAMES = {
  // Link and Young Link's second forward smash swing has its own FightCore id.
  fSmash2: 'fsmash2',
  rolllBack: 'rollbackwards',
  rollback1: 'rollbackwards',
  ...dancingBladeNames('sideB', 'sideb'),
  ...dancingBladeNames('AirSideB', 'asideb'),
};

/**
 * The variant that becomes the plain clip when a move has no plain clip of its own: the
 * middle angle of a forward smash, and the repeating loop of a rapid jab.
 */
const DEFAULT_VARIANTS = { fsmash: 'mid', rjab: 'loop' };

function dancingBladeNames(sourcePrefix, idPrefix) {
  const names = {};
  for (const part of [2, 3, 4]) {
    names[`${sourcePrefix}-part${part}sideB`] = `${idPrefix}${part}`;
    names[`${sourcePrefix}-part${part}upB`] = `${idPrefix}${part}up`;
    names[`${sourcePrefix}-part${part}downB`] = `${idPrefix}${part}down`;
  }
  return names;
}

/** Every move id this script can produce, used to recognize clips that are already renamed. */
const MOVE_IDS = new Set([...Object.values(PREFIX_TO_MOVE_ID), ...Object.values(EXACT_NAMES)]);

/** Longest prefix first, so `fTiltHi` wins over `fTilt` and `AirSideB` over `sideB`. */
const PREFIXES = Object.keys(PREFIX_TO_MOVE_ID).sort((a, b) => b.length - a.length);

/** Returns `{ moveId, variant }` for a clip-pack name, or null if nothing matches. */
export function parseClipName(name) {
  const alreadyRenamed = alreadyRenamedMatch(name);
  if (alreadyRenamed) return alreadyRenamed;

  const exact = Object.entries(EXACT_NAMES).find(([source]) => source === name);
  if (exact) return { moveId: exact[1], variant: '' };

  const prefix = PREFIXES.find((candidate) =>
    name.toLowerCase().startsWith(candidate.toLowerCase()),
  );
  if (!prefix) return null;
  return { moveId: PREFIX_TO_MOVE_ID[prefix], variant: toKebabCase(name.slice(prefix.length)) };
}

/** `usmash` -> usmash, `fsmash-hi` -> fsmash + hi; null for names in the clip pack's style. */
function alreadyRenamedMatch(name) {
  if (MOVE_IDS.has(name)) return { moveId: name, variant: '' };
  const dash = name.indexOf('-');
  if (dash === -1 || !MOVE_IDS.has(name.slice(0, dash))) return null;
  return { moveId: name.slice(0, dash), variant: name.slice(dash + 1) };
}

/** `SleepyBoulder` -> `sleepy-boulder`, `-NOFx2` -> `nofx2`, `100Pounds` -> `100-pounds`. */
function toKebabCase(text) {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .split('-')
    .filter(Boolean)
    .join('-');
}

/** Works out every rename for one character folder. */
export function planFolder(fileNames) {
  const clips = fileNames.filter((file) => file.endsWith('.mp4'));
  const parsed = clips.map((file) => ({ file, match: parseClipName(path.basename(file, '.mp4')) }));
  const unmatched = parsed.filter((clip) => !clip.match).map((clip) => clip.file);

  const targets = parsed
    .filter((clip) => clip.match)
    .map(({ file, match }) => ({ file, moveId: match.moveId, variant: match.variant }));
  promoteDefaultVariants(targets);

  const collisions = findCollisions(targets);
  // Files that would land on the same name are left alone so nothing is overwritten.
  const colliding = new Set(collisions.flatMap(([, files]) => files));

  const renames = targets
    .filter(({ file }) => !colliding.has(file))
    .map(({ file, moveId, variant }) => ({
      from: file,
      to: `${variant ? `${moveId}-${variant}` : moveId}.mp4`,
    }))
    .filter(({ from, to }) => from !== to);
  return { renames, unmatched, collisions };
}

/** Gives a move's default variant the plain name when no clip already has it. */
function promoteDefaultVariants(targets) {
  for (const [moveId, defaultVariant] of Object.entries(DEFAULT_VARIANTS)) {
    const forMove = targets.filter((target) => target.moveId === moveId);
    if (forMove.some((target) => target.variant === '')) continue;
    const fallback = forMove.find((target) => target.variant === defaultVariant);
    if (fallback) fallback.variant = '';
  }
}

function findCollisions(targets) {
  const byName = new Map();
  for (const { file, moveId, variant } of targets) {
    const name = variant ? `${moveId}-${variant}` : moveId;
    byName.set(name, [...(byName.get(name) ?? []), file]);
  }
  return [...byName].filter(([, files]) => files.length > 1);
}

/**
 * Renames through a temporary name so a change of case alone (`uSmash` -> `usmash`) also
 * works on case-insensitive file systems such as macOS's default.
 */
async function renameFile(folder, from, to) {
  const temporary = path.join(folder, `.renaming-${to}`);
  await rename(path.join(folder, from), temporary);
  await rename(temporary, path.join(folder, to));
}

async function main() {
  const clipsDir = fileURLToPath(new URL('../public/clips/', import.meta.url));
  const apply = process.argv.includes('--apply');
  const characters = (await readdir(clipsDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  let renameCount = 0;
  let problemCount = 0;
  for (const character of characters) {
    const folder = path.join(clipsDir, character);
    const { renames, unmatched, collisions } = planFolder(await readdir(folder));

    for (const file of unmatched)
      console.warn(`  ? ${character}/${file}: no matching move, left alone`);
    for (const [name, files] of collisions) {
      console.warn(
        `  ! ${character}: ${files.join(', ')} would all become ${name}.mp4, left alone`,
      );
    }
    problemCount += unmatched.length + collisions.length;

    for (const { from, to } of renames) {
      console.log(`${character}/${from} -> ${to}`);
      if (apply) await renameFile(folder, from, to);
    }
    renameCount += renames.length;
  }

  const verb = apply ? 'Renamed' : 'Would rename';
  console.log(`\n${verb} ${renameCount} clips. ${problemCount} need a look (marked ? or !).`);
  if (!apply) console.log('Run again with --apply to rename.');
}

// Only run when called as a script, so the functions above can be imported by tests.
if (import.meta.url.startsWith('file:') && process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
