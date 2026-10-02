import MatchTabs from '@/components/MatchTabs';
import MatchDetailsTabs from '@/components/MatchDetailsTabs';
import { getCardForecast } from '@/lib/cards';
import {
  getFixture,
  getFixtureEvents,
  getFixtureLineups,
  getFixtureStatistics,
} from '@/lib/fixtures';
import { getH2H } from '@/lib/h2h';
import { getInjuries, type InjuryRecord } from '@/lib/injuries';
import { getPrediction } from '@/lib/predictions';
import { getStrongestXIs } from '@/lib/strongest-xi';

export default async function MatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ home?: string; away?: string }>;
}) {
  const { gameId } = await params;
  const { home, away } = await searchParams;
  const fixtureId = Number(gameId);
  const fixture = Number.isInteger(fixtureId)
    ? await getFixture(fixtureId).catch(() => null)
    : null;
  const [statistics, events, lineups, cardForecast] = fixture
    ? await Promise.all([
        getFixtureStatistics(fixtureId).catch(() => []),
        getFixtureEvents(fixtureId).catch(() => []),
        getFixtureLineups(fixtureId).catch(() => []),
        getCardForecast(fixture, fixture.teams.home.id, fixture.teams.away.id).catch(() => null),
      ])
    : [[], [], [], null];
  const homeTeamId = Number.isInteger(Number(home))
    ? Number(home)
    : fixture?.teams.home.id ?? Number.NaN;
  const awayTeamId = Number.isInteger(Number(away))
    ? Number(away)
    : fixture?.teams.away.id ?? Number.NaN;
  const prediction = Number.isInteger(fixtureId)
    ? await getPrediction(fixtureId).catch(() => null)
    : null;
  const h2h = Number.isInteger(homeTeamId) && Number.isInteger(awayTeamId)
    ? await getH2H(homeTeamId, awayTeamId).catch(() => [])
    : [];
  const injuries: InjuryRecord[] = Number.isInteger(fixtureId)
    ? await getInjuries({ fixture: fixtureId }).catch(() => [])
    : [];
  const strongestXI = Number.isInteger(fixtureId) && Number.isInteger(homeTeamId) && Number.isInteger(awayTeamId)
    ? await getStrongestXIs(fixtureId, homeTeamId, awayTeamId).catch(() => null)
    : null;

  return (
    <main>
      <h1>Match Detail</h1>
      {fixture ? (
        <section className="match-detail" aria-label="Match details">
          <div className="match-detail__meta">
            <span>{fixture.league.name}</span>
            <time dateTime={fixture.fixture.date}>
              {new Date(fixture.fixture.date).toLocaleString()}
            </time>
            <span>{fixture.fixture.status.short}</span>
          </div>
          <div className="match-detail__score">
            <strong>{fixture.teams.home.name}</strong>
            <span>
              {fixture.goals.home ?? '-'} : {fixture.goals.away ?? '-'}
            </span>
            <strong>{fixture.teams.away.name}</strong>
          </div>

          <MatchDetailsTabs
            statistics={statistics}
            events={events}
            lineups={lineups}
            cardForecast={cardForecast}
          />
        </section>
      ) : (
        <section className="match-detail match-detail--empty" role="status">
          <h2>Match details are temporarily unavailable</h2>
          <p>The data provider did not return this fixture. Check the API key and quota, then refresh.</p>
        </section>
      )}

      <MatchTabs prediction={prediction} h2h={h2h} injuries={injuries} strongestXI={strongestXI} />
    </main>
  );
}
