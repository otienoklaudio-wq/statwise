import { apiFootball } from './api-football';

export interface H2HFixture {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; name: string; season: number };
  teams: {
    home: { id: number; name: string; winner: boolean | null };
    away: { id: number; name: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}

export async function getH2H(teamA: number, teamB: number): Promise<H2HFixture[]> {
  const data = await apiFootball<{ response: H2HFixture[] }>('/fixtures/headtohead', {
    h2h: `${teamA}-${teamB}`,
  });
  return data.response;
}
