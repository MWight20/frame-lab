# Frame Lab: handoff for Claude Code

Frame Lab is a front-end web app for Super Smash Bros. Melee. You pick a character, pick a
move, and see a looping clip of it with its frame data. A toggleable Trajectory Lab shows a
stage, takes the victim's percent and a DI input from an on-screen joystick, and draws where
the victim gets launched: whether they cross a blast zone (lose a stock), land on the stage,
or survive.

The original six-step plan is complete: all 26 characters have frame data and icons, most
moves have clips, and the knockback engine covers DI, staleness and landing with techs.
What's left is optional; see "Open work" at the end.

## Commands

```bash
npm install
npm run dev            # Vite dev server
npm test               # Vitest, run once (npm run test:watch to watch)
npm run lint           # ESLint
npm run typecheck      # tsc -b
npm run build          # typecheck + production build
npm run format         # Prettier (format:check to check only)
npm run import:data    # all 26 characters; add `-- --only fox,marth` for specific ones
npm run rename:clips   # preview renaming clip-pack files to move ids; add `-- --apply` to rename
```

Before calling any task done, run
`npm run typecheck && npm run lint && npm test && npm run build && npm run format:check`.
All five passed at the last update, with 176 tests, and the build prints no warnings.

## Git workflow

- `develop` is the base branch. Work on a feature branch and open a PR into `develop`.
- The GitHub CLI isn't installed on the owner's machine. Push the branch, then give the owner a
  `https://github.com/MWight20/frame-lab/compare/develop...<branch>?expand=1` link with a
  title and description to paste.
- `.gitattributes` keeps LF line endings in the working tree. Without it, `core.autocrlf` on
  Windows checks files out as CRLF and `format:check` fails on files nobody changed.

## Stack

| Tool       | Version | Notes                                                                                             |
| ---------- | ------- | ------------------------------------------------------------------------------------------------- |
| Vite       | 8       | Plus a small local plugin, `vite/clipManifestPlugin.ts`                                           |
| React      | 19      |                                                                                                   |
| TypeScript | ~6.0.3  | Pinned. Do not upgrade to 7: typescript-eslint requires TypeScript below 6.1.                     |
| Mantine    | 9       | `@mantine/core` and `@mantine/hooks`                                                              |
| Zustand    | 5       |                                                                                                   |
| Vitest     | 5       | jsdom environment, Testing Library                                                                |
| Fonts      |         | Oxanium (display), IBM Plex Sans (body), IBM Plex Mono (numbers), self-hosted through @fontsource |

## Code conventions

The owner's top priority is code that a person can read and review easily.

- **Naming and size.** Use clear names, small focused functions, and a short doc comment explaining why on anything that isn't obvious. Avoid clever one-liners.
- **Folders.** Each feature folder keeps its components, `*.module.css`, and tests together. Pure logic goes in plain `.ts` files with no React.
- **Colors come from tokens only.** Every color is a token in `src/features/theme/palettes.ts`, exposed as a CSS variable (`surface` becomes `var(--fl-surface)`). Never hard-code a color in a component or CSS module. If you need a new color, add the token to all three palettes; a test checks that the palettes stay in sync. The one exception is the logo, `public/brand/frame-lab-melee-logo.svg`, a finished image with its own colors.
- **Mantine for standard controls.** Use Mantine's Select, Switch, SegmentedControl, NumberInput, Button, and similar. Build custom components only when Mantine doesn't fit; the roster drawer and the joystick are custom.
- **State.** Shared state lives in `src/state/selectionStore.ts`; settings only the Trajectory Lab uses live in `src/state/trajectoryStore.ts`. Components read single fields with selectors, for example `useSelectionStore((s) => s.moveId)`.
- **Formatting.** Prettier is set to single quotes, semicolons, trailing commas, and 100 columns.
- **Accessibility.**
  - Every control has a label.
  - Every icon-only button has an `aria-label`.
  - Focus is visible.
  - `respectReducedMotion` is on in the Mantine theme.
