'use client';

import { useEffect, useState } from 'react';

type AppTheme = 'default' | 'pitch' | 'dusk';

function getStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'default';

  const storedTheme = window.localStorage.getItem('football-predictor-theme');
  return storedTheme === 'pitch' || storedTheme === 'dusk' ? storedTheme : 'default';
}

function widgetTheme(theme: AppTheme): 'white' | 'dark' {
  return theme === 'default' ? 'white' : 'dark';
}

// The config widget carries no visible UI of its own - it just sets
// defaults (key, theme, timezone, etc.) that every other
// <api-sports-widget> on the page inherits. Render it once, near the
// top of a layout or page, before any functional widgets.
export default function WidgetConfig() {
  const key = process.env.NEXT_PUBLIC_API_FOOTBALL_WIDGET_KEY?.trim();
  const [theme, setTheme] = useState<AppTheme>('default');

  useEffect(() => {
    const storedTheme = getStoredTheme();
    setTheme(storedTheme);
    document.documentElement.dataset.theme = storedTheme;

    function handleThemeChange() {
      setTheme(getStoredTheme());
    }

    window.addEventListener('football-predictor-theme-change', handleThemeChange);
    return () => window.removeEventListener('football-predictor-theme-change', handleThemeChange);
  }, []);

  useEffect(() => {
    const scriptId = 'api-sports-widgets-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'module';
    script.src = 'https://widgets.api-sports.io/3.1.0/widgets.js';
    script.addEventListener('load', () => {
      (window as any).__apiSportsWidgetsReady = true;
      window.dispatchEvent(new Event('api-sports-widgets-ready'));
    });
    document.body.appendChild(script);
  }, []);

  if (!key) {
    // Fails loudly in dev if the widget key hasn't been set yet, rather
    // than silently rendering broken widgets.
    console.warn(
      'NEXT_PUBLIC_API_FOOTBALL_WIDGET_KEY is not set - widgets will not load. ' +
        'Copy .env.local.example to .env.local and fill it in.'
    );
  }

  return (
    <api-sports-widget
      data-type="config"
      data-key={key}
      data-sport="football"
      data-lang="en"
      data-theme={widgetTheme(theme)}
      data-timezone="utc"
      data-show-errors="false"
    />
  );
}
