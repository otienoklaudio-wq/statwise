import { getTeamSeasonFixtures, type FixtureSummary } from './fixtures';

export interface TeamFormMatch {
  fixtureId: number;
  date: string;
  opponent: string;
  venue: 'Home' | 'Away';
  goalsFor: number;
  goalsAgainst: number;
  result: 'W' | 'D' | 'L';
}

export interface TeamForm {
  team: { id: number; name: string };
  matches: TeamFormMatch[];
}

function getTeamForm(teamId: number, teamName: string, fixtures: FixtureSummary[]): TeamForm {
  const matches = fixtures
    .filter((fixture) => fixture.teams.home.id === teamId || fixture.teams.away.id === teamId)
    .filter((fixture) => fixture.goals.home !== null && fixture.goals.away !== null)
    .sort((left, right) => right.fixture.date.localeCompare(left.fixture.date))
    .slice(0, 5)
    .map((fixture) => {
      const isHome = fixture.teams.home.id === teamId;
      const goalsFor = isHome ? fixture.goals.home! : fixture.goals.away!;
      const goalsAgainst = isHome ? fixture.goals.away! : fixture.goals.home!;

      return {
        fixtureId: fixture.fixture.id,
        date: fixture.fixture.date,
        opponent: isHome ? fixture.teams.away.name : fixture.teams.home.name,
        venue: isHome ? 'Home' as const : 'Away' as const,
        goalsFor,
        goalsAgainst,
        result: goalsFor > goalsAgainst ? 'W' as const : goalsFor < goalsAgainst ? 'L' as const : 'D' as const,
      };
    });

  return { team: { id: teamId, name: teamName }, matches };
}

/** Last five completed league matches before the selected fixture. */
export async function getTeamsForm(fixture: FixtureSummary): Promise<{ home: TeamForm; away: TeamForm }> {
  const [homeSeasonFixtures, awaySeasonFixtures] = await Promise.all([
    getTeamSeasonFixtures(fixture.teams.home.id, fixture.league.season, fixture.league.id),
    getTeamSeasonFixtures(fixture.teams.away.id, fixture.league.season, fixture.league.id),
  ]);
  const kickoff = new Date(fixture.fixture.date).getTime();
  const beforeFixture = (fixtures: FixtureSummary[]) => fixtures.filter(
    (pastFixture) => new Date(pastFixture.fixture.date).getTime() < kickoff
  );
  const recentFixtures = async (teamId: number, currentSeasonFixtures: FixtureSummary[]) => {
    const currentSeasonResults = beforeFixture(currentSeasonFixtures);
    if (currentSeasonResults.length >= 5 || fixture.league.season <= 1900) {
      return currentSeasonResults;
    }

    const previousSeasonResults = await getTeamSeasonFixtures(
      teamId,
      fixture.league.season - 1,
      fixture.league.id
    ).catch(() => []);

    return [...currentSeasonResults, ...beforeFixture(previousSeasonResults)];
  };
  const [homeHistory, awayHistory] = await Promise.all([
    recentFixtures(fixture.teams.home.id, homeSeasonFixtures),
    recentFixtures(fixture.teams.away.id, awaySeasonFixtures),
  ]);

  return {
    home: getTeamForm(
      fixture.teams.home.id,
      fixture.teams.home.name,
      homeHistory
    ),
    away: getTeamForm(
      fixture.teams.away.id,
      fixture.teams.away.name,
      awayHistory
    ),
  };
}