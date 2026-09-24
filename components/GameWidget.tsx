'use client';

import ApiSportsWidget from './ApiSportsWidget';

interface GameWidgetProps {
  gameId: number | string;
  refresh?: number;
  defaultTab?: 'statistics' | 'events' | 'lineups' | 'h2h';
  teamStatistics?: boolean;
  playerStatistics?: boolean;
  events?: boolean;
  // NOTE: `quarters` is a basketball/NFL leftover in this shared widget
  // system and doesn't apply to football - intentionally not exposed here.
}

export default function GameWidget({
  gameId,
  refresh,
  defaultTab,
  teamStatistics,
  playerStatistics,
  events,
}: GameWidgetProps) {
  return (
    <ApiSportsWidget>
      <api-sports-widget
        data-type="game"
        data-game-id={gameId.toString()}
        data-refresh={refresh?.toString()}
        data-game-tab={defaultTab}
        data-team-statistics={teamStatistics ? 'true' : undefined}
        data-player-statistics={playerStatistics ? 'true' : undefined}
        data-events={events ? 'true' : undefined}
      />
    </ApiSportsWidget>
  );
}
