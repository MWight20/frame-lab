/**
 * Imports character frame data into src/data/characters/<id>.json.
 *
 * Sources:
 *   - Moves, hitboxes and weight: FightCore frame-data (GPL-3.0)
 *     https://github.com/FightCore/frame-data
 *   - Gravity, fall speed and fast-fall speed: libmelee characterdata.csv (LGPL-3.0)
 *     https://github.com/altf4/libmelee
 *
 * Usage:
 *   npm run import:data                     # every character in roster.json
 *   npm run import:data -- --only fox,marth # just the listed character ids
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FIGHTCORE_URL =
  'https://raw.githubusercontent.com/FightCore/frame-data/main/data/characters.json';
const LIBMELEE_URL =
  'https://raw.githubusercontent.com/altf4/libmelee/main/melee/characterdata.csv';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rosterPath = path.join(projectRoot, 'src/data/roster.json');
const outputDir = path.join(projectRoot, 'src/data/characters');

/** FightCore's numeric move types. Types not listed here (dodges, techs, edge attacks) are skipped. */
const CATEGORY_BY_FIGHTCORE_TYPE = {
  1: 'ground', // Tilt
  2: 'ground', // Grounded
  3: 'aerial', // Air
  4: 'special', // Special
  6: 'grab', // Throw
};

const CATEGORY_ORDER = ['ground', 'aerial', 'special', 'grab'];

/** Preferred order within each category. Moves not listed keep their source order at the end. */
const MOVE_ORDER = [
  'jab1',
  'jab2',
  'jab3',
  'rjab',
  'ftilt',
  'uaft',
  'daft',
  'utilt',
  'dtilt',
  'dattack',
  'fsmash',
  'usmash',
  'dsmash',
  'nair',
  'fair',
  'bair',
  'uair',
  'dair',
  'neutralb',
  'aneutralb',
  'sideb',
  'asideb',
  'upb',
  'aupb',
  'downb',
  'adownb',
  'grab',
  'dashgrab',
  'pummel',
  'fthrow',
  'bthrow',
  'uthrow',
  'dthrow',
];

async function main() {
  const onlyIds = readOnlyArgument();
  const roster = JSON.parse(await readFile(rosterPath, 'utf8'));
  const selected = onlyIds ? roster.filter((entry) => onlyIds.includes(entry.id)) : roster;

  if (selected.length === 0) {
    throw new Error(`No roster entries match --only ${onlyIds.join(',')}`);
  }

  console.log('Downloading FightCore frame data...');
  const fightCoreCharacters = await fetchJson(FIGHTCORE_URL);
  console.log('Downloading libmelee character attributes...');
  const libmeleeRows = parseCsv(await fetchText(LIBMELEE_URL));

  await mkdir(outputDir, { recursive: true });

  for (const entry of selected) {
    const source = fightCoreCharacters.find((c) => c.normalizedName === entry.fightCoreName);
    const physics = libmeleeRows.find((row) => row.Character === entry.libmeleeName);

    if (!source || !physics) {
      console.warn(`Skipping ${entry.name}: missing ${!source ? 'FightCore' : 'libmelee'} data`);
      continue;
    }

    const character = buildCharacter(entry, source, physics);
    const outputPath = path.join(outputDir, `${entry.id}.json`);
    await writeFile(outputPath, JSON.stringify(character, null, 2) + '\n');
    console.log(
      `Wrote ${path.relative(projectRoot, outputPath)} (${character.moves.length} moves)`,
    );
  }
}

function buildCharacter(entry, source, physics) {
  const moves = source.moves
    .filter((move) => CATEGORY_BY_FIGHTCORE_TYPE[move.type])
    .map(buildMove)
    .sort(compareMoves);

  return {
    id: entry.id,
    name: entry.name,
    attributes: {
      weight: source.characterStatistics.weight,
      // FightCore's "gravity" field holds fall speed, so physics values come from libmelee instead.
      gravity: Number(physics.Gravity),
      fallSpeed: Number(physics.TerminalVelocity),
      fastFallSpeed: Number(physics.FastFallSpeed),
    },
    moves,
    sources: [
      'FightCore frame-data (GPL-3.0): https://github.com/FightCore/frame-data',
      'libmelee character data (LGPL-3.0): https://github.com/altf4/libmelee',
    ],
  };
}

