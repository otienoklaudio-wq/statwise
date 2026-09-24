'use client';

import ApiSportsWidget from './ApiSportsWidget';

interface H2HWidgetProps {
  teamA: number | string;
  teamB: number | string;
  refresh?: number;
}

export default function H2HWidget({ teamA, teamB, refresh }: H2HWidgetProps) {
  return (
    <ApiSportsWidget>
      <api-sports-widget
        data-type="h2h"
        data-h2h={`${teamA}-${teamB}`}
        data-refresh={refresh?.toString()}
      />
    </ApiSportsWidget>
  );
}
