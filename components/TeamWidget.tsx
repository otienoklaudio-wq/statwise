'use client';

import ApiSportsWidget from './ApiSportsWidget';

interface TeamWidgetProps {
  teamId: number | string;
  defaultTab?: 'overview' | 'squads' | 'statistics' | 'fixtures';
  teamStatistics?: boolean;
  teamSquads?: boolean;
}

export default function TeamWidget({
  teamId,
  defaultTab,
  teamStatistics,
  teamSquads,
}: TeamWidgetProps) {
  return (
    <ApiSportsWidget>
      <api-sports-widget
        data-type="team"
        data-team-id={teamId.toString()}
        data-team-tab={defaultTab}
        data-team-statistics={teamStatistics ? 'true' : undefined}
        data-team-squads={teamSquads ? 'true' : undefined}
      />
    </ApiSportsWidget>
  );
}
