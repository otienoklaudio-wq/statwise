import Link from 'next/link';
import { LEAGUES } from '@/lib/leagues';
import ThemeSettings from '@/components/ThemeSettings';

export default function HomePage() {
  return (
    <main className="home-shell">
      <header className="home-header">
        <Link className="wordmark" href="/">FP / 26</Link>
        <ThemeSettings />
      </header>

      <section className="home-content">
        <p className="eyebrow">European football intelligence</p>
        <h1>Statwise</h1>
        <p className="home-intro">Past performance doesnt guarantee future results.</p>

        <ul className="league-list">
        {LEAGUES.map((league) => (
          <li key={league.id}>
            <Link href={`/leagues/${league.id}`}>
              <span>{league.name}</span>
              <span className="league-country">{league.country}</span>
            </Link>
          </li>
        ))}
        </ul>
      </section>
    </main>
  );
}
