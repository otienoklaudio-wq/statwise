'use client';

import ApiSportsWidget from './ApiSportsWidget';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface GamesWidgetProps {
  date?: string; // 'YYYY-MM-DD'
  leagueSeason?: string; // widget-specific "leagueId-seasonId", e.g. "39-253"
  country?: string;
  refresh?: number;
  compact?: boolean; // maps to data-games-style="2"
  tab?: 'games' | 'live';
  showToolbar?: boolean;
}

export default function GamesWidget({
  date,
  leagueSeason,
  country,
  refresh,
  compact,
  tab,
  showToolbar,
}: GamesWidgetProps) {
  const router = useRouter();
  const widgetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget) return;

    const handleClick = (event: Event) => {
      const game = (event.target as HTMLElement).closest('game-item');
      const gameId = game?.getAttribute('data-id');
      if (gameId) router.push(`/matches/${gameId}`);
    };

    widget.addEventListener('click', handleClick);
    return () => widget.removeEventListener('click', handleClick);
  }, [router]);

  return (
    <ApiSportsWidget>
      <api-sports-widget
        ref={widgetRef}
        data-type="games"
        data-date={date}
        data-league={leagueSeason}
        data-country={country}
        data-refresh={refresh?.toString()}
        data-games-style={compact ? '2' : undefined}
        data-tab={tab}
        data-show-toolbar={showToolbar === false ? 'false' : undefined}
      />
    </ApiSportsWidget>
  );
}
