import { getFixture, getFixtureLineups, getTeamSeasonFixtures, type FixtureSummary, type Lineup } from './fixtures';

export interface StrongestXIPosition {
  position: string;
  players: Array<{ id: number; name: string; wins: number }>;
}

export interface StrongestXI {
  team: { id: number; name: string };
  season: number;
  positions: StrongestXIPosition[];
}

const POSITION_ORDER = ['G', 'D', 'M', 'F'];
const POSITION_LABELS: Record<string, string> = {
  G: 'Goalkeeper',
  D: 'Defender',
  M: 'Midfielder',
  F: 'Forward',
};

function resultForTeam(fixture: FixtureSummary, teamId: number): 'win' | 'other' {
  const teamIsHome = fixture.teams.home.id === teamId;
  const teamWon = teamIsHome ? fixture.teams.home.winner : fixture.teams.away.winner;
  return teamWon === true ? 'win' : 'other';
}

function normalizePosition(position: string): string | null {
  const normalized = position.toUpperCase();
  return POSITION_ORDER.includes(normalized) ? normalized : null;
}

async function calculateTeamXI(teamId: number, season: number, teamName: string): Promise<StrongestXI> {
  const fixtures = await getTeamSeasonFixtures(teamId, season);
  const playerWins = new Map<string, { id: number; name: string; position: string; wins: number }>();

  const lineups = await Promise.all(
    fixtures.map(async (fixture) => ({
      fixture,
      lineups: await getFixtureLineups(fixture.fixture.id).catch(() => []),
    }))
  );

  for (const { fixture, lineups: fixtureLineups } of lineups) {
    const lineup = fixtureLineups.find((item) => item.team.id === teamId);
    if (!lineup) continue;

    for (const starter of lineup.startXI) {
      const position = normalizePosition(starter.player.pos);
      if (!position) continue;

      const key = `${position}:${starter.player.id}`;
      const current = playerWins.get(key) ?? {
        id: starter.player.id,
        name: starter.player.name,
        position,
        wins: 0,
      };
      if (resultForTeam(fixture, teamId) === 'win') current.wins += 1;
      playerWins.set(key, current);
    }
  }

  const positions = POSITION_ORDER.map((position) => {
    const players = [...playerWins.values()].filter((player) => player.position === position);
    const highestWins = Math.max(0, ...players.map((player) => player.wins));
    return {
      position: POSITION_LABELS[position],
      players: players
        .filter((player) => player.wins === highestWins)
        .map(({ id, name, wins }) => ({ id, name, wins })),
    };
  });

  return { team: { id: teamId, name: teamName }, season, positions };
}

export async function getStrongestXIs(
  fixtureId: number,
  homeTeamId: number,
  awayTeamId: number
): Promise<{ home: StrongestXI; away: StrongestXI } | null> {
  const fixture = await getFixture(fixtureId);
  if (!fixture || fixture.teams.home.id !== homeTeamId || fixture.teams.away.id !== awayTeamId) {
    return null;
  }

  const [home, away] = await Promise.all([
    calculateTeamXI(homeTeamId, fixture.league.season, fixture.teams.home.name),
    calculateTeamXI(awayTeamId, fixture.league.season, fixture.teams.away.name),
  ]);

  return { home, away };
}