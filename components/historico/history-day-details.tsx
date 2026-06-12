import { NeonCard } from "@/components/ui/neon-card"
import { formatMealTimeBrt } from "@/lib/data"
import type { EvacuationRecord } from "@/lib/evacuation"
import type { TodayMeal } from "@/lib/meal-types"
import type { HevyWorkout, ZeppRunSession } from "@/lib/treinos"
import { formatDurationMin, formatExerciseRpeSummary, formatVolumeKg } from "@/lib/treinos"

function MealsSection({ meals }: { meals: TodayMeal[] }) {
  return (
    <NeonCard accent="orange" className="p-5">
      <h3 className="neon-section-title">Refeições</h3>
      {meals.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nenhuma refeição neste dia.</p>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-800/60">
          {meals.map((meal) => (
            <li key={meal.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-sm font-bold text-brand-cyan">
                  {formatMealTimeBrt(meal.dataHora)}
                </span>
                <span className="font-semibold text-white">{meal.categoria}</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{meal.descricao}</p>
              <p className="mt-2 text-xs text-slate-500">
                {Math.round(meal.calorias)} kcal · P {Math.round(meal.proteinas)}g
                · C {Math.round(meal.carboidratos)}g · G {Math.round(meal.gorduras)}
                g
              </p>
            </li>
          ))}
        </ul>
      )}
    </NeonCard>
  )
}

function WorkoutsSection({
  hevy,
  zepp,
}: {
  hevy: HevyWorkout[]
  zepp: ZeppRunSession[]
}) {
  const hasAny = hevy.length > 0 || zepp.length > 0

  return (
    <NeonCard accent="green" className="p-5">
      <h3 className="neon-section-title">Treinos</h3>
      {!hasAny ? (
        <p className="mt-2 text-sm text-slate-500">Nenhum treino neste dia.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {hevy.map((workout) => (
            <li
              key={workout.id}
              className="rounded-lg border border-zinc-800/50 bg-black/20 px-3 py-2"
            >
              <p className="font-medium text-white">{workout.titulo}</p>
              <p className="mt-1 text-xs text-slate-500">
                Hevy · {formatDurationMin(workout.duracaoMin)} ·{" "}
                {formatVolumeKg(workout.volumeKg)} · {workout.exercicios.length}{" "}
                exercício(s)
              </p>
              {workout.exercicios.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-slate-400">
                  {workout.exercicios.map((exercise, index) => (
                    <li key={`${workout.id}-${exercise.title}-${index}`}>
                      {exercise.title} · RPE {formatExerciseRpeSummary(exercise)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
          {zepp.map((session) => (
            <li
              key={session.id}
              className="rounded-lg border border-zinc-800/50 bg-black/20 px-3 py-2"
            >
              <p className="font-medium text-white">
                {session.tipo} · {session.distanciaKm.toFixed(2)} km
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Zepp · {session.pace} · {formatDurationMin(session.duracaoMinutos)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </NeonCard>
  )
}

function EvacuationSection({ records }: { records: EvacuationRecord[] }) {
  return (
    <NeonCard accent="purple" className="p-5">
      <h3 className="neon-section-title">Evacuações</h3>
      {records.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nenhum registro neste dia.</p>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-800/60">
          {records.map((record) => (
            <li key={record.id} className="py-2 first:pt-0 last:pb-0">
              <span className="font-mono text-sm text-slate-300">
                {record.horaLabel}
              </span>
              <span className="ml-2 text-sm text-white">{record.tipoLabel}</span>
            </li>
          ))}
        </ul>
      )}
    </NeonCard>
  )
}

export function HistoryDayDetails({
  meals,
  hevyWorkouts,
  zeppSessions,
  evacuations,
}: {
  meals: TodayMeal[]
  hevyWorkouts: HevyWorkout[]
  zeppSessions: ZeppRunSession[]
  evacuations: EvacuationRecord[]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <MealsSection meals={meals} />
      <WorkoutsSection hevy={hevyWorkouts} zepp={zeppSessions} />
      <EvacuationSection records={evacuations} />
    </div>
  )
}
