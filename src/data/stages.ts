import type { Platform, Stage, StageSurface } from './types';

/**
 * Tournament-legal stages.
 *
 * Blast zones, edge positions and platform positions come from libmelee's stages.py
 * (https://github.com/altf4/libmelee, LGPL-3.0), which reads them from the game.
 * Cross-check against SmashWiki stage pages when adding or changing values.
 *
 * Coordinates are in game units: x grows to the right, y grows upward, and the main
 * floor sits at y = 0.
 */
export const STAGES: Stage[] = [
  {
    id: 'final-destination',
    name: 'Final Destination',
    shortName: 'FD',
    blastZones: { left: -246, right: 246, top: 188, bottom: -140 },
    edgeX: 85.5657,
    platforms: [],
  },
  {
    id: 'battlefield',
    name: 'Battlefield',
    shortName: 'BF',
    blastZones: { left: -224, right: 224, top: 200, bottom: -108.8 },
    edgeX: 68.4,
    platforms: [
      { y: 27.2, left: -57.6, right: -20 },
      { y: 27.2, left: 20, right: 57.6 },
      { y: 54.4, left: -18.8, right: 18.8 },
    ],
  },
  {
    id: 'yoshis-story',
    name: "Yoshi's Story",
    shortName: 'YS',
    // The left and right blast zones really are slightly different on this stage.
    blastZones: { left: -175.7, right: 173.6, top: 168, bottom: -91 },
    edgeX: 56,
    platforms: [
      { y: 23.45, left: -59.5, right: -28 },
      { y: 23.45, left: 28, right: 59.5 },
      { y: 42, left: -15.75, right: 15.75 },
    ],
  },
  {
    id: 'dream-land',
    name: 'Dream Land',
    shortName: 'DL',
    blastZones: { left: -255, right: 255, top: 250, bottom: -123 },
    edgeX: 77.2713,
    platforms: [
      { y: 30.1422, left: -61.3929, right: -31.7254 },
      { y: 30.2426, left: 31.7036, right: 63.0745 },
      { y: 51.4254, left: -19.0181, right: 19.0171 },
    ],
  },
  {
    id: 'fountain-of-dreams',
    name: 'Fountain of Dreams',
    shortName: 'FoD',
    blastZones: { left: -198.75, right: 198.75, top: 202.5, bottom: -146.25 },
    edgeX: 63.3475,
    platforms: [
      // The side platforms rise and fall during a match. These heights are a nominal
      // resting position for drawing only, not values read from the game.
      { y: 20, left: -49.5, right: -21, isMoving: true },
      { y: 20, left: 21, right: 49.5, isMoving: true },
      { y: 42.75, left: -14.25, right: 14.25 },
    ],
  },
  {
    id: 'pokemon-stadium',
    name: 'Pokémon Stadium',
    shortName: 'PS',
    blastZones: { left: -230, right: 230, top: 180, bottom: -111 },
    edgeX: 87.75,
    platforms: [
      { y: 25, left: -55, right: -25 },
      { y: 25, left: 25, right: 55 },
    ],
  },
];

export const DEFAULT_STAGE_ID = 'final-destination';

export function getStage(stageId: string): Stage {
  return STAGES.find((stage) => stage.id === stageId) ?? STAGES[0]!;
}

/**
 * Every surface a character can land on, main stage first. Platforms are named by
 * position, which is how players refer to them.
 */
export function getStageSurfaces(stage: Pick<Stage, 'edgeX' | 'platforms'>): StageSurface[] {
  const mainStage = { name: 'Main stage', y: 0, left: -stage.edgeX, right: stage.edgeX };
  const platforms = stage.platforms.map((platform) => ({
    name: platformName(platform, stage.platforms),
    y: platform.y,
    left: platform.left,
    right: platform.right,
  }));
  return [mainStage, ...platforms];
}

function platformName(platform: Platform, allPlatforms: Platform[]): string {
  const isHighest = allPlatforms.every((other) => other.y <= platform.y);
  const center = (platform.left + platform.right) / 2;
  if (isHighest && Math.abs(center) < 1) return 'Top platform';
  return center < 0 ? 'Left platform' : 'Right platform';
}
