'use client';

import { useRouter } from 'next/navigation';
import ApiSportsWidget from './ApiSportsWidget';

interface LeagueWidgetProps {
  leagueId: number;
  standings?: boolean;
  tab?: 'games' | 'results' | 'standings';
  refresh?: number;
}

export default function LeagueWidget({
  leagueId,
  standings,
  tab,
  refresh,
}: LeagueWidgetProps) {
  const router = useRouter();

  function handleMatchClick(event: React.MouseEvent<HTMLDivElement>) {
    const gameItem = (event.target as HTMLElement).closest('game-item');
    const gameId = gameItem?.getAttribute('data-id');
    if (gameId) router.push(`/matches/${gameId}`);
  }

  return (
    <div onClick={handleMatchClick} style={{ cursor: 'pointer' }}>
      <ApiSportsWidget>
        <api-sports-widget
          data-type="league"
          data-league={leagueId.toString()}
          data-standings={standings ? 'true' : undefined}
          data-tab={tab}
          data-refresh={refresh?.toString()}
        />
      </ApiSportsWidget>
    </div>
  );
}
