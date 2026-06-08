import { TreinosTabs } from "@/components/treinos/treinos-tabs"
import { PageHeader } from "@/components/layout/page-header"
import { PageShell } from "@/components/layout/page-shell"
import { getRecentHevyWorkouts, getZeppRunningSessions } from "@/lib/data"

export default async function TreinosPage() {
  const [hevyWorkouts, zeppRuns] = await Promise.all([
    getRecentHevyWorkouts(),
    getZeppRunningSessions(),
  ])

  return (
    <PageShell className="max-w-3xl">
      <PageHeader
        title="Treinos"
        subtitle="Musculação (Hevy) e cardio (Zepp)"
        kicker="SYS.HEALTH"
      />

      <TreinosTabs hevyWorkouts={hevyWorkouts} zeppRuns={zeppRuns} />
    </PageShell>
  )
}
