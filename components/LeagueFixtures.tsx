'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { FixtureSummary } from '@/lib/fixtures';

interface LeagueFixturesProps {
  leagueId: number;
  initialSeason: number;
}

export default function LeagueFixtures({ leagueId, initialSeason }: LeagueFixturesProps) {
  const [season, setSeason] = useState(initialSeason);
  const [fixtures, setFixtures] = useState<FixtureSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seasons = Array.from({ length: 16 }, (_, index) => initialSeason - index);

  const fixturesByMonth = fixtures.reduce<Record<string, FixtureSummary[]>>((groups, fixture) => {
    const month = new Date(fixture.fixture.date).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
    (groups[month] ??= []).push(fixture);
    return groups;
  }, {});

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/fixtures?league=${leagueId}&season=${season}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? 'Could not load fixtures.');
        return payload.data as FixtureSummary[];
      })
      .then(setFixtures)
      .catch((fetchError: unknown) => {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') return;
        setError(fetchError instanceof Error ? fetchError.message : 'Could not load fixtures.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [leagueId, season]);

  return (
    <section className="league-fixtures" aria-label="League fixtures by season">
      <div className="league-fixtures__toolbar">
        <h2>Fixtures</h2>
        <label>
          <span>Select season</span>
          <select value={season} onChange={(event) => setSeason(Number(event.target.value))}>
            {seasons.map((seasonYear) => (
              <option key={seasonYear} value={seasonYear}>
                {seasonYear}/{String(seasonYear + 1).slice(-2)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? <p role="status">Loading fixtures...</p> : null}
      {!loading && error ? <p role="alert">{error}</p> : null}
      {!loading && !error && fixtures.length === 0 ? (
        <p>No fixtures are available for the {season}/{String(season + 1).slice(-2)} season.</p>
      ) : null}
      {!loading && !error && fixtures.length > 0 ? (
        Object.entries(fixturesByMonth).map(([month, monthFixtures]) => (
          <section className="league-fixtures__month" key={month}>
            <h3>{month}</h3>
            <div className="league-fixtures__list">
              {monthFixtures.map((fixture) => (
                <Link
                  className="league-fixtures__match"
                  href={`/matches/${fixture.fixture.id}?home=${fixture.teams.home.id}&away=${fixture.teams.away.id}`}
                  key={fixture.fixture.id}
                >
                  <time dateTime={fixture.fixture.date}>
                    {new Date(fixture.fixture.date).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                  </time>
                  <strong>{fixture.teams.home.name}</strong>
                  <b>{fixture.goals.home ?? '-'} : {fixture.goals.away ?? '-'}</b>
                  <strong>{fixture.teams.away.name}</strong>
                  <span>{fixture.fixture.status.short}</span>
                </Link>
              ))}
            </div>
          </section>
        ))
      ) : null}
    </section>
  );
}