import { Footprints } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { NeonCard } from "@/components/ui/neon-card"
import { WorkoutMetric } from "@/components/treinos/workout-metric"
import { cn } from "@/lib/utils"
import {
  formatDistanceKm,
  formatDurationMin,
  formatHeartRate,
  formatRunCalories,
  type ZeppActivityType,
  type ZeppRunSession,
} from "@/lib/treinos"

function activityBadgeClass(tipo: ZeppActivityType) {
  if (tipo === "Corrida") {
    return "border-primary/30 bg-primary/15 text-primary hover:bg-primary/20"
  }
  return "border-chart-2/30 bg-chart-2/15 text-chart-2 hover:bg-chart-2/20"
}

export function ZeppCard({ session }: { session: ZeppRunSession }) {
  return (
    <NeonCard accent="cyan" className="overflow-hidden">
      <div className="border-b border-zinc-800/60 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800/60 bg-black/40 text-brand-cyan">
            <Footprints className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-bold text-white">{session.tipo}</p>
              <Badge
                variant="outline"
                className={cn(activityBadgeClass(session.tipo))}
              >
                {session.tipo}
              </Badge>
            </div>
            <p className="text-sm text-brand-cyan">{session.dataLabel}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <WorkoutMetric
            label="Distância"
            value={formatDistanceKm(session.distanciaKm)}
          />
          <WorkoutMetric
            label="Calorias"
            value={formatRunCalories(session.calorias)}
          />
          <WorkoutMetric label="Pace médio" value={session.pace} />
          <WorkoutMetric
            label="Duração"
            value={formatDurationMin(session.duracaoMinutos)}
          />
          <WorkoutMetric
            label="FC média"
            value={formatHeartRate(session.fcMedia)}
          />
        </div>
      </div>
    </NeonCard>
  )
}
