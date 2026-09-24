import { apiFootball } from './api-football';

export interface TeamRecentForm {
  played: number;
  form: string; // e.g. "WWDLW"
  att: string;
  def: string;
  goals: {
    for: { total: number; average: string };
    against: { total: number; average: string };
  };
}

export interface PredictionResponse {
  predictions: {
    winner: { id: number | null; name: string | null; comment: string | null };
    win_or_draw: boolean;
    under_over: string | null; // e.g. "+2.5"
    goals: { home: string; away: string };
    advice: string;
    percent: { home: string; draw: string; away: string };
  };
  league: { id: number; name: string; season: number };
  teams: {
    home: { id: number; name: string; last_5: TeamRecentForm };
    away: { id: number; name: string; last_5: TeamRecentForm };
  };
  comparison: {
    form: { home: string; away: string };
    att: { home: string; away: string };
    def: { home: string; away: string };
    poisson_distribution: { home: string; away: string };
    h2h: { home: string; away: string };
    goals: { home: string; away: string };
    total: { home: string; away: string };
  };
}

/**
 * GET /predictions - API-Football's own form/attack/defense-driven
 * prediction. Does NOT factor in bookmaker odds. Treat as a benchmark
 * to compare against your own model, not as ground truth.
 *
 * Some fixtures do not have a prediction payload yet or the API may return
 * an empty array. Return null instead of undefined so callers can handle
 * the missing data cleanly.
 */
export async function getPredictions(fixtureId: number): Promise<PredictionResponse | null> {
  const data = await apiFootball<{ response?: PredictionResponse[] }>('/predictions', {
    fixture: fixtureId,
  });

  if (!data.response || data.response.length === 0) {
    return null;
  }

  return data.response[0];
}

export async function getPrediction(fixtureId: number): Promise<PredictionResponse | null> {
  return getPredictions(fixtureId);
}
