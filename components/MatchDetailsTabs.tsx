'use client';

import { useRef, useState } from 'react';
import type { CardForecast } from '@/lib/cards';
import type { CornerForecast } from '@/lib/corners';
import type { FixtureEvent, Lineup, TeamFixtureStatistics } from '@/lib/fixtures';

interface MatchDetailsTabsProps {
  statistics: TeamFixtureStatistics[];
  events: FixtureEvent[];
  lineups: Lineup[];
  cardForecast: CardForecast | null;
  cornerForecast: CornerForecast | null;
}

const tabs = [
  { id: 'statistics', label: 'Statistics' },
  { id: 'events', label: 'Events' },
  { id: 'lineups', label: 'Lineups' },
  { id: 'cards', label: 'Cards' },
  { id: 'corners', label: 'Corners' },
] as const;

type MatchDetailsTab = (typeof tabs)[number]['id'];

export default function MatchDetailsTabs({
  statistics,
  events,
  lineups,
  cardForecast,
  cornerForecast,
}: MatchDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<MatchDetailsTab>('statistics');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    let nextIndex: number | undefined;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    setActiveTab(tabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="match-detail__tabs">
      <div className="match-detail__tablist" role="tablist" aria-label="Match details">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => { tabRefs.current[index] = element; }}
            id={`match-detail-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="match-detail-tabpanel"
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={activeTab === tab.id ? 'match-detail__tab is-active' : 'match-detail__tab'}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id="match-detail-tabpanel"
        className="match-detail__tabpanel"
        role="tabpanel"
        aria-labelledby={`match-detail-tab-${activeTab}`}
        tabIndex={0}
      >
        {activeTab === 'statistics' && (
          statistics.length ? (
            <div className="match-detail__statistics">
              {statistics[0].statistics.map((stat) => {
                const awayValue = statistics[1]?.statistics.find(
                  (awayStat) => awayStat.type === stat.type
                )?.value;
                return (
                  <div className="match-detail__stat" key={stat.type}>
                    <strong>{stat.value ?? '-'}</strong>
                    <span>{stat.type}</span>
                    <strong>{awayValue ?? '-'}</strong>
                  </div>
                );
              })}
            </div>
          ) : <p>Statistics are not available for this match yet.</p>
        )}

        {activeTab === 'events' && (
          events.length ? (
            <ol className="match-detail__events">
              {events.map((event, index) => (
                <li key={`${event.time.elapsed}-${event.type}-${index}`}>
                  <time>{event.time.elapsed}&apos;{event.time.extra ? `+${event.time.extra}` : ''}</time>
                  <strong>{event.player.name ?? event.type}</strong>
                  <span>{event.detail}</span>
                  <span>{event.team.name}</span>
                </li>
              ))}
            </ol>
          ) : <p>No match events are available yet.</p>
        )}

        {activeTab === 'lineups' && (
          lineups.length ? (
            <div className="match-detail__lineups">
              {lineups.map((lineup) => (
                <div key={lineup.team.id}>
                  <h3>{lineup.team.name} <small>{lineup.formation}</small></h3>
                  <ul>
                    {lineup.startXI.map(({ player }) => (
                      <li key={player.id}>{player.number}. {player.name} <span>{player.pos}</span></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : <p>Lineups have not been published for this match.</p>
        )}

        {activeTab === 'cards' && (
          cardForecast ? (
            <div className="card-forecast">
              <div className="card-forecast__metrics">
                <div>
                  <span>Expected yellow cards</span>
                  <strong>{cardForecast.expectedYellowCards.toFixed(1)}</strong>
                  <small>Most likely: {cardForecast.mostLikelyYellowCards}</small>
                </div>
                <div>
                  <span>Expected red cards</span>
                  <strong>{cardForecast.expectedRedCards.toFixed(2)}</strong>
                  <small>Most likely: {cardForecast.mostLikelyRedCards}</small>
                </div>
                <div>
                  <span>Chance of at least one red</span>
                  <strong>{(cardForecast.redCardProbability * 100).toFixed(0)}%</strong>
                  <small>Poisson probability estimate</small>
                </div>
              </div>
              <p>
                Based on the last {cardForecast.homeSampleSize} home-team and {cardForecast.awaySampleSize} away-team matches.
                {cardForecast.refereeAdjustmentUsed
                  ? ` Referee adjustment uses ${cardForecast.refereeMatches} matching past games.`
                  : ' No referee adjustment was applied.'}
              </p>
            </div>
          ) : <p>Card estimates need available recent match events and are shown for upcoming fixtures only.</p>
        )}

        {activeTab === 'corners' && (
          cornerForecast ? (
            <div className="corner-forecast">
              <div className="card-forecast__metrics">
                <div>
                  <span>Home corners expected</span>
                  <strong>{cornerForecast.expectedHome.toFixed(1)}</strong>
                  <small>Based on {cornerForecast.homeSamples} recent matches</small>
                </div>
                <div>
                  <span>Away corners expected</span>
                  <strong>{cornerForecast.expectedAway.toFixed(1)}</strong>
                  <small>Based on {cornerForecast.awaySamples} recent matches</small>
                </div>
                <div>
                  <span>Total corners expected</span>
                  <strong>{cornerForecast.expectedTotal.toFixed(1)}</strong>
                  <small>Negative Binomial dispersion: {cornerForecast.dispersion.toFixed(1)}</small>
                </div>
              </div>
              <div className="corner-forecast__table" role="table" aria-label="Total corner threshold probabilities">
                <div className="corner-forecast__row corner-forecast__row--header" role="row">
                  <span role="columnheader">Total line</span>
                  <span role="columnheader">Under</span>
                  <span role="columnheader">Over</span>
                </div>
                {cornerForecast.totalThresholds
                  .filter((threshold) => threshold.side === 'under')
                  .map((under) => {
                    const over = cornerForecast.totalThresholds.find(
                      (threshold) => threshold.line === under.line && threshold.side === 'over'
                    );
                    return (
                      <div className="corner-forecast__row" role="row" key={under.line}>
                        <strong role="cell">{under.line.toFixed(1)}</strong>
                        <span role="cell">{(under.probability * 100).toFixed(1)}%</span>
                        <span role="cell">{((over?.probability ?? 0) * 100).toFixed(1)}%</span>
                      </div>
                    );
                  })}
              </div>
              <p>
                Negative Binomial estimates use the last five completed league matches available for each team and a baseline from {cornerForecast.leagueBaselineSamples} unique matches.
              </p>
            </div>
          ) : <p>Corner estimates require available recent league fixtures and match statistics; forecasts are for upcoming fixtures only.</p>
        )}
      </div>
    </div>
  );
}
