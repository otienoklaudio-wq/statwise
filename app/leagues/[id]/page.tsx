import { notFound } from 'next/navigation';
import LeagueFixtures from '@/components/LeagueFixtures';
import { getLeagueById } from '@/lib/leagues';

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const league = getLeagueById(Number(id));
  if (!league) return notFound();

  return (
    <main>
      <h1>{league.name}</h1>
      <p>{league.country}</p>
      <LeagueFixtures
        leagueId={league.id}
        initialSeason={new Date().getUTCMonth() >= 6
          ? new Date().getUTCFullYear()
          : new Date().getUTCFullYear() - 1}
      />
    </main>
  );
}
