import { createContext, useContext } from 'react';
import type { PaletteId } from './palettes';

export interface PaletteContextValue {
  paletteId: PaletteId;
  setPaletteId: (paletteId: PaletteId) => void;
}

export const PaletteContext = createContext<PaletteContextValue | null>(null);

/** The active theme and a setter. Must be used inside `ThemeProvider`. */
export function usePalette(): PaletteContextValue {
  const value = useContext(PaletteContext);
  if (!value) throw new Error('usePalette must be used inside <ThemeProvider>');
  return value;
}
