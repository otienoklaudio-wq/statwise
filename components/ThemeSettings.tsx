'use client';

import { useEffect, useState } from 'react';

const themes = [
  { id: 'default', label: 'Daylight', color: '#d95f32' },
  { id: 'pitch', label: 'Pitch', color: '#d7ef55' },
  { id: 'dusk', label: 'Dusk', color: '#f0a35b' },
] as const;

type Theme = (typeof themes)[number]['id'];

export default function ThemeSettings() {
  const [theme, setTheme] = useState<Theme>('default');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('football-predictor-theme') as Theme | null;
    if (savedTheme && themes.some((option) => option.id === savedTheme)) {
      setTheme(savedTheme);
      document.documentElement.dataset.theme = savedTheme;
    }
  }, []);

  function selectTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    window.localStorage.setItem('football-predictor-theme', nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.dispatchEvent(new Event('football-predictor-theme-change'));
    setIsOpen(false);
  }

  return (
    <div className="theme-control">
      <button
        className="settings-button"
        type="button"
        aria-label="Open theme settings"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true">⚙</span>
      </button>

      {isOpen && (
        <div className="theme-menu" role="radiogroup" aria-label="Website theme">
          <span className="theme-menu-label">Theme</span>
          {themes.map((option) => (
            <button
              className="theme-option"
              key={option.id}
              type="button"
              role="radio"
              aria-checked={theme === option.id}
              onClick={() => selectTheme(option.id)}
            >
              <span className="theme-swatch" style={{ '--theme-color': option.color } as React.CSSProperties} />
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}