export type AppTheme = 'light' | 'dark';

export function getStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'light';

  const storedTheme = window.localStorage.getItem('football-predictor-theme');
  return storedTheme === 'dark' || storedTheme === 'pitch' ? 'dark' : 'light';
}