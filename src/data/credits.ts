/**
 * Credits and license details shown in the app: the clip credit under the player and the
 * About dialog. The README's "Sources and licenses" table covers the same sources.
 */

/**
 * Move clips come from Emi House's clip pack, linked from FightCore. The pack's notes say:
 * "Do as you please with them! Just give proper credit if you can."
 */
export const CLIP_CREDIT = {
  author: 'Emi House',
  url: 'https://drive.google.com/drive/folders/14rcZ8ed43hWOJaxQhHsB-hcAgxWubRaz',
};

/**
 * Frame Lab is GPL-3.0 because it bundles FightCore's GPL-3.0 frame data. The GPL asks that
 * people using the app can get its source, so the About dialog links here.
 */
export const SOURCE_CODE_URL = 'https://github.com/MWight20/frame-lab';
export const APP_LICENSE = {
  name: 'GNU GPL v3.0 or later',
  url: 'https://www.gnu.org/licenses/gpl-3.0.html',
};

export interface DataCredit {
  /** What the source provides, for example "Moves, hitboxes and weight". */
  what: string;
  source: string;
  url: string;
  license: string;
}

export const DATA_CREDITS: DataCredit[] = [
  {
    what: 'Moves, hitboxes and weight',
    source: 'FightCore frame-data',
    url: 'https://github.com/FightCore/frame-data',
    license: 'GPL-3.0',
  },
  {
    what: 'Gravity, fall speeds and stage geometry',
    source: 'libmelee',
    url: 'https://github.com/altf4/libmelee',
    license: 'LGPL-3.0',
  },
  {
    what: 'Move clips',
    source: `${CLIP_CREDIT.author}'s clip pack`,
    url: CLIP_CREDIT.url,
    license: 'Free to use with credit',
  },
  {
    what: 'Character icons',
    source: 'SmashWiki',
    url: 'https://www.ssbwiki.com/Category:Head_icons_(SSBM)',
    license: 'Credited to SmashWiki',
  },
];

export const NINTENDO_DISCLAIMER =
  'Frame Lab is a fan project, not affiliated with or endorsed by Nintendo. Super Smash Bros. ' +
  'Melee and its characters, icons and footage are trademarks and copyrights of Nintendo.';
