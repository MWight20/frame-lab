import {
  createTheme,
  type CSSVariablesResolver,
  type MantineColorsTuple,
  type MantineThemeOverride,
} from '@mantine/core';
import type { Palette, PaletteTokens } from './palettes';

const FONT_BODY = '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif';
const FONT_DISPLAY = 'Oxanium, "IBM Plex Sans", system-ui, sans-serif';
const FONT_MONO = '"IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace';

/**
 * Builds the Mantine theme for a palette. Mantine components (inputs, switches,
 * segmented controls) take their accent from `primaryColor`; our own components
 * read the palette tokens through CSS variables (see `paletteCssVariables`).
 */
export function buildMantineTheme(palette: Palette): MantineThemeOverride {
  const { tokens } = palette;
  return createTheme({
    primaryColor: 'accent',
    primaryShade: 6,
    autoContrast: true,
    respectReducedMotion: true,
    colors: {
      accent: buildColorTuple(tokens.accent),
      // Mantine's dark color scheme draws surfaces from the "dark" scale.
      dark: buildDarkScale(tokens),
    },
    fontFamily: FONT_BODY,
    fontFamilyMonospace: FONT_MONO,
    headings: { fontFamily: FONT_DISPLAY, fontWeight: '600' },
    defaultRadius: 'md',
    other: { tokens },
  });
}

/** Turns palette tokens into `--fl-*` CSS variables and points Mantine's own variables at them. */
export const paletteCssVariables: CSSVariablesResolver = (theme) => {
  const tokens = theme.other.tokens as PaletteTokens;

  const flVariables = Object.fromEntries(
    Object.entries(tokens).map(([name, value]) => [`--fl-${toKebabCase(name)}`, value]),
  );

  const mantineOverrides = {
    '--mantine-color-body': tokens.bg,
    '--mantine-color-text': tokens.text,
    '--mantine-color-dimmed': tokens.muted,
    '--mantine-color-default': tokens.surface,
    '--mantine-color-default-border': tokens.border,
    '--mantine-color-default-hover': tokens.surfaceRaised,
    '--mantine-color-anchor': tokens.link,
  };

  return {
    variables: {
      ...flVariables,
      '--fl-font-display': FONT_DISPLAY,
      '--fl-font-mono': FONT_MONO,
    },
    light: mantineOverrides,
    dark: mantineOverrides,
  };
};

/** A 10-shade scale with the given color at shade 6, lighter shades before it, darker after. */
function buildColorTuple(base: string): MantineColorsTuple {
  const tints = [0.9, 0.78, 0.64, 0.48, 0.32, 0.16].map((amount) =>
    mixHex(base, '#FFFFFF', amount),
  );
  const shades = [0.14, 0.28, 0.42].map((amount) => mixHex(base, '#000000', amount));
  return [...tints, base, ...shades] as unknown as MantineColorsTuple;
}

/** Mantine's dark scale runs from light text (0) to the page background (7) and darker. */
function buildDarkScale(tokens: PaletteTokens): MantineColorsTuple {
  return [
    tokens.text,
    mixHex(tokens.text, tokens.muted, 0.5),
    tokens.muted,
    mixHex(tokens.muted, tokens.border, 0.5),
    tokens.border,
    tokens.surfaceRaised,
    tokens.surface,
    tokens.bg,
    mixHex(tokens.bg, '#000000', 0.2),
    mixHex(tokens.bg, '#000000', 0.4),
  ] as unknown as MantineColorsTuple;
}

/** Blends two #RRGGBB colors. `amount` 0 returns `from`, 1 returns `to`. */
export function mixHex(from: string, to: string, amount: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const mixed = a.map((channel, i) => Math.round(channel + (b[i]! - channel) * amount));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function toKebabCase(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