function buildMove(move) {
  return {
    id: move.normalizedName,
    name: toTitleCase(move.name),
    category: CATEGORY_BY_FIGHTCORE_TYPE[move.type],
    totalFrames: positiveOrNull(move.totalFrames),
    firstActiveFrame: positiveOrNull(move.start),
    lastActiveFrame: positiveOrNull(move.end),
    iasa: positiveOrNull(move.iasa),
    landingLag: positiveOrNull(move.landLag),
    lCancelledLandingLag: positiveOrNull(move.lCanceledLandLag),
    autoCancelBefore: positiveOrNull(move.autoCancelBefore),
    autoCancelAfter: positiveOrNull(move.autoCancelAfter),
    notes: move.notes ? move.notes : null,
    hits: move.hits
      .slice()
      .sort((a, b) => a.start - b.start)
      .map((hit) => ({
        name: hit.name && hit.name !== 'unknown' ? hit.name : null,
        ...hitWindow(hit, move),
        hitboxes: hit.hitboxes.map((hitbox) => ({
          name: hitbox.name,
          damage: hitbox.damage,
          angle: hitbox.angle,
          baseKnockback: hitbox.baseKnockback,
          knockbackGrowth: hitbox.knockbackGrowth,
          setKnockback: hitbox.setKnockback,
          isWeightIndependent: hitbox.isWeightIndependent,
          effect: hitbox.effect,
          shieldstun: hitbox.shieldstun,
          hitlag: hitbox.hitlagDefender,
        })),
      })),
  };
}

/**
 * FightCore sometimes leaves a hit's frame window at 0. When the move has only one hit,
 * the move's own active frames are that hit's window; otherwise the window is unknown.
 */
function hitWindow(hit, move) {
  if (hit.start > 0 && hit.end > 0) {
    return { startFrame: hit.start, endFrame: hit.end };
  }
  if (move.hits.length === 1) {
    return { startFrame: positiveOrNull(move.start), endFrame: positiveOrNull(move.end) };
  }
  return { startFrame: null, endFrame: null };
}

function compareMoves(a, b) {
  const categoryDifference =
    CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
  if (categoryDifference !== 0) return categoryDifference;
  return orderIndex(a.id) - orderIndex(b.id);
}

function orderIndex(moveId) {
  const index = MOVE_ORDER.indexOf(moveId);
  return index === -1 ? MOVE_ORDER.length : index;
}

/** FightCore uses 0 (or leaves the field out) when a value is unknown. */
function positiveOrNull(value) {
  return typeof value === 'number' && value > 0 ? value : null;
}

/** "Up throw" -> "Up Throw", "Dashattack" -> "Dash Attack". Parenthesized notes are left alone. */
function toTitleCase(name) {
  const spaced = name.replace(/^Dashattack$/, 'Dash attack').replace(/^Dashgrab$/, 'Dash grab');
  return spaced.replace(/\b([a-z])/g, (letter) => letter.toUpperCase());
}

function readOnlyArgument() {
  const index = process.argv.indexOf('--only');
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value) throw new Error('--only needs a comma-separated list of character ids');
  return value.split(',').map((id) => id.trim());
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
  return response.text();
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

/** Minimal CSV parser for libmelee's file: quoted headers, no commas inside values. */
function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map(stripQuotes);
  return lines.map((line) => {
    const values = line.split(',').map(stripQuotes);
    return Object.fromEntries(headers.map((header, i) => [header, values[i]]));
  });
}

function stripQuotes(value) {
  return value.trim().replace(/^"|"$/g, '');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
