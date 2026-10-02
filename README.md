# Football Predictor

Match analysis and outcome-prediction website covering: Premier League,
Championship, La Liga, Serie A, Bundesliga, Ligue 1 (football only).

## Setup

```bash
npm install
cp .env.local.example .env.local
# then edit .env.local and fill in your real API-Football keys
npm run dev
```

Open http://localhost:3000

## Before widgets will work

1. Get your key(s) at dashboard.api-football.com
2. Fill in `API_FOOTBALL_KEY` (server-only, used by `lib/`) and
   `NEXT_PUBLIC_API_FOOTBALL_WIDGET_KEY` (browser-exposed, used by the
   widget components) in `.env.local`
3. In the API-Sports dashboard, restrict the widget key to your domain(s)
   - add `localhost` while developing, plus your production domain later
4. Widgets and your own REST calls share the same daily quota - see the
   note in `lib/api-football.ts` and keep an eye on the `/status` endpoint

## What's here

- `lib/api-football.ts` - server-side REST wrapper (never import from a
  client component; reads the non-public env var). Responses are cached in
  memory by endpoint and parameters: predictions/injuries for 5 minutes,
  fixture data for 1 minute, and other endpoints for 10 minutes. The cache
  is limited to 250 entries and resets when the server restarts.
- `lib/fixtures.ts`, `lib/injuries.ts`, `lib/predictions.ts` - typed
  functions for the REST endpoints covered so far
- `lib/leagues.ts` - the six target leagues; `widgetSeasonId` still
  needs resolving per league before the games widget pages will render
  (see the note in that file)
- `components/*Widget.tsx` - typed wrappers around each
  `<api-sports-widget>` type (league, games, game, h2h, team) plus the
  global `WidgetConfig`
- `app/` - routes wiring the above together: home, per-league page,
  today's fixtures, a single match page, a team page

## Backend API

The app exposes server-side route handlers so browser pages can consume our
own API without calling API-Football directly:

- `GET /api/health` - reports service status and whether the private provider
  key is configured. It never returns the key itself.
- `GET /api/matches/:gameId` - returns the fixture, prediction, H2H, injuries,
  strongest-XI, statistics, events, lineups, and card forecast for one match.

The route handlers call the existing `lib/*` provider adapter, so the private
`API_FOOTBALL_KEY` remains server-only. The next backend layers are durable
storage, scheduled fixture ingestion, provider response caching, and the
probability/model services that will eventually replace the browser widgets.

## Known gaps / not yet built

These were flagged during planning and are not yet implemented in code:

- **Strongest XI / Predicted XI models** - no win-rate-by-position logic
  yet; `app/teams/[teamId]/page.tsx` has a placeholder section for it
- **Database / durable caching layer** - the current cache is process-local;
  it resets when the server restarts. Durable storage and scheduled ingestion
  are the next backend step.
- **Chance-creation index** (open play vs set-piece goals, key-passes/
  assists aggregation) - not implemented
- **Yellow/red card estimate** - `lib/cards.ts` counts cards from each
  team's five most recent completed fixtures in the match season. Expected
  totals are the sum of the two teams' per-match averages. If at least three
  sampled matches were handled by the assigned referee, a referee-to-sample
  rate ratio is clamped to 0.75-1.25 and shrunk toward 1 by `n / (n + 4)`.
  Red-card probability uses `1 - exp(-expectedRedCards)`. This is a heuristic
  estimate, not a trained model; matches are fetched on demand because durable
  referee history and scheduled ingestion are not yet implemented.
- **Broader Poisson / Negative Binomial model** (goal and bet probability
  rankings) - not implemented
- **BunnyCDN caching layer for the widget key** - intentionally deferred
  until after the site is operational
- **`widgetSeasonId` values** in `lib/leagues.ts` - placeholders, need
  confirming against the current season before the games widget will
  render fixtures correctly

No emojis anywhere in the UI, per project requirement.
