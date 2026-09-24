export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'statwise-api',
    provider: 'api-football',
    serverKeyConfigured: Boolean(process.env.API_FOOTBALL_KEY?.trim()),
    timestamp: new Date().toISOString(),
  });
}
