'use client';

import { useEffect, useState } from 'react';

interface ApiSportsWidgetProps {
  children: React.ReactNode;
}

export default function ApiSportsWidget({ children }: ApiSportsWidgetProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onReady = () => setReady(true);

    if ((window as any).__apiSportsWidgetsReady) {
      onReady();
      return;
    }

    window.addEventListener('api-sports-widgets-ready', onReady);
    return () => window.removeEventListener('api-sports-widgets-ready', onReady);
  }, []);

  return ready ? children : null;
}