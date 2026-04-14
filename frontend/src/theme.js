// Theme utilities: lee y setea el tema en el DOM y localStorage
const STORAGE_KEY = 'lcf_theme';

export function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return 'dark';
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
}

/**
 * Devuelve los colores actuales resueltos desde las CSS variables.
 * Para inline styles que necesiten valores js (como gradientes dinamicos).
 */
export function getThemeColors() {
  if (typeof window === 'undefined') return {};
  const s = getComputedStyle(document.documentElement);
  const get = (name) => s.getPropertyValue(name).trim();
  return {
    bg: get('--bg'),
    bg2: get('--bg2'),
    bg3: get('--bg3'),
    text: get('--text'),
    textDim: get('--text-dim'),
    border: get('--border'),
    accent: get('--accent'),
  };
}
