import MatchTabs from '@/components/MatchTabs';
import MatchDetailsTabs from '@/components/MatchDetailsTabs';
import GameWidget from '@/components/GameWidget';
import Link from 'next/link';
import { getCardForecast } from '@/lib/cards';
import { getCornerForecast } from '@/lib/corners';
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
import { getTeamsForm } from '@/lib/team-form';

export default async function MatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ home?: string; away?: string; view?: string }>;
}) {
  const { gameId } = await params;
  const { home, away, view } = await searchParams;
  const useCustomDetails = view === 'custom';
  const fixtureId = Number(gameId);
  const fixture = Number.isInteger(fixtureId)
    ? await getFixture(fixtureId).catch(() => null)
    : null;
  const [statistics, events, lineups, cardForecast, cornerForecast] = fixture && useCustomDetails
    ? await Promise.all([
        getFixtureStatistics(fixtureId).catch(() => []),
        getFixtureEvents(fixtureId).catch(() => []),
        getFixtureLineups(fixtureId).catch(() => []),
        getCardForecast(fixture, fixture.teams.home.id, fixture.teams.away.id).catch(() => null),
        getCornerForecast(fixture).catch(() => null),
      ])
    : [[], [], [], null, null];
  const homeTeamId = Number.isInteger(Number(home))
    ? Number(home)
    : fixture?.teams.home.id ?? Number.NaN;
  const awayTeamId = Number.isInteger(Number(away))
    ? Number(away)
    : fixture?.teams.away.id ?? Number.NaN;
  const teamsForm = fixture
    ? await getTeamsForm(fixture).catch(() => null)
    : null;
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
  const viewParams = new URLSearchParams({ view: useCustomDetails ? 'widget' : 'custom' });
  if (Number.isInteger(homeTeamId)) viewParams.set('home', String(homeTeamId));
  if (Number.isInteger(awayTeamId)) viewParams.set('away', String(awayTeamId));
  const alternateViewHref = `/matches/${gameId}?${viewParams.toString()}`;

  return (
    <main>
      <h1>Match Detail</h1>
      <nav className="view-switch" aria-label="Match details view">
        {useCustomDetails ? (
          <Link href={alternateViewHref}>Back to API-Football match widget</Link>
        ) : (
          <Link href={alternateViewHref}>Use custom match details</Link>
        )}
      </nav>
      {!useCustomDetails ? (
        <GameWidget
          gameId={gameId}
          refresh={20}
          defaultTab="statistics"
          teamStatistics
          playerStatistics
          events
        />
      ) : fixture ? (
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
            cornerForecast={cornerForecast}
          />
        </section>
      ) : (
        <section className="match-detail match-detail--empty" role="status">
          <h2>Match details are temporarily unavailable</h2>
          <p>The data provider did not return this fixture. Check the API key and quota, then refresh.</p>
        </section>
      )}

      <MatchTabs
        prediction={prediction}
        h2h={h2h}
        injuries={injuries}
        strongestXI={strongestXI}
        teamsForm={teamsForm}
      />
    </main>
  );
}
