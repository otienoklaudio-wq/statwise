import { getLeagueFixtures } from '@/lib/fixtures';

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const leagueId = Number(searchParams.get('league'));
  const season = Number(searchParams.get('season'));
  const currentYear = new Date().getUTCFullYear();

  if (
    !Number.isInteger(leagueId) || leagueId <= 0 ||
    !Number.isInteger(season) || season < 1900 || season > currentYear + 1
  ) {
    return Response.json(
      { error: 'Provide a positive league ID and a valid season start year.' },
      { status: 400 }
    );
  }

  try {
    const fixtures = await getLeagueFixtures(leagueId, season);
    return Response.json({ data: fixtures });
  } catch (error) {
    console.error('League fixtures API error', { leagueId, season, error });
    return Response.json(
      {
        error: error instanceof Error
          ? error.message
          : 'Fixture data is temporarily unavailable from the provider.',
      },
      { status: 502 }
    );
  }
}