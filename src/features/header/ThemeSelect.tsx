import { Select } from '@mantine/core';
import { usePalette } from '../theme/paletteContext';
import { isPaletteId, PALETTE_OPTIONS } from '../theme/palettes';
import classes from './AppHeader.module.css';

interface ThemeSelectProps {
  /** In the header it uses the header's colors; on phones it sits in the move list panel. */
  inHeader: boolean;
}

/** Picks one of the three color themes. */
export function ThemeSelect({ inHeader }: ThemeSelectProps) {
  const { paletteId, setPaletteId } = usePalette();

  const select = (
    <Select
      id={inHeader ? 'theme-select' : undefined}
      label={inHeader ? undefined : 'Theme'}
      data={PALETTE_OPTIONS}
      value={paletteId}
      onChange={(value) => {
        if (isPaletteId(value)) setPaletteId(value);
      }}
      allowDeselect={false}
      checkIconPosition="right"
      classNames={inHeader ? { input: classes.selectInput } : undefined}
    />
  );

  if (!inHeader) return select;

  // The header lays its label out beside the input rather than above it.
  return (
    <div className={classes.control}>
      <label htmlFor="theme-select">Theme</label>
      {select}
    </div>
  );
}
