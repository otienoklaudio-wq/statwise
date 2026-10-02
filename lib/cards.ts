import { getFixtureEvents, getTeamSeasonFixtures, type FixtureSummary } from './fixtures';

const RECENT_MATCH_LIMIT = 5;
const MIN_REFEREE_MATCHES = 3;
const REFEREE_RATIO_MIN = 0.75;
const REFEREE_RATIO_MAX = 1.25;

export interface CardForecast {
  expectedYellowCards: number;
  expectedRedCards: number;
  mostLikelyYellowCards: number;
  mostLikelyRedCards: number;
  redCardProbability: number;
  homeSampleSize: number;
  awaySampleSize: number;
  refereeMatches: number;
  refereeAdjustmentUsed: boolean;
}

interface CardObservation {
  fixture: FixtureSummary;
  yellowCards: number;
  redCards: number;
}

function refereeKey(name: string | null | undefined): string {
  return name?.split(',')[0].trim().toLocaleLowerCase() ?? '';
}

function mean(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function countCards(events: Awaited<ReturnType<typeof getFixtureEvents>>) {
  return events.reduce(
    (total, event) => {
      if (event.type !== 'Card') return total;
      const detail = event.detail.toLocaleLowerCase();
      if (detail.includes('yellow')) total.yellowCards += 1;
      if (detail.includes('red') || detail.includes('second yellow')) total.redCards += 1;
      return total;
    },
    { yellowCards: 0, redCards: 0 }
  );
}

function adjustedRefereeMultiplier(
  refereeAverage: number,
  sampleAverage: number,
  sampleSize: number
): number {
  if (sampleSize < MIN_REFEREE_MATCHES || sampleAverage <= 0) return 1;
  const observedRatio = refereeAverage / sampleAverage;
  const boundedRatio = Math.min(REFEREE_RATIO_MAX, Math.max(REFEREE_RATIO_MIN, observedRatio));
  const reliability = sampleSize / (sampleSize + 4);
  return 1 + (boundedRatio - 1) * reliability;
}

async function getRecentTeamFixtures(
  teamId: number,
  leagueId: number,
  season: number,
  beforeDate: number
): Promise<FixtureSummary[]> {
  const fixtures = await getTeamSeasonFixtures(teamId, season, leagueId);
  return fixtures
    .filter((fixture) => new Date(fixture.fixture.date).getTime() < beforeDate)
    .sort((left, right) => right.fixture.date.localeCompare(left.fixture.date))
    .slice(0, RECENT_MATCH_LIMIT);
}

/**
 * Estimate upcoming-match card counts from each team's last five completed
 * fixtures. If enough sampled fixtures share the assigned referee, adjust
 * expected rates by a bounded, shrinkage-weighted referee strictness ratio.
 */
export async function getCardForecast(
  fixture: FixtureSummary,
  homeTeamId: number,
  awayTeamId: number
): Promise<CardForecast | null> {
  if (fixture.fixture.status.short !== 'NS') return null;

  const beforeDate = new Date(fixture.fixture.date).getTime();
  if (!Number.isFinite(beforeDate)) return null;

  const [homeFixtures, awayFixtures] = await Promise.all([
    getRecentTeamFixtures(homeTeamId, fixture.league.id, fixture.league.season, beforeDate),
    getRecentTeamFixtures(awayTeamId, fixture.league.id, fixture.league.season, beforeDate),
  ]);
  if (!homeFixtures.length || !awayFixtures.length) return null;

  const fixturesById = new Map<number, FixtureSummary>();
  for (const pastFixture of [...homeFixtures, ...awayFixtures]) {
    fixturesById.set(pastFixture.fixture.id, pastFixture);
  }

  const observations = await Promise.all(
    [...fixturesById.values()].map(async (pastFixture): Promise<CardObservation | null> => {
      try {
        const events = await getFixtureEvents(pastFixture.fixture.id);
        return { fixture: pastFixture, ...countCards(events) };
      } catch {
        return null;
      }
    })
  );
  const available = observations.filter((observation): observation is CardObservation => observation !== null);
  const observationsByFixture = new Map(available.map((observation) => [observation.fixture.fixture.id, observation]));
  const homeRecords = homeFixtures
    .map((pastFixture) => observationsByFixture.get(pastFixture.fixture.id))
    .filter((observation): observation is CardObservation => observation !== undefined);
  const awayRecords = awayFixtures
    .map((pastFixture) => observationsByFixture.get(pastFixture.fixture.id))
    .filter((observation): observation is CardObservation => observation !== undefined);
  if (!homeRecords.length || !awayRecords.length) return null;

  const referee = refereeKey(fixture.fixture.referee);
  const refereeRecords = referee
    ? available.filter((observation) => refereeKey(observation.fixture.fixture.referee) === referee)
    : [];
  const refereeMatches = refereeRecords.length;
  const yellowSampleMean = mean(available.map((observation) => observation.yellowCards));
  const redSampleMean = mean(available.map((observation) => observation.redCards));
  const refereeYellowMean = mean(refereeRecords.map((observation) => observation.yellowCards));
  const refereeRedMean = mean(refereeRecords.map((observation) => observation.redCards));
  const useRefereeAdjustment = refereeMatches >= MIN_REFEREE_MATCHES;

  const expectedYellowCards = (
    mean(homeRecords.map((observation) => observation.yellowCards)) +
    mean(awayRecords.map((observation) => observation.yellowCards))
  ) * adjustedRefereeMultiplier(refereeYellowMean, yellowSampleMean, refereeMatches);
  const expectedRedCards = (
    mean(homeRecords.map((observation) => observation.redCards)) +
    mean(awayRecords.map((observation) => observation.redCards))
  ) * adjustedRefereeMultiplier(refereeRedMean, redSampleMean, refereeMatches);

  return {
    expectedYellowCards,
    expectedRedCards,
    mostLikelyYellowCards: Math.floor(expectedYellowCards),
    mostLikelyRedCards: Math.floor(expectedRedCards),
    redCardProbability: 1 - Math.exp(-expectedRedCards),
    homeSampleSize: homeRecords.length,
    awaySampleSize: awayRecords.length,
    refereeMatches,
    refereeAdjustmentUsed: useRefereeAdjustment,
  };
}