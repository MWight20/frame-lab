import { Select, Switch } from '@mantine/core';
import { useSelectionStore } from '../../state/selectionStore';
import { usePalette } from '../theme/paletteContext';
import { isPaletteId, PALETTE_OPTIONS } from '../theme/palettes';
import classes from './AppHeader.module.css';

/**
 * The logo is a finished image with its own colors and dark panel, so it is served from
 * public/brand/ rather than drawn with theme tokens. All three themes have a dark header,
 * which it was designed to sit on.
 */
const LOGO_SRC = `${import.meta.env.BASE_URL}brand/frame-lab-melee-logo.svg`;

export function AppHeader() {
  return (
    <header className={classes.header}>
      <img className={classes.logo} src={LOGO_SRC} alt="Frame Lab for Melee 1.02" />
      <ThemeSelect />
      <TrajectoryLabSwitch />
    </header>
  );
}

function ThemeSelect() {
  const { paletteId, setPaletteId } = usePalette();

  return (
    <div className={classes.control}>
      <label htmlFor="theme-select">Theme</label>
      <Select
        id="theme-select"
        data={PALETTE_OPTIONS}
        value={paletteId}
        onChange={(value) => {
          if (isPaletteId(value)) setPaletteId(value);
        }}
        allowDeselect={false}
        checkIconPosition="right"
        classNames={{ input: classes.selectInput }}
      />
    </div>
  );
}

function TrajectoryLabSwitch() {
  const isOpen = useSelectionStore((state) => state.isTrajectoryLabOpen);
  const setOpen = useSelectionStore((state) => state.setTrajectoryLabOpen);

  return (
    <Switch
      label="Trajectory Lab"
      labelPosition="left"
      size="md"
      checked={isOpen}
      onChange={(event) => setOpen(event.currentTarget.checked)}
      classNames={{ label: classes.switchLabel }}
    />
  );
}
