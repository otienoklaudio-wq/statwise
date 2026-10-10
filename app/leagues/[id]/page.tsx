import { notFound } from 'next/navigation';
import Link from 'next/link';
import LeagueFixtures from '@/components/LeagueFixtures';
import LeagueWidget from '@/components/LeagueWidget';
import { getLeagueById } from '@/lib/leagues';

export default async function LeaguePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view } = await searchParams;
  const league = getLeagueById(Number(id));
  if (!league) return notFound();
  const useCustomCalendar = view === 'custom';

  return (
    <main>
      <h1>{league.name}</h1>
      <p>{league.country}</p>
      <nav className="view-switch" aria-label="Fixtures view">
        {useCustomCalendar ? (
          <Link href={`/leagues/${league.id}`}>Back to API-Football widget</Link>
        ) : (
          <Link href={`/leagues/${league.id}?view=custom`}>Use custom season calendar</Link>
        )}
      </nav>
      {useCustomCalendar ? (
        <LeagueFixtures
          leagueId={league.id}
          initialSeason={new Date().getUTCMonth() >= 6
            ? new Date().getUTCFullYear()
            : new Date().getUTCFullYear() - 1}
        />
      ) : (
        <LeagueWidget leagueId={league.id} tab="games" />
      )}
    </main>
  );
}
