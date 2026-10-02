# Frame Lab

A frame data viewer and knockback/DI lab for Super Smash Bros. Melee, built with React,
TypeScript and Mantine.

This is the starting point (steps 1 and 2): the full page layout, three switchable themes,
the roster drawer, the move list, a clip player, the frame strip and frame data panels, and
a Trajectory Lab panel that draws each tournament stage and its blast zones. The knockback
engine, the joystick and the launch paths come next.

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173).

| Script                | What it does                                               |
| --------------------- | ---------------------------------------------------------- |
| `npm run dev`         | Start the dev server with hot reload                       |
| `npm run build`       | Type-check and build to `dist/`                            |
| `npm run preview`     | Serve the production build locally                         |
| `npm test`            | Run the tests once (`npm run test:watch` to keep watching) |
| `npm run lint`        | Run ESLint                                                 |
| `npm run format`      | Format everything with Prettier                            |
| `npm run import:data` | Download and convert frame data (see below)                |

## Project layout

```
scripts/
  import-fightcore.mjs     Builds src/data/characters/*.json from FightCore + libmelee
public/
  icons/characters/        Character icons you add (see the README inside)
  clips/                   Move clips you add (see the README inside)
src/
  app/                     App shell and providers
  data/                    Types, roster, stages, and generated character JSON
  features/
    characters/            Character panel, icon, roster drawer
    header/                Title bar, theme select, Trajectory Lab switch
    moves/                 Move list, clip player, frame strip, frame data
    theme/                 Palettes and the Mantine theme built from them
    trajectory/            Trajectory Lab panel and stage drawing
  state/selectionStore.ts  Selected character, move, hit, stage and open panels
  test/                    Test setup and helpers
```

Each feature folder keeps its components, styles (`*.module.css`) and tests together.

## Themes

The three themes live in `src/features/theme/palettes.ts` as named color tokens. Each token
becomes a CSS variable (`surface` → `var(--fl-surface)`), and components only ever use those
variables, so switching themes never needs component changes. The choice is saved in the
browser's localStorage. To add a theme, copy one palette object, give it a new id, and it
shows up in the Theme menu.

## Data

### Adding more characters

Fox and Marth are included as samples. To import every character:

```bash
npm run import:data
```

Or just some of them, by the ids in `src/data/roster.json`:

```bash
npm run import:data -- --only falco,sheik,peach
```

New files in `src/data/characters/` are picked up automatically. Characters without data
still appear in the roster, dimmed, with a message explaining how to import them.

### Sources and licenses

| Data                                 | Source                                                            | License                                              |
| ------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------- |
| Moves, hitboxes, weight              | [FightCore frame-data](https://github.com/FightCore/frame-data)   | GPL-3.0                                              |
| Gravity, fall speed, fast-fall speed | [libmelee](https://github.com/altf4/libmelee) `characterdata.csv` | LGPL-3.0                                             |
| Blast zones, ledges, platforms       | [libmelee](https://github.com/altf4/libmelee) `stages.py`         | LGPL-3.0                                             |
| Character icons (once added)         | [SmashWiki](<https://www.ssbwiki.com/Category:Head_icons_(SSBM)>) | Credit SmashWiki; the art itself belongs to Nintendo |

FightCore's data is GPL-3.0. Check what that license asks of you before publishing the app
with the data bundled in.

### Known data quirks

- FightCore's `gravity` field actually holds fall speed (Fox shows 2.8, his fall speed).
  The importer takes gravity, fall speed and fast-fall speed from libmelee instead, and a
  test fails if a gravity value above 1 ever sneaks back in.
- Some hits have no frame window in FightCore (for example Fox's back air, which is split
  into "clean" and "late"). The importer keeps their hitbox values; when a move has only one
  hit, it uses the move's active frames for that hit.
- A few totals are missing (Rapid Jabs, Pummel), and some of Marth's throws have no active
  frames. Those show as "—".
- The Fountain of Dreams side platforms move during a match. They are drawn at a nominal
  height that is marked as such in `src/data/stages.ts`.

## Adding assets

- **Icons:** see `public/icons/characters/README.md`.
- **Clips:** see `public/clips/README.md`.

Both are optional. The app shows a letter in place of a missing icon and a short note in
place of a missing clip.
