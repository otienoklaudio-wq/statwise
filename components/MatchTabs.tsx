'use client';

import { useState } from 'react';
import type { H2HFixture } from '@/lib/h2h';
import type { InjuryRecord } from '@/lib/injuries';
import type { PredictionResponse } from '@/lib/predictions';
import type { StrongestXI } from '@/lib/strongest-xi';
import type { TeamForm } from '@/lib/team-form';

interface MatchTabsProps {
  prediction: PredictionResponse | null;
  h2h: H2HFixture[];
  injuries: InjuryRecord[];
  strongestXI: { home: StrongestXI; away: StrongestXI } | null;
  teamsForm: { home: TeamForm; away: TeamForm } | null;
}

const comparisonAxes = [
  { key: 'form', label: 'Form' },
  { key: 'att', label: 'Attack' },
  { key: 'def', label: 'Defense' },
  { key: 'poisson_distribution', label: 'Poisson' },
  { key: 'h2h', label: 'H2H' },
  { key: 'goals', label: 'Goals' },
  { key: 'total', label: 'Overall' },
] as const;

type ComparisonKey = (typeof comparisonAxes)[number]['key'];

function comparisonPercent(value: string): number | null {
  const parsed = Number.parseFloat(value.replace('%', '').trim());
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : null;
}

