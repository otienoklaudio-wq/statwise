import GamesWidget from '@/components/GamesWidget';
import { LEAGUES } from '@/lib/leagues';

export default function TodayFixturesPage() {
  const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

  return (
    <main>
      <h1>Today&apos;s Fixtures</h1>
      {LEAGUES.map((league) => (
        <section key={league.id}>
          <h2>{league.name}</h2>
          {league.widgetSeasonId ? (
            <GamesWidget
              date={today}
              leagueSeason={league.widgetSeasonId}
              refresh={15}
              compact
            />
          ) : (
            <p>
              Widget season ID not yet resolved for {league.name} - see the note in
              lib/leagues.ts.
            </p>
          )}
        </section>
      ))}
    </main>
  );
}
