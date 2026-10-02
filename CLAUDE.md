# Frame Lab: handoff for Claude Code

Frame Lab is a front-end web app for Super Smash Bros. Melee. You pick a character, pick a
move, and see a looping clip of it with its frame data. A toggleable Trajectory Lab shows a
stage, takes the victim's percent and a DI input from an on-screen joystick, and draws where
the victim gets launched and whether they cross a blast zone (lose a stock).

Steps 1 and 2 of the plan are done: the scaffold, themes, and a clickable layout with real
data for Fox and Marth. Your job starts at step 3, the knockback and DI engine.

## Commands

```bash
npm install
npm run dev            # Vite dev server
npm test               # Vitest, run once (npm run test:watch to watch)
npm run lint           # ESLint
npm run typecheck      # tsc -b
npm run build          # typecheck + production build
npm run format         # Prettier
npm run import:data    # all 26 characters; add `-- --only fox,marth` for specific ones
```

Before calling any task done, run `npm run typecheck && npm run lint && npm test && npm run build`.
All four passed at handoff with 26 tests.

## Stack

| Tool | Version | Notes |
| --- | --- | --- |
| Vite | 8 | |
| React | 19 | |
| TypeScript | ~6.0.3 | Pinned. Do not upgrade to 7: typescript-eslint requires TypeScript below 6.1. |
| Mantine | 9 | `@mantine/core` and `@mantine/hooks` |
| Zustand | 5 | |
| Vitest | 5 | jsdom environment, Testing Library |
| Fonts | | Oxanium (display), IBM Plex Sans (body), IBM Plex Mono (numbers), self-hosted through @fontsource |

## Code conventions

The owner's top priority is code that a person can read and review easily.

- **Naming and size.** Use clear names, small focused functions, and a short doc comment explaining why on anything that isn't obvious. Avoid clever one-liners.
- **Folders.** Each feature folder keeps its components, `*.module.css`, and tests together. Pure logic goes in plain `.ts` files with no React.
- **Colors come from tokens only.** Every color is a token in `src/features/theme/palettes.ts`, exposed as a CSS variable (`surface` becomes `var(--fl-surface)`). Never hard-code a color in a component or CSS module. If you need a new color, add the token to all three palettes; a test checks that the palettes stay in sync.
- **Mantine for standard controls.** Use Mantine's Select, Switch, SegmentedControl, NumberInput, Button, and similar. Build custom components only when Mantine doesn't fit; the roster drawer and the joystick are custom.
- **State.** Shared state lives in `src/state/selectionStore.ts`. Components read single fields with selectors, for example `useSelectionStore((s) => s.moveId)`.
- **Formatting.** Prettier is set to single quotes, semicolons, trailing commas, and 100 columns.
- **Accessibility.**
  - Every control has a label.
  - Every icon-only button has an `aria-label`.
  - Focus is visible.
  - `respectReducedMotion` is on in the Mantine theme.
- **Tests.** Logic gets unit tests. `src/app/App.test.tsx` tests user-visible behavior through `renderWithProviders`, which runs Mantine in test mode with no transitions or portals.

## Architecture

```
scripts/import-fightcore.mjs   FightCore + libmelee → src/data/characters/<id>.json
src/data/
  roster.json                  26 characters (id, name, shortName, source keys). Shared with the import script.
  types.ts                     CharacterData, Move, Hit, Hitbox, Stage, Platform
  characters.ts                Loads characters/*.json with import.meta.glob; lookups; move grouping
  stages.ts                    Six legal stages: blast zones, edgeX, platforms
src/features/
  theme/                       palettes.ts (tokens), mantineTheme.ts (theme + CSS variables), ThemeProvider
  header/                      Wordmark, Theme select, Trajectory Lab switch
  characters/                  CharacterPanel, CharacterIcon (falls back to a letter), RosterDrawer
  moves/                       MoveList, MoveViewer, MoveClip, FrameStrip, FrameDataPanel, frameTimeline.ts
  trajectory/                  TrajectoryLabPanel, StageView (SVG in game units, y negated)
src/state/selectionStore.ts    characterId, moveId, hitIndex, stageId, isRosterOpen, isTrajectoryLabOpen
src/app/                       App (Mantine AppShell: 64px header, 250px navbar), AppProviders
```

