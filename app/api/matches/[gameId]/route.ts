import {
  getFixture,
  getFixtureEvents,
  getFixtureLineups,
  getFixtureStatistics,
} from '@/lib/fixtures';
import { getCardForecast } from '@/lib/cards';
import { getCornerForecast } from '@/lib/corners';
import { getH2H } from '@/lib/h2h';
import { getInjuries } from '@/lib/injuries';
import { getPrediction } from '@/lib/predictions';
import { getStrongestXIs } from '@/lib/strongest-xi';
import { getTeamsForm } from '@/lib/team-form';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const fixtureId = Number(gameId);

  if (!Number.isInteger(fixtureId) || fixtureId <= 0) {
    return Response.json(
      { error: 'gameId must be a positive integer' },
      { status: 400 }
    );
  }

  try {
    const fixture = await getFixture(fixtureId);
    if (!fixture) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    const homeTeamId = fixture.teams.home.id;
    const awayTeamId = fixture.teams.away.id;
    const [statistics, events, lineups, cardForecast, cornerForecast, teamsForm, prediction, h2h, injuries, strongestXI] = await Promise.all([
      getFixtureStatistics(fixtureId),
      getFixtureEvents(fixtureId),
      getFixtureLineups(fixtureId),
      getCardForecast(fixture, homeTeamId, awayTeamId).catch(() => null),
      getCornerForecast(fixture).catch(() => null),
      getTeamsForm(fixture).catch(() => null),
      getPrediction(fixtureId),
      getH2H(homeTeamId, awayTeamId),
      getInjuries({ fixture: fixtureId }),
      getStrongestXIs(fixtureId, homeTeamId, awayTeamId),
    ]);

    return Response.json({
      data: {
        fixture,
        statistics,
        events,
        lineups,
        cardForecast,
        cornerForecast,
        teamsForm,
        prediction,
        h2h,
        injuries,
        strongestXI,
      },
      meta: {
        source: 'api-football',
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Match API error', { fixtureId, error });
    return Response.json(
      { error: 'Unable to load match data' },
      { status: 502 }
    );
  }
}
