export type ColorPaletteId = 'sage-tomato' | 'mocha-rose' | 'teal-peach';

export interface ColorPalette {
  id: ColorPaletteId;
  name: string;
  subtitle: string;
  c1: { name: string; hex: string }; // Primary accent (Sage / Mocha / Teal)
  c2: { name: string; hex: string }; // Base / Light background (Off-White / Soft Nude / Ice White)
  c3: { name: string; hex: string }; // Action & Recording accent (Tomato / Rose Gold / Soft Peach)
  dark: {
    bg: string;
    sidebar: string;
    header: string;
    card: string;
    aiMsg: string;
    border: string;
    inputBg: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
  };
  light: {
    bg: string;
    sidebar: string;
    header: string;
    card: string;
    aiMsg: string;
    border: string;
    inputBg: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
  };
}

export const COLOR_PALETTES: Record<ColorPaletteId, ColorPalette> = {
  'sage-tomato': {
    id: 'sage-tomato',
    name: 'Sage & Tomato',
    subtitle: 'Original Natural Harmony',
    c1: { name: 'Sage', hex: '#9CAF88' },
    c2: { name: 'Off-White', hex: '#F7F5EF' },
    c3: { name: 'Tomato Red', hex: '#E8412C' },
    dark: {
      bg: '#11121A',
      sidebar: '#151624',
      header: 'rgba(20, 21, 34, 0.92)',
      card: '#1A1C2C',
      aiMsg: '#161726',
      border: '#27293D',
      inputBg: '#181A2A',
      textPrimary: '#F7F5EF',
      textSecondary: '#A0A2B8',
      textMuted: '#6C6E84'
    },
    light: {
      bg: '#F7F5EF',
      sidebar: '#EBE8DE',
      header: 'rgba(247, 245, 239, 0.95)',
      card: '#FFFFFF',
      aiMsg: '#EFECE2',
      border: '#D8D4C5',
      inputBg: '#FFFFFF',
      textPrimary: '#1E2028',
      textSecondary: '#4F5265',
      textMuted: '#7E8299'
    }
  },
  'mocha-rose': {
    id: 'mocha-rose',
    name: 'Mocha & Rose Gold',
    subtitle: 'Warm Luxe Editorial',
    c1: { name: 'Mocha Taupe', hex: '#5E4B42' },
    c2: { name: 'Soft Nude', hex: '#F2E4DA' },
    c3: { name: 'Rose Gold', hex: '#B87866' },
    dark: {
      bg: '#161211',
      sidebar: '#1E1816',
      header: 'rgba(30, 24, 22, 0.92)',
      card: '#271F1C',
      aiMsg: '#201A18',
      border: '#3B302B',
      inputBg: '#231C1A',
      textPrimary: '#F2E4DA',
      textSecondary: '#BFAEA5',
      textMuted: '#84736A'
    },
    light: {
      bg: '#F2E4DA',
      sidebar: '#E5D4C7',
      header: 'rgba(242, 228, 218, 0.95)',
      card: '#FAF4EF',
      aiMsg: '#E8D7CA',
      border: '#D2BEB0',
      inputBg: '#FFFFFF',
      textPrimary: '#2D201A',
      textSecondary: '#5E4B42',
      textMuted: '#8A756A'
    }
  },
  'teal-peach': {
    id: 'teal-peach',
    name: 'Nordic Teal & Peach',
    subtitle: 'Clean Aesthetic & Coastal Energy',
    c1: { name: 'Deep Teal', hex: '#0F3D47' },
    c2: { name: 'Ice White', hex: '#F4F8FA' },
    c3: { name: 'Soft Peach', hex: '#F59E7B' },
    dark: {
      bg: '#0A1215',
      sidebar: '#0E1A1E',
      header: 'rgba(14, 26, 30, 0.92)',
      card: '#13242A',
      aiMsg: '#101E24',
      border: '#1F3841',
      inputBg: '#122127',
      textPrimary: '#F4F8FA',
      textSecondary: '#9CB7BE',
      textMuted: '#62818A'
    },
    light: {
      bg: '#F4F8FA',
      sidebar: '#E2ECF0',
      header: 'rgba(244, 248, 250, 0.95)',
      card: '#FFFFFF',
      aiMsg: '#E8F1F4',
      border: '#C8D9E0',
      inputBg: '#FFFFFF',
      textPrimary: '#0C2026',
      textSecondary: '#2B4A52',
      textMuted: '#5E7982'
    }
  }
};