function radarPoints(values: number[], centerX: number, centerY: number, radius: number): string {
  return values.map((value, index) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / values.length;
    const pointRadius = radius * value / 100;
    const x = centerX + Math.cos(angle) * pointRadius;
    const y = centerY + Math.sin(angle) * pointRadius;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function ComparisonChart({ prediction }: { prediction: PredictionResponse }) {
  const metrics = comparisonAxes.map(({ key, label }) => ({
    key,
    label,
    home: comparisonPercent(prediction.comparison[key].home),
    away: comparisonPercent(prediction.comparison[key].away),
  }));
  const chartAvailable = metrics.every((metric) => metric.home !== null && metric.away !== null);
  const centerX = 160;
  const centerY = 145;
  const radius = 91;
  const homeValues = metrics.map((metric) => metric.home ?? 0);
  const awayValues = metrics.map((metric) => metric.away ?? 0);

  return (
    <section className="prediction-comparison" aria-labelledby="prediction-comparison-title">
      <h3 id="prediction-comparison-title">Team comparison</h3>
      <div className="prediction-comparison__layout">
        <div className="prediction-radar">
          {chartAvailable ? (
            <svg
              className="prediction-radar__chart"
              viewBox="0 0 320 290"
              role="img"
              aria-label={`${prediction.teams.home.name} and ${prediction.teams.away.name} comparison radar chart`}
            >
              {[25, 50, 75, 100].map((level) => (
                <polygon
                  className="prediction-radar__grid"
                  key={level}
                  points={radarPoints(metrics.map(() => level), centerX, centerY, radius)}
                />
              ))}
              {metrics.map((metric, index) => {
                const angle = -Math.PI / 2 + (2 * Math.PI * index) / metrics.length;
                const labelRadius = radius + 20;
                const x = centerX + Math.cos(angle) * labelRadius;
                const y = centerY + Math.sin(angle) * labelRadius;
                const anchor = Math.cos(angle) > 0.35
                  ? 'start'
                  : Math.cos(angle) < -0.35 ? 'end' : 'middle';
                return (
                  <g key={metric.key}>
                    <line
                      className="prediction-radar__axis"
                      x1={centerX}
                      y1={centerY}
                      x2={centerX + Math.cos(angle) * radius}
                      y2={centerY + Math.sin(angle) * radius}
                    />
                    <text className="prediction-radar__label" x={x} y={y} textAnchor={anchor}>
                      {metric.label}
                    </text>
                  </g>
                );
              })}
              <polygon
                className="prediction-radar__shape prediction-radar__shape--home"
                points={radarPoints(homeValues, centerX, centerY, radius)}
              />
              <polygon
                className="prediction-radar__shape prediction-radar__shape--away"
                points={radarPoints(awayValues, centerX, centerY, radius)}
              />
            </svg>
          ) : (
            <p className="prediction-radar__empty">The comparison chart is unavailable because some metrics were not returned.</p>
          )}
          <div className="prediction-radar__legend" aria-label="Teams">
            <span><i className="prediction-radar__key prediction-radar__key--home" />{prediction.teams.home.name}</span>
            <span><i className="prediction-radar__key prediction-radar__key--away" />{prediction.teams.away.name}</span>
          </div>
        </div>

        <div className="prediction-strengths" aria-label="Comparison strength metrics">
          {metrics.map((metric) => (
            <div className="prediction-strength" key={metric.key}>
              <div className="prediction-strength__labels">
                <span>{metric.home === null ? '—' : `${metric.home}%`}</span>
                <strong>{metric.label}</strong>
                <span>{metric.away === null ? '—' : `${metric.away}%`}</span>
              </div>
              <div className="prediction-strength__track" aria-hidden="true">
                <div className="prediction-strength__side prediction-strength__side--home">
                  <i style={{ width: `${metric.home ?? 0}%` }} />
                </div>
                <span className="prediction-strength__divider" />
                <div className="prediction-strength__side prediction-strength__side--away">
                  <i style={{ width: `${metric.away ?? 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function MatchTabs({ prediction, h2h, injuries, strongestXI, teamsForm }: MatchTabsProps) {
  const [activeTab, setActiveTab] = useState<'predictions' | 'h2h' | 'injuries' | 'strongestXI' | 'teamForm'>('predictions');

  return (
    <section className="match-tabs">
      <div className="match-tabs__header" role="tablist" aria-label="Match information tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'predictions'}
          className={activeTab === 'predictions' ? 'match-tab is-active' : 'match-tab'}
          onClick={() => setActiveTab('predictions')}
        >
          Predictions
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'teamForm'}
          className={activeTab === 'teamForm' ? 'match-tab is-active' : 'match-tab'}
          onClick={() => setActiveTab('teamForm')}
        >
          Team Form
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'h2h'}
          className={activeTab === 'h2h' ? 'match-tab is-active' : 'match-tab'}
          onClick={() => setActiveTab('h2h')}
        >
          H2H
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'injuries'}
          className={activeTab === 'injuries' ? 'match-tab is-active' : 'match-tab'}
          onClick={() => setActiveTab('injuries')}
        >
          Injuries
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'strongestXI'}
          className={activeTab === 'strongestXI' ? 'match-tab is-active' : 'match-tab'}
          onClick={() => setActiveTab('strongestXI')}
        >
          Strongest XI
        </button>
      </div>

      <div className="match-tab-panel" role="tabpanel">
          {activeTab === 'predictions' && (prediction ? (
            <div className="prediction-panel">
              <div className="prediction-summary">
                <div>
                  <span className="prediction-kicker">Advice</span>
                  <p>{prediction.predictions.advice}</p>
                </div>
                <div>
                  <span className="prediction-kicker">Winner</span>
                  <p>{prediction.predictions.winner.name ?? 'No clear winner'}</p>
                </div>
              </div>

              <div className="prediction-grid">
                <div className="prediction-metric">
                  <span>Home</span>
                  <strong>{prediction.predictions.percent.home}</strong>
                </div>
                <div className="prediction-metric">
                  <span>Draw</span>
                  <strong>{prediction.predictions.percent.draw}</strong>
                </div>
                <div className="prediction-metric">
                  <span>Away</span>
                  <strong>{prediction.predictions.percent.away}</strong>
                </div>
                <div className="prediction-metric">
                  <span>Goals</span>
                  <strong>
                    {prediction.predictions.goals.home} - {prediction.predictions.goals.away}
                  </strong>
                </div>
                <div className="prediction-metric">
                  <span>Under/Over</span>
                  <strong>{prediction.predictions.under_over ?? 'n/a'}</strong>
                </div>
                <div className="prediction-metric">
                  <span>Win or Draw</span>
                  <strong>{prediction.predictions.win_or_draw ? 'Yes' : 'No'}</strong>
                </div>
              </div>
              <ComparisonChart prediction={prediction} />
            </div>
          ) : (
            <p>No prediction data available for this fixture yet.</p>
          ))}
          {activeTab === 'h2h' && (h2h.length > 0 ? (
            <div className="match-list">
              {h2h.slice(0, 10).map((match) => (
                <div className="match-list__row" key={match.fixture.id}>
                  <span>{new Date(match.fixture.date).toLocaleDateString()}</span>
                  <strong>{match.teams.home.name}</strong>
                  <b>{match.goals.home ?? '-'} - {match.goals.away ?? '-'}</b>
                  <strong>{match.teams.away.name}</strong>
                  <span>{match.league.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No head-to-head data available for these teams.</p>
          ))}
          {activeTab === 'injuries' && (injuries.length > 0 ? (
            <div className="match-list">
              {injuries.map((injury) => (
                <div className="match-list__row" key={`${injury.team.id}-${injury.player.id}`}>
                  <strong>{injury.player.name}</strong>
                  <span>{injury.team.name}</span>
                  <span>{injury.player.type}</span>
                  <span>{injury.player.reason}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No injury information available for this fixture.</p>
          ))}
          {activeTab === 'strongestXI' && (strongestXI ? (
            <div className="strongest-xi">
              {[strongestXI.home, strongestXI.away].map((team) => (
                <section className="strongest-xi__team" key={team.team.id}>
                  <h3>{team.team.name}</h3>
                  <p className="strongest-xi__season">
                    Season {team.season} - {team.fixturesWithLineups} of {team.completedFixtures} completed match lineups available
                  </p>
                  <div className="strongest-xi__positions">
                    {team.positions.map((position) => (
                      <div className="strongest-xi__position" key={position.position}>
                        <span>{position.position}</span>
                        {position.players.length > 0 ? (
                          <div>
                            {position.players.map((player) => (
                              <strong key={player.id}>
                                {player.name} <small>({player.wins} wins, {player.appearances} starts)</small>
                              </strong>
                            ))}
                          </div>
                        ) : (
                          <strong>No starter data</strong>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p>Strongest XI data is not available for this fixture yet.</p>
          ))}
          {activeTab === 'teamForm' && (teamsForm ? (
            <div className="team-form">
              {[teamsForm.home, teamsForm.away].map((team) => (
                <section className="team-form__team" key={team.team.id}>
                  <h3>{team.team.name}</h3>
                  {team.matches.length > 0 ? (
                    <>
                      <ol className="team-form__results" aria-label={`${team.team.name} last ${team.matches.length} results`}>
                        {team.matches.map((match) => (
                          <li
                            className={`team-form__result team-form__result--${match.result.toLowerCase()}`}
                            key={match.fixtureId}
                            title={`${match.result}: ${match.venue} vs ${match.opponent}, ${match.goalsFor}-${match.goalsAgainst}`}
                          >
                            {match.result}
                          </li>
                        ))}
                      </ol>
                      <ol className="team-form__matches">
                        {team.matches.map((match) => (
                          <li key={match.fixtureId}>
                            <time dateTime={match.date}>{new Date(match.date).toLocaleDateString()}</time>
                            <span>{match.venue} vs {match.opponent}</span>
                            <strong>{match.goalsFor} - {match.goalsAgainst}</strong>
                            <b className={`team-form__tag team-form__tag--${match.result.toLowerCase()}`}>{match.result}</b>
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : (
                    <p>No completed league matches were available before this fixture.</p>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <p>Team form is temporarily unavailable because recent league results could not be loaded.</p>
          ))}
      </div>
    </section>
  );
}
