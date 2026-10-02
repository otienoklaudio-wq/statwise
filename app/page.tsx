import Link from 'next/link';
import { LEAGUES } from '@/lib/leagues';
import ThemeSettings from '@/components/ThemeSettings';

export default function HomePage() {
  return (
    <main className="home-shell">
      <header className="home-header">
        <div className="home-brand">
          <Link className="wordmark" href="/">
            <span className="wordmark__code">FP / 26</span>
            <h1 className="wordmark__name">Statwise</h1>
          </Link>
          <p className="home-intro">Past performance doesnt guarantee future results.</p>
        </div>
        <ThemeSettings />
      </header>

      <section className="home-content">
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