- **Tests.** Logic gets unit tests. `src/app/App.test.tsx` tests user-visible behavior through `renderWithProviders`, which runs Mantine in test mode with no transitions or portals.
- **Engine sources.** Every physics constant in `src/engine/constants.ts` cites where its value comes from (the Melee decompilation, ikneedata's calculator, SmashWiki). Keep doing that.

## Architecture

```
scripts/import-fightcore.mjs   FightCore + libmelee → src/data/characters/<id>.json
scripts/rename-clips.mjs       Clip-pack file names → move ids
vite/clipManifestPlugin.ts     virtual:clip-manifest: the list of files in public/clips, made at dev start and build
src/data/
  roster.json                  26 characters (id, name, shortName, source keys). Shared with the import script.
  characters/<id>.json         Generated frame data for all 26 characters
  types.ts                     CharacterData, Move, Hit, Hitbox, Stage, Platform, StageSurface
  characters.ts                Loads characters/*.json on demand (one chunk each) and caches them; lookups;
                               move grouping
  clips.ts                     findClip: which clip file (or variant) plays for a move
  credits.ts                   Credits, source link and license shown in the UI
  stages.ts                    Six legal stages: blast zones, edgeX, platforms; getStageSurfaces
src/engine/                    Pure TS, no React:
  knockback.ts                 Knockback (scaling and set), crouch cancel, hitstun, tumble
  staleness.ts                 Stale-move queue and damage multiplier
  launchAngle.ts, stick.ts     Sakurai angle, facing, DI; reading the stick
  simulateLaunch.ts            Frame-by-frame flight: KO, landing, or survives
  stageCollision.ts            Landing on the main stage and platforms (from above only)
  killPercent.ts               simulateHit (whole chain for one hit) and findKillPercent
src/features/
  theme/                       palettes.ts (tokens), mantineTheme.ts (theme + CSS variables), ThemeProvider
  header/                      Logo, ThemeSelect, Trajectory Lab switch, About dialog (license, source,
                               credits), menu button and PhoneSettings for phones
  characters/                  CharacterPanel, CharacterIcon (falls back to a letter), RosterDrawer,
                               useCharacterData (loads a character for a component)
  moves/                       MoveList, MoveViewer, MoveClip, FrameStrip, FrameDataPanel, frameTimeline.ts
  trajectory/                  TrajectoryLabPanel, StageView (SVG in game units, y negated),
                               Joystick + joystickGeometry.ts (pointer/keyboard → stick value),
                               labScenario.ts (pure: hitbox choice, pin snapping, runs the engine),
                               LaunchOverlay, VictimPin, LabControls, ResultCard
src/state/selectionStore.ts    characterId, moveId, hitIndex, stageId, isRosterOpen, isTrajectoryLabOpen,
                               isMoveListOpen (phones only)
src/state/trajectoryStore.ts   victimId, victimPercent, isCrouching, stick, hitboxName, victimPosition,
                               isAttackerFacingLeft, staleUses, techOnLanding (lab-only settings)
src/app/                       App (Mantine AppShell: 64px header, 250px navbar), AppProviders,
                               useIsPhone (below the `sm` breakpoint)
```

Behavior worth knowing before you change things:

- **Character data loads on demand.** Each `src/data/characters/<id>.json` is its own small chunk, downloaded the first time that character is shown (as attacker or victim) and cached. Components read it with `useCharacterData(id)` (`src/features/characters/`), which returns `ready`, `loading`, `failed` or `missing`; plain code can `await loadCharacterData(id)`. `getCharacterData(id)` only returns already-loaded data. Switching characters picks the move once the new data is in. Tests preload every character in `src/test/setup.ts`, so test code can call `getCharacterData` directly.
- **Bundle.** `vite.config.ts` splits React and Mantine into their own chunks (`codeSplitting` groups), so the app's own code is about 70 kB and no chunk passes Vite's 500 kB warning.
- **Adding characters.** Any JSON file added to `src/data/characters/` is picked up automatically. A roster character without data appears dimmed, with an empty state that shows the import command. Every character has data today, so the empty state is only tested with a made-up id.
- **Roster drawer position.** It is fixed-position next to the navbar, using AppShell's `--app-shell-header-height` and `--app-shell-navbar-width` variables. If you change the shell dimensions, the drawer follows. On phones it spans the full width, over the move list panel.
- **Phone layout.** Below Mantine's `sm` breakpoint (48em, 768px; `useIsPhone` and the AppShell navbar breakpoint must agree) the navbar collapses into a full-width panel behind a menu button in the header. Picking a move closes it. The header keeps only the menu button, a 40px logo and the lab switch (its label visually hidden); the theme picker and About move to `PhoneSettings` at the bottom of the panel. Stat grids drop to 2 and 3 columns. CSS uses `$mantine-breakpoint-sm` from `postcss.config.cjs`.
- **Clip files.** Clips are `public/clips/<characterId>/<moveId>.mp4`. The page only knows about files that existed when the dev server started or the app was built (the clip manifest); in dev, adding or removing a clip reloads the page. Moves without a clip show a "No clip" tag and no player. The player counts frames as `floor(currentTime * 60) + 1` and assumes a clip's first frame is the move's frame 1. It defaults to ¼ speed.
- **Icon files.** Icons are `public/icons/characters/<characterId>.png`, 24 × 24 pixel art, shown at exactly 24px and 48px with `image-rendering: pixelated`.
- **Joystick.** "Hold position" is on by default, so a DI choice stays put. The deadzone is drawn as a dashed square because the game zeroes each axis separately. Shift + arrow moves one controller step (1/80).
- **Victim pin.** Pressing or dragging on the stage moves the victim. Within 4 units of the main stage or a platform it snaps on and counts as grounded; anywhere else is airborne. The pin marks the victim, not the attacker: Melee's launch angle comes from the hitbox and facing, not positions.
- **Saved preferences.** The only localStorage key is `frame-lab:theme`.

## Engine decisions

Checked against the Melee decompilation (doldecomp/melee), ikneedata's calculator source and
SmashWiki. Kill percents in `killPercent.test.ts` match ikneedata exactly.

- `victimPercent` is the percent **before** the hit; the engine adds the damage.
- Crouch cancel is 2/3 (ikneedata uses 0.667). Set knockback still uses the victim's weight;
  `isWeightIndependent` means the same as `setKnockback > 0`. Throws use weight 100.
- Sakurai angle for airborne victims is 45° (SmashWiki; the decomp uses a separate constant);
  ikneedata uses 44°.
- **Staleness:** 9 slots weighted 0.09 down to 0.01, no freshness bonus. The staled damage
  goes into the victim's percent `p`, but `d` stays the full damage. Set knockback ignores
  staleness. The lab's "Stale uses" counts the most recent slots.
- **Landing:** surfaces block only from above, so victims fly up through platforms and land on
  them coming down. Landing ends the flight; Melee has no floor bounce for an airborne
  victim, only a tech or a knockdown. Only tumbling victims (knockback 80+) can tech.
- **Grounded downward hits:** tumbling victims bounce (vertical speed × 0.8) only when the
  launch points more than 10° into the floor; shallower hits land at once. Non-tumble
  victims stay on the floor.
- The simulation stops at a KO, a landing, or once hitstun is over and launch speed has
  decayed. So a KO or landing can come after hitstun; the result card says so.
- **Not modelled:** walls and ceilings (the stages' side and underside shapes aren't in the
  data, and the bounce speed threshold is unconfirmed), ASDI/SDI, tech-roll distance, the
  slide after landing, traction. Fountain of Dreams' moving platforms use a nominal height.

## Data sources and known quirks

- **Moves, hitboxes, and weight:** from FightCore frame-data (GPL-3.0). Because this data is bundled into the app, Frame Lab itself is GPL-3.0-or-later (`LICENSE`, `package.json`). The GPL asks that users can get the source, so the header's About dialog links to the GitHub repo; keep that link, and keep the repo public once the app is published. Credits shown in the app live in `src/data/credits.ts`.
- **Gravity, fall speed, and fast-fall speed:** from libmelee `characterdata.csv` (LGPL-3.0). FightCore's `gravity` field actually holds fall speed, so the importer ignores it. A test fails if gravity is ever 1 or higher.
- **Move clips:** from Emi House's clip pack (Google Drive, linked from FightCore), which says
  "Do as you please with them! Just give proper credit if you can." Keep the credit under the
  clip player (`src/data/credits.ts`) and in the README. `npm run rename:clips` converts the
  pack's names (`uSmash`, `AirNB`, `fSmashHi`) to move ids (`usmash`, `aneutralb`, `fsmash-hi`).
  Variants after a hyphen are played only when a move has no plain clip: a hand-picked one
  (`PREFERRED_VARIANTS` in `src/data/clips.ts`), else `-uncharged`, else the first
  alphabetically. The title row then shows which variant is playing. Grabs, pummels and
  throws have no clips in the pack.
- **Stage geometry:** from libmelee `stages.py`.
  - Yoshi's Story has asymmetric side blast zones (−175.7 and 173.6). This is correct, not a typo.
  - Fountain of Dreams side platforms move during a match. They use a nominal height of 20.
  - The shape drawn under each stage in `StageView` is decorative, not game geometry.
- **Hits without frame windows.** Some FightCore hits have no window, for example Fox's back air ("clean" and "late") and his up special. These have `startFrame`/`endFrame` set to `null`. For a single-hit move, the importer falls back to the move's active frames.
- **Placeholder moves.** FightCore has empty "Unknown_air" entries for Kirby and Pikachu (no
  frames, no hits). The importer skips any move whose id starts with `unknown`.
- **Missing values.** A few totals and active frames are missing (Rapid Jabs, Pummel, some Marth throws). These display as "—".

## Design reference

The approved layout is board D ("Merged workstation") on the design canvas. The three themes are:

- **Menu Paper** (default, light)
- **Final Destination** (navy and amber)
- **Hitbox** (black, red, and blue)

Trajectory tokens in all three palettes:

| Token                       | Use                                         |
| --------------------------- | ------------------------------------------- |
| `di`                        | Path with the chosen DI, its landing marker |
| `ghost`                     | Faint no-DI path behind it, its markers     |
| `victim`                    | Victim's starting dot                       |
| `danger` / `danger-bg`      | Blast zone and KO result                    |
| `gate-fill` / `gate-stroke` | Joystick gate and deadzone marker           |

## Open work

All optional, roughly in priority order:

1. **Gamepad.** A `useGamepad` hook polling the Gamepad API so a real controller can drive the
   DI stick.
2. **Engine:** walls and ceilings, ASDI/SDI, tech-roll distance, the slide after landing.
3. **Clips:** 147 moves have none, mostly grabs and throws. Only new footage changes this.

## Please don't

- Upgrade TypeScript to 7 (see the Stack table).
- Hard-code colors (see Code conventions).
- Link to icons or clips on other sites. Assets go in `public/`.
- Replace Mantine controls with hand-built ones without a reason.
- Add another state library.
