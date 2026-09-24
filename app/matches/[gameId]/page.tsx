import GameWidget from '@/components/GameWidget';
import MatchTabs from '@/components/MatchTabs';
import { getFixture } from '@/lib/fixtures';
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
      <GameWidget
        gameId={gameId}
        refresh={20}
        defaultTab="statistics"
        teamStatistics
        playerStatistics
        events
      />

      <MatchTabs prediction={prediction} h2h={h2h} injuries={injuries} strongestXI={strongestXI} />
    </main>
  );
}
