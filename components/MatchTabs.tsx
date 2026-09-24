'use client';

import { useState } from 'react';
import type { H2HFixture } from '@/lib/h2h';
import type { InjuryRecord } from '@/lib/injuries';
import type { PredictionResponse } from '@/lib/predictions';
import type { StrongestXI } from '@/lib/strongest-xi';

interface MatchTabsProps {
  prediction: PredictionResponse | null;
  h2h: H2HFixture[];
  injuries: InjuryRecord[];
  strongestXI: { home: StrongestXI; away: StrongestXI } | null;
}

export default function MatchTabs({ prediction, h2h, injuries, strongestXI }: MatchTabsProps) {
  const [activeTab, setActiveTab] = useState<'predictions' | 'h2h' | 'injuries' | 'strongestXI'>('predictions');

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
                  <p className="strongest-xi__season">Season {team.season} - based on wins as a starter</p>
                  <div className="strongest-xi__positions">
                    {team.positions.map((position) => (
                      <div className="strongest-xi__position" key={position.position}>
                        <span>{position.position}</span>
                        {position.players.length > 0 ? (
                          <div>
                            {position.players.map((player) => (
                              <strong key={player.id}>
                                {player.name} <small>({player.wins} wins)</small>
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
      </div>
    </section>
  );
}
