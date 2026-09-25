import MatchTabs from '@/components/MatchTabs';
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
  const [statistics, events, lineups] = fixture
    ? await Promise.all([
        getFixtureStatistics(fixtureId).catch(() => []),
        getFixtureEvents(fixtureId).catch(() => []),
        getFixtureLineups(fixtureId).catch(() => []),
      ])
    : [[], [], []];
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

          <section className="match-detail__section">
            <h2>Statistics</h2>
            {statistics.length ? (
              <div className="match-detail__statistics">
                {statistics[0].statistics.map((stat) => {
                  const awayValue = statistics[1]?.statistics.find(
                    (awayStat) => awayStat.type === stat.type
                  )?.value;
                  return (
                    <div className="match-detail__stat" key={stat.type}>
                      <strong>{stat.value ?? '-'}</strong>
                      <span>{stat.type}</span>
                      <strong>{awayValue ?? '-'}</strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>Statistics are not available for this match yet.</p>
            )}
          </section>

          <section className="match-detail__section">
            <h2>Events</h2>
            {events.length ? (
              <ol className="match-detail__events">
                {events.map((event, index) => (
                  <li key={`${event.time.elapsed}-${event.type}-${index}`}>
                    <time>{event.time.elapsed}&apos;{event.time.extra ? `+${event.time.extra}` : ''}</time>
                    <strong>{event.player.name ?? event.type}</strong>
                    <span>{event.detail}</span>
                    <span>{event.team.name}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No match events are available yet.</p>
            )}
          </section>

          <section className="match-detail__section">
            <h2>Lineups</h2>
            {lineups.length ? (
              <div className="match-detail__lineups">
                {lineups.map((lineup) => (
                  <div key={lineup.team.id}>
                    <h3>{lineup.team.name} <small>{lineup.formation}</small></h3>
                    <ul>
                      {lineup.startXI.map(({ player }) => (
                        <li key={player.id}>{player.number}. {player.name} <span>{player.pos}</span></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p>Lineups have not been published for this match.</p>
            )}
          </section>
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