Behavior worth knowing before you change things:

- **Adding characters.** Any JSON file added to `src/data/characters/` is picked up automatically. Characters without data still appear in the roster, dimmed, with an empty state that shows the import command.
- **Roster drawer position.** It is fixed-position next to the navbar, using AppShell's `--app-shell-header-height` and `--app-shell-navbar-width` variables. If you change the shell dimensions, the drawer follows.
- **Clip files.** The player looks for `public/clips/<characterId>/<moveId>.mp4` and counts frames as `floor(currentTime * 60) + 1`. It assumes a clip's first frame is the move's frame 1.
- **Icon files.** Icons are `public/icons/characters/<characterId>.png`, 24 × 24 pixel art, shown at exactly 24px and 48px with `image-rendering: pixelated`.
- **Saved preferences.** The only localStorage key is `frame-lab:theme`.

## Data sources and known quirks

- **Moves, hitboxes, and weight:** from FightCore frame-data (GPL-3.0). The owner should review the GPL before publishing with the data bundled in.
- **Gravity, fall speed, and fast-fall speed:** from libmelee `characterdata.csv` (LGPL-3.0). FightCore's `gravity` field actually holds fall speed, so the importer ignores it. A test fails if gravity is ever 1 or higher.
- **Stage geometry:** from libmelee `stages.py`.
  - Yoshi's Story has asymmetric side blast zones (−175.7 and 173.6). This is correct, not a typo.
  - Fountain of Dreams side platforms move during a match. They are drawn at a nominal height of 20, marked in the code as display-only.
- **Hits without frame windows.** Some FightCore hits have no window, for example Fox's back air ("clean" and "late") and his up special. These have `startFrame`/`endFrame` set to `null`. For a single-hit move, the importer falls back to the move's active frames.
- **Missing values.** A few totals and active frames are missing (Rapid Jabs, Pummel, some Marth throws). These display as "—".

## Design reference

The approved layout is board D ("Merged workstation") on the design canvas. The three themes are:

- **Menu Paper** (default, light)
- **Final Destination** (navy and amber)
- **Hitbox** (black, red, and blue)

Trajectory tokens already exist in all three palettes:

| Token | Use |
| --- | --- |
| `di` | Path with the chosen DI |
| `ghost` | Faint no-DI path behind it |
| `victim` | Victim's starting dot |
| `danger` / `danger-bg` | Blast zone and KO result |
| `gate-fill` / `gate-stroke` | Joystick gate, if you add them as tokens (the mockup used these names) |

The mockup's Trajectory Lab is laid out as:

- stage drawing on top
- joystick bottom-left with an angle readout
- inputs for victim, percent, and a crouch-cancel checkbox
- two result cards: "No DI" and "With this DI"

## Remaining steps

### Step 3: knockback and DI engine (`src/engine/`)

Write this as pure TypeScript with no React, fully unit-tested before any UI uses it.

**Verify the details before coding.** Check each mechanic against SmashWiki's Melee knockback, DI, and hitstun pages and against ikneedata.com's calculator. Note the source in a comment next to each constant. The values below are the plan's starting point, not verified facts.

- **Knockback (scaling).** `p` is the victim's percent after the hit, `d` damage, `w` weight, `s` knockback growth, `b` base knockback, `r` ratio:
  `kb = ((((p/10 + p*d/20) * 200/(w+100) * 1.4) + 18) * s/100 + b) * r`
