import { getFixtureStatistics, getTeamSeasonFixtures, type FixtureSummary } from './fixtures';
import { estimateNegBinomialDispersion, generateThresholdProbabilities, type ThresholdProbability } from './probability';

const RECENT_FIXTURES = 5;
const STATISTICS_CONCURRENCY = 3;
const CORNER_LINES = [6.5, 7.5, 8.5, 9.5, 10.5, 11.5];

export interface CornerForecast {
  expectedHome: number;
  expectedAway: number;
  expectedTotal: number;
  dispersion: number;
  totalThresholds: ThresholdProbability[];
  homeSamples: number;
  awaySamples: number;
  leagueBaselineSamples: number;
}

interface FixtureCorners {
  fixture: FixtureSummary;
  home: number;
  away: number;
}

interface TeamCornerProfile {
  avgWonHome: number;
  avgConcededHome: number;
  avgWonAway: number;
  avgConcededAway: number;
  variance: number;
  gamesHome: number;
  gamesAway: number;
}

function parseCornerCount(value: number | string | null | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function getFixtureCorners(fixture: FixtureSummary, statistics: Awaited<ReturnType<typeof getFixtureStatistics>>): FixtureCorners | null {
  const homeStats = statistics.find((teamStats) => teamStats.team.id === fixture.teams.home.id);
  const awayStats = statistics.find((teamStats) => teamStats.team.id === fixture.teams.away.id);
  if (!homeStats || !awayStats) return null;

  const home = parseCornerCount(homeStats.statistics.find((stat) => stat.type === 'Corner Kicks')?.value);
  const away = parseCornerCount(awayStats.statistics.find((stat) => stat.type === 'Corner Kicks')?.value);
  if (home === null || away === null) return null;
  return { fixture, home, away };
}

async function loadFixtureCornerHistory(fixtures: FixtureSummary[]): Promise<FixtureCorners[]> {
  const results: Array<FixtureCorners | null> = new Array(fixtures.length).fill(null);
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(STATISTICS_CONCURRENCY, fixtures.length) },
    async () => {
      while (nextIndex < fixtures.length) {
        const index = nextIndex++;
        const fixture = fixtures[index];
        try {
          results[index] = getFixtureCorners(
            fixture,
            await getFixtureStatistics(fixture.fixture.id)
          );
        } catch {
          results[index] = null;
        }
      }
    }
  );
  await Promise.all(workers);
  return results.filter((result): result is FixtureCorners => result !== null);
}

function createTeamProfile(teamId: number, history: FixtureCorners[]): TeamCornerProfile {
  const homeGames = history.filter(({ fixture }) => fixture.teams.home.id === teamId);
  const awayGames = history.filter(({ fixture }) => fixture.teams.away.id === teamId);
  const wonCorners = history.map(({ fixture, home, away }) =>
    fixture.teams.home.id === teamId ? home : away
  );
  const meanWon = average(wonCorners);
  const variance = average(wonCorners.map((value) => (value - meanWon) ** 2));

  return {
    avgWonHome: average(homeGames.map(({ home }) => home)),
    avgConcededHome: average(homeGames.map(({ away }) => away)),
    avgWonAway: average(awayGames.map(({ away }) => away)),
    avgConcededAway: average(awayGames.map(({ home }) => home)),
    variance,
    gamesHome: homeGames.length,
    gamesAway: awayGames.length,
  };
}

function calculateExpectedCorners(
  home: TeamCornerProfile,
  away: TeamCornerProfile,
  baselineHome: number,
  baselineAway: number
) {
  const attackHome = home.avgWonHome / baselineHome;
  const defenseHome = home.avgConcededHome / baselineAway;
  const attackAway = away.avgWonAway / baselineAway;
  const defenseAway = away.avgConcededAway / baselineHome;
  const expectedHome = attackHome * defenseAway * baselineHome;
  const expectedAway = attackAway * defenseHome * baselineAway;
  const expectedTotal = expectedHome + expectedAway;
  const pooledVariance = (home.variance + away.variance) / 2;
  const dispersion = estimateNegBinomialDispersion(expectedTotal, pooledVariance * 2);

  return { expectedHome, expectedAway, expectedTotal, dispersion };
}

/** Estimate pre-match corners from venue-specific team rates and a league baseline. */
export async function getCornerForecast(fixture: FixtureSummary): Promise<CornerForecast | null> {
  if (fixture.fixture.status.short !== 'NS') return null;
  const kickoff = new Date(fixture.fixture.date).getTime();
  if (!Number.isFinite(kickoff)) return null;

  const [homeSeasonFixtures, awaySeasonFixtures] = await Promise.all([
    getTeamSeasonFixtures(fixture.teams.home.id, fixture.league.season, fixture.league.id),
    getTeamSeasonFixtures(fixture.teams.away.id, fixture.league.season, fixture.league.id),
  ]);
  const recentBeforeKickoff = (teamFixtures: FixtureSummary[]) => teamFixtures
    .filter((pastFixture) => new Date(pastFixture.fixture.date).getTime() < kickoff)
    .sort((left, right) => right.fixture.date.localeCompare(left.fixture.date))
    .slice(0, RECENT_FIXTURES);
  const homeFixtures = recentBeforeKickoff(homeSeasonFixtures);
  const awayFixtures = recentBeforeKickoff(awaySeasonFixtures);
  if (!homeFixtures.length || !awayFixtures.length) return null;

  const fixturesById = new Map<number, FixtureSummary>();
  for (const pastFixture of [...homeFixtures, ...awayFixtures]) {
    fixturesById.set(pastFixture.fixture.id, pastFixture);
  }
  const history = await loadFixtureCornerHistory([...fixturesById.values()]);
  const homeHistoryIds = new Set(homeFixtures.map((pastFixture) => pastFixture.fixture.id));
  const awayHistoryIds = new Set(awayFixtures.map((pastFixture) => pastFixture.fixture.id));
  const homeHistory = history.filter(({ fixture: pastFixture }) => homeHistoryIds.has(pastFixture.fixture.id));
  const awayHistory = history.filter(({ fixture: pastFixture }) => awayHistoryIds.has(pastFixture.fixture.id));
  if (!homeHistory.length || !awayHistory.length) return null;

  const homeProfile = createTeamProfile(fixture.teams.home.id, homeHistory);
  const awayProfile = createTeamProfile(fixture.teams.away.id, awayHistory);
  if (!homeProfile.gamesHome || !awayProfile.gamesAway) return null;

  const baselineHome = average(history.map(({ home }) => home));
  const baselineAway = average(history.map(({ away }) => away));
  if (!baselineHome || !baselineAway) return null;

  const expected = calculateExpectedCorners(homeProfile, awayProfile, baselineHome, baselineAway);
  return {
    ...expected,
    totalThresholds: generateThresholdProbabilities(
      expected.expectedTotal,
      expected.dispersion,
      CORNER_LINES
    ),
    homeSamples: homeHistory.length,
    awaySamples: awayHistory.length,
    leagueBaselineSamples: history.length,
  };
}