const FAVORITES_KEY = 'pratikbox_favorites_v1';
const RECENT_TOOLS_KEY = 'pratikbox_recent_tools_v1';
const THEME_KEY = 'pratikbox_theme_v1';

export function getFavoriteSlugs(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteSlug(slug: string): string[] {
  const current = getFavoriteSlugs();
  const next = current.includes(slug)
    ? current.filter((s) => s !== slug)
    : [slug, ...current];
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota errors
  }
  return next;
}

export function getRecentSlugs(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_TOOLS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordRecentSlug(slug: string): string[] {
  const current = getRecentSlugs().filter((s) => s !== slug);
  const next = [slug, ...current].slice(0, 8);
  try {
    localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota errors
  }
  return next;
}

export function getStoredTheme(): 'dark' | 'light' {
  try {
    const val = localStorage.getItem(THEME_KEY);
    return val === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function setStoredTheme(theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore
  }
}
