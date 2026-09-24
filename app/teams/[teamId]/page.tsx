import TeamWidget from '@/components/TeamWidget';

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <main>
      <h1>Team Detail</h1>
      <TeamWidget teamId={teamId} defaultTab="squads" teamStatistics teamSquads />

      <section>
        <h2>Strongest XI</h2>
        <p>
          Custom feature, not part of the widget - to be wired up to your own
          win-rate-by-position model (independent of current fitness/injury status)
          plus a separate &quot;Predicted XI&quot; view filtered by lib/injuries.ts.
          Placeholder pending that logic.
        </p>
      </section>
    </main>
  );
}