- **Set knockback.** Hitboxes with `setKnockback > 0` use a variant of the formula where the damage term is fixed. Confirm its exact form, and how `isWeightIndependent` affects it.
- **Crouch cancel.** Multiplies knockback by about 2/3. Confirm the exact multiplier.
- **Hitstun:** `floor(kb * 0.4)` frames.
- **Tumble:** happens at `kb >= 80`.
- **Launch speed.** Initial speed is `kb * 0.03` units per frame along the launch angle. It decays by about 0.051 per frame along that same direction.
- **Gravity.** The victim's own vertical velocity builds up by `gravity` each frame, capped at `fallSpeed`. Each frame's position change is the launch velocity plus that vertical velocity. Confirm whether fast-fall is possible during hitstun; it should not be.
- **Sakurai angle (361).** Grounded and aerial victims get different angles, and the result also depends on knockback for grounded victims. Look up the exact thresholds.
- **DI.** Rotates the launch angle by up to 18°, based on how far the stick is perpendicular to the launch direction. Confirm:
  - the scaling curve (linear or squared)
  - the stick deadzone
  - how stick values map to the −80..80 range
- **Blast zones.**
  - **Sides and bottom:** a KO happens as soon as the victim crosses them.
  - **Top:** confirm the condition (the victim must still be in tumble/hitstun, with enough upward speed).
  - Return the frame the KO happens and where, or "survives" with the hitstun end position.
- **Later, optional:** ASDI, ground bounce or tech, staleness.

Suggested API:

```ts
calculateKnockback(input): number
resolveLaunchAngle(angle, { knockback, isGrounded, stick }): number
simulateLaunch({ knockback, angle, start, victim, stage }): { path: Point[]; hitstunFrames; outcome }
```

`outcome` is either `{ type: 'ko', side, frame }` or `{ type: 'survives', hitstunEnd }`.

**Tests.** Include regression cases against known kill percents from ikneedata. For example, compare the engine's kill percent for Fox up smash against Marth on Final Destination with no DI to ikneedata's result. Also test the edge cases: a stick inside the deadzone, an angle of 361, and set knockback.

### Step 4: joystick (`src/features/trajectory/Joystick.tsx`)

- **Props:** `{ value: { x, y }, onChange }`, with values clamped to magnitude 1.
- **Drawing:** an SVG octagonal gate like the GameCube stick, with a dashed deadzone ring.
- **Input:** pointer events with `setPointerCapture`, so mouse and touch both work.
- **Behavior:**
  - The stick snaps back to neutral on release, unless a lock toggle is on.
  - Arrow keys nudge it when it has focus.
  - A "Reset to neutral" button returns it to center.
- **Readout:** the angle in degrees and the raw −80..80 coordinates.
- **Optional:** a `useGamepad` hook that polls the Gamepad API in `requestAnimationFrame`, so a real controller can drive the stick.

### Step 5: wire up the Trajectory Lab

In `TrajectoryLabPanel`, add:

- **Inputs:** victim select (characters with data only), percent `NumberInput`, crouch-cancel checkbox, the joystick, and a picker for which hitbox to use. Default to the strongest hitbox of the selected hit.
- **Drawing in `StageView`:** the faint no-DI ghost path, the DI path with frame dots, a ring where hitstun ends, and a KO marker where a blast zone is crossed.
- **Results:** two cards, "No DI" and "With this DI".
- **Store:** put the new state (victim, percent, stick, crouch cancel) in `selectionStore` or a small store of its own.
- **Moves without hitboxes:** show a short explanation instead of the controls.

### Step 6: content

The owner will drop icons and clips into `public/`; no code changes are needed for those. Run `npm run import:data` for the full roster, then spot-check a few characters against FightCore or meleeframedata.com.

## Please don't

- Upgrade TypeScript to 7 (see the Stack table).
- Hard-code colors (see Code conventions).
- Link to icons or clips on other sites. Assets go in `public/`.
- Replace Mantine controls with hand-built ones without a reason.
- Add another state library.
