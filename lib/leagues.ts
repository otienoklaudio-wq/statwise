// Target leagues for the site. IDs below follow API-Football's standard
// REST numbering (confirmed against the /leagues endpoint before relying
// on them - competition IDs occasionally shift).
//
// NOTE: the `games` widget's data-league attribute expects a composite
// "leagueId-seasonId" string using the widget system's own internal
// season IDs (see components/GamesWidget.tsx), which is a DIFFERENT
// scheme from the year-based `season` used in REST calls below. Resolve
// and fill in `widgetSeasonId` per league/season before wiring up the
// games widget pages.

export interface LeagueConfig {
  id: number; // REST API league id
  name: string;
  country: string;
  widgetSeasonId?: string; // e.g. "39-253" - fill in once confirmed
}

export const LEAGUES: LeagueConfig[] = [
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 40, name: 'Championship', country: 'England' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 61, name: 'Ligue 1', country: 'France' },
];

export function getLeagueById(id: number): LeagueConfig | undefined {
  return LEAGUES.find((l) => l.id === id);
}
