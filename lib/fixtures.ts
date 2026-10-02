import { apiFootball } from './api-football';

export interface FixtureStatistic {
  type: string; // e.g. "Shots on Goal", "Ball Possession", "Total passes"
  value: number | string | null;
}

export interface TeamFixtureStatistics {
  team: { id: number; name: string; logo: string };
  statistics: FixtureStatistic[];
}

/**
 * GET /fixtures/statistics
 * Omit teamId to get both sides' stats in one call.
 * Does NOT include key passes/assists (see fixtures/players for that)
 * and does NOT split stats by half.
 */
export async function getFixtureStatistics(fixtureId: number, teamId?: number) {
  const data = await apiFootball<{ response: TeamFixtureStatistics[] }>(
    '/fixtures/statistics',
    { fixture: fixtureId, team: teamId }
  );
  return data.response;
}

export interface FixtureEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: 'Goal' | 'Card' | 'Subst' | 'Var';
  detail: string; // e.g. "Normal Goal", "Penalty", "Own Goal", "Yellow Card"
  comments: string | null;
}

/** GET /fixtures/events - full match timeline (goals, cards, subs, VAR) */
export async function getFixtureEvents(fixtureId: number) {
  const data = await apiFootball<{ response: FixtureEvent[] }>('/fixtures/events', {
    fixture: fixtureId,
  });
  return data.response;
}

export interface PlayerFixtureStats {
  team: { id: number; name: string; logo: string };
  players: Array<{
    player: { id: number; name: string };
    statistics: Array<{
      games: { minutes: number | null; position: string; rating: string | null };
      goals: { total: number | null; assists: number | null };
      passes: { total: number | null; key: number | null; accuracy: string | null };
      shots: { total: number | null; on: number | null };
    }>;
  }>;
}

/**
 * GET /fixtures/players - per-player stats for a fixture.
 * Sum `passes.key` across a team's players for "chances created";
 * sum `goals.assists` for the converted portion.
 */
export async function getFixturePlayerStats(fixtureId: number) {
  const data = await apiFootball<{ response: PlayerFixtureStats[] }>('/fixtures/players', {
    fixture: fixtureId,
  });
  return data.response;
}

export interface Lineup {
  team: { id: number; name: string; logo: string };
  formation: string;
  startXI: Array<{ player: { id: number; name: string; number: number; pos: string } }>;
  substitutes: Array<{ player: { id: number; name: string; number: number; pos: string } }>;
}

export interface FixtureSummary {
  fixture: {
    id: number;
    date: string;
    referee?: string | null;
    status: { short: string };
  };
  league: { id: number; name: string; season: number; round?: string | null };
  teams: {
    home: { id: number; name: string; winner: boolean | null };
    away: { id: number; name: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}

/** GET /fixtures - completed fixtures for a team in a season. */
export async function getTeamSeasonFixtures(teamId: number, season: number, leagueId?: number) {
  const data = await apiFootball<{ response: FixtureSummary[] }>('/fixtures', {
    team: teamId,
    season,
    league: leagueId,
    status: 'FT',
  });
  return data.response;
}

/** GET /fixtures?id - metadata for a single fixture. */
export async function getFixture(fixtureId: number) {
  const data = await apiFootball<{ response: FixtureSummary[] }>('/fixtures', {
    id: fixtureId,
  });
  return data.response[0] ?? null;
}

/** GET /fixtures?league={id}&season={seasonStartYear} */
export async function getLeagueFixtures(leagueId: number, season: number) {
  const data = await apiFootball<{ response: FixtureSummary[] }>('/fixtures', {
    league: leagueId,
    season,
  });
  return data.response;
}

/** GET /fixtures/lineups - confirmed lineups (usually available ~1hr before kickoff) */
export async function getFixtureLineups(fixtureId: number) {
  const data = await apiFootball<{ response: Lineup[] }>('/fixtures/lineups', {
    fixture: fixtureId,
  });
  return data.response;
}
