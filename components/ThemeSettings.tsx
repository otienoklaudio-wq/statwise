'use client';

import { useEffect, useState } from 'react';
import { getStoredTheme, type AppTheme } from '@/lib/theme';

const themes = [
  { id: 'light', label: 'Light', color: '#f4f1ea' },
  { id: 'dark', label: 'Dark', color: '#00040D' },
] as const;

type Theme = AppTheme;

export default function ThemeSettings() {
  const [theme, setTheme] = useState<Theme>('light');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedTheme = getStoredTheme();
    setTheme(savedTheme);
    window.localStorage.setItem('football-predictor-theme', savedTheme);
    document.documentElement.dataset.theme = savedTheme;
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