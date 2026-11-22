import { ColorPaletteId, COLOR_PALETTES } from '../types/theme';
import { ThemeMode } from '../types';

const STORAGE_PALETTE_KEY = 'swasti_color_palette_id_v2';

export function getStoredPaletteId(): ColorPaletteId {
  const stored = (localStorage.getItem(STORAGE_PALETTE_KEY) || localStorage.getItem('antigravity_color_palette_id_v2')) as ColorPaletteId;
  if (stored && COLOR_PALETTES[stored]) {
    return stored;
  }
  return 'sage-tomato';
}

export function saveStoredPaletteId(id: ColorPaletteId): void {
  localStorage.setItem(STORAGE_PALETTE_KEY, id);
}

export function applyTheme(paletteId: ColorPaletteId, mode: ThemeMode): void {
  const root = document.documentElement;
  const palette = COLOR_PALETTES[paletteId] || COLOR_PALETTES['sage-tomato'];

  // Resolve system preference
  let effectiveMode: 'dark' | 'light' = mode === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;

  if (effectiveMode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }

  const colors = effectiveMode === 'dark' ? palette.dark : palette.light;

  // Set CSS Variables
  root.style.setProperty('--app-bg', colors.bg);
  root.style.setProperty('--sidebar-bg', colors.sidebar);
  root.style.setProperty('--header-bg', colors.header);
  root.style.setProperty('--card-bg', colors.card);
  root.style.setProperty('--ai-msg-bg', colors.aiMsg);
  root.style.setProperty('--border-color', colors.border);
  root.style.setProperty('--input-bg', colors.inputBg);
  root.style.setProperty('--text-primary', colors.textPrimary);
  root.style.setProperty('--text-secondary', colors.textSecondary);
  root.style.setProperty('--text-muted', colors.textMuted);

  // Set 3 Palette Colors
  root.style.setProperty('--c1', palette.c1.hex);
  root.style.setProperty('--c2', palette.c2.hex);
  root.style.setProperty('--c3', palette.c3.hex);

  // Meta theme color for mobile address bar
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', colors.bg);
  }
}
