import { apiFootball } from './api-football';

export interface InjuryRecord {
  player: {
    id: number;
    name: string;
    photo: string;
    type: string; // e.g. "Injury", "Suspended", "Illness"
    reason: string;
  };
  team: { id: number; name: string; logo: string };
  fixture: { id: number; timezone: string; date: string; season: number };
  league: { id: number; season: number; name: string; country: string };
}

/**
 * GET /injuries - accepts fixture, OR team+season, OR league+season,
 * OR player+season, OR date. Pick the combination that matches your
 * use case; the API rejects ambiguous combinations.
 */
export async function getInjuries(params: {
  fixture?: number;
  team?: number;
  league?: number;
  season?: number;
  player?: number;
  date?: string; // 'YYYY-MM-DD'
}) {
  const data = await apiFootball<{ response: InjuryRecord[] }>('/injuries', params);
  return data.response;
}
