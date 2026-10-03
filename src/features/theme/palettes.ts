/**
 * The three Frame Lab color themes.
 *
 * Every color the app uses is a named token here. Components never hard-code colors:
 * they use the matching CSS variable, e.g. `var(--fl-surface)` for `surface`.
 * To add a theme, copy one of these objects and give it a new id.
 */

export interface PaletteTokens {
  bg: string;
  surface: string;
  surfaceRaised: string;
  rail: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  /** Text drawn on top of the accent color. */
  accentText: string;
  link: string;
  selectedBg: string;
  selectedText: string;
  headerBg: string;
  headerText: string;
  headerBorder: string;
  headerControl: string;
  clipBg: string;
  frameStartup: string;
  frameGap: string;
  frameRecovery: string;
  frameInterruptible: string;
  stageBg: string;
  stageFill: string;
  stageLine: string;
  ghost: string;
  di: string;
  victim: string;
  danger: string;
  dangerBg: string;
  /** Inside of the joystick's octagonal gate. */
  gateFill: string;
  /** Outline of the joystick's gate and its deadzone marker. */
  gateStroke: string;
  scrim: string;
}

export interface Palette {
  id: PaletteId;
  label: string;
  colorScheme: 'light' | 'dark';
  tokens: PaletteTokens;
}

export type PaletteId = 'menu-paper' | 'final-destination' | 'hitbox';

export const PALETTES: Record<PaletteId, Palette> = {
  'menu-paper': {
    id: 'menu-paper',
    label: 'Menu Paper',
    colorScheme: 'light',
    tokens: {
      bg: '#F3F1EA',
      surface: '#FFFFFF',
      surfaceRaised: '#ECE9DF',
      rail: '#FAF8F2',
      border: '#DDD9CC',
      text: '#1B1D22',
      muted: '#5A5F6B',
      accent: '#2F55D4',
      accentText: '#FFFFFF',
      link: '#2F55D4',
      selectedBg: '#1B1D22',
      selectedText: '#FFFFFF',
      headerBg: '#1B1D22',
      headerText: '#F3F1EA',
      headerBorder: '#3A3D45',
      headerControl: '#2B2E36',
      clipBg: '#1B1D22',
      frameStartup: '#C9C4B4',
      frameGap: '#E4E0D4',
      frameRecovery: '#8C8F99',
      frameInterruptible: '#B7B9C0',
      stageBg: '#FAF8F2',
      stageFill: '#1B1D22',
      stageLine: '#1B1D22',
      ghost: '#8C8F99',
      di: '#2F55D4',
      victim: '#E07A1F',
      danger: '#C4331F',
      dangerBg: '#FBEDEA',
      gateFill: '#ECE9DF',
      gateStroke: '#8C8F99',
      scrim: 'rgba(27, 29, 34, 0.28)',
    },
  },
  'final-destination': {
    id: 'final-destination',
    label: 'Final Destination',
    colorScheme: 'dark',
    tokens: {
      bg: '#0E1024',
      surface: '#171A36',
      surfaceRaised: '#20244A',
      rail: '#10132B',
      border: '#2E335E',
      text: '#ECEEFF',
      muted: '#9AA0C8',
      accent: '#F2B544',
      accentText: '#0E1024',
      link: '#F2B544',
      selectedBg: '#2A2748',
      selectedText: '#F2B544',
      headerBg: '#121530',
      headerText: '#ECEEFF',
      headerBorder: '#2E335E',
      headerControl: '#171A36',
      clipBg: '#07081A',
      frameStartup: '#3A3F6E',
      frameGap: '#262A52',
      frameRecovery: '#2F6F86',
      frameInterruptible: '#1F4556',
      stageBg: '#0A0C20',
      stageFill: '#20244A',
      stageLine: '#ECEEFF',
      ghost: '#9AA0C8',
      di: '#F2B544',
      victim: '#ECEEFF',
      danger: '#FF6B5B',
      dangerBg: '#2A1E24',
      gateFill: '#10132B',
      gateStroke: '#4A5090',
      scrim: 'rgba(4, 5, 14, 0.55)',
    },
  },
  hitbox: {
    id: 'hitbox',
    label: 'Hitbox',
    colorScheme: 'dark',
    tokens: {
      bg: '#0B0B0C',
      surface: '#151517',
      surfaceRaised: '#1E1E22',
      rail: '#0F0F11',
      border: '#2A2A2E',
      text: '#F2F2F0',
      muted: '#A3A3A8',
      accent: '#FF4D4D',
      accentText: '#0B0B0C',
      link: '#4DA3FF',
      selectedBg: '#FF4D4D',
      selectedText: '#0B0B0C',
      headerBg: '#0B0B0C',
      headerText: '#F2F2F0',
      headerBorder: '#2A2A2E',
      headerControl: '#151517',
      clipBg: '#151517',
      frameStartup: '#3A3A40',
      frameGap: '#26262B',
      frameRecovery: '#6E6130',
      frameInterruptible: '#45401F',
      stageBg: '#0B0B0C',
      stageFill: '#1E1E22',
      stageLine: '#F2F2F0',
      ghost: '#6B6B70',
      di: '#4DA3FF',
      victim: '#F5D547',
      danger: '#FF4D4D',
      dangerBg: '#2A1414',
      gateFill: '#0F0F11',
      gateStroke: '#4A4A50',
      scrim: 'rgba(0, 0, 0, 0.6)',
    },
  },
};

export const DEFAULT_PALETTE_ID: PaletteId = 'menu-paper';

export const PALETTE_OPTIONS = Object.values(PALETTES).map((palette) => ({
  value: palette.id,
  label: palette.label,
}));

export function isPaletteId(value: unknown): value is PaletteId {
  return typeof value === 'string' && value in PALETTES;
}
