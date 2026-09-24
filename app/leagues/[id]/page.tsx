import { notFound } from 'next/navigation';
import LeagueWidget from '@/components/LeagueWidget';
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
      <LeagueWidget leagueId={league.id} standings tab="results" refresh={20} />
    </main>
  );
}
