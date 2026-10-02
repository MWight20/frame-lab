import { MantineProvider } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { useMemo, type ReactNode } from 'react';
import { buildMantineTheme, paletteCssVariables } from './mantineTheme';
import { PaletteContext } from './paletteContext';
import { DEFAULT_PALETTE_ID, isPaletteId, PALETTES, type PaletteId } from './palettes';

interface ThemeProviderProps {
  children: ReactNode;
  /** Mantine's "test" environment turns off transitions and portals. */
  env?: 'default' | 'test';
}

/** Provides the selected palette to Mantine and remembers the choice in localStorage. */
export function ThemeProvider({ children, env = 'default' }: ThemeProviderProps) {
  const [storedPaletteId, setPaletteId] = useLocalStorage<PaletteId>({
    key: 'frame-lab:theme',
    defaultValue: DEFAULT_PALETTE_ID,
    getInitialValueInEffect: false,
  });

  const paletteId = isPaletteId(storedPaletteId) ? storedPaletteId : DEFAULT_PALETTE_ID;
  const palette = PALETTES[paletteId];
  const theme = useMemo(() => buildMantineTheme(palette), [palette]);
  const contextValue = useMemo(() => ({ paletteId, setPaletteId }), [paletteId, setPaletteId]);

  return (
    <PaletteContext.Provider value={contextValue}>
      <MantineProvider
        theme={theme}
        forceColorScheme={palette.colorScheme}
        cssVariablesResolver={paletteCssVariables}
        env={env}
      >
        {children}
      </MantineProvider>
    </PaletteContext.Provider>
  );
}
