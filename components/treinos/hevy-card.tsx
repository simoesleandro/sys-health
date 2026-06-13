"use client"

import { Dumbbell } from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { NeonCard } from "@/components/ui/neon-card"
import { WorkoutMetric } from "@/components/treinos/workout-metric"
import { cn } from "@/lib/utils"
import {
  formatDurationMin,
  formatExerciseRpeSummary,
  formatSetLabel,
  formatVolumeKg,
  formatWorkoutAverageRpe,
  getWorkoutAverageRpe,
  type HevyWorkout,
} from "@/lib/treinos"

export function HevyCard({ workout }: { workout: HevyWorkout }) {
  const hasRpe = getWorkoutAverageRpe(workout) != null

  return (
    <NeonCard accent="green" className="overflow-hidden">
      <div className="border-b border-zinc-800/60 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800/60 bg-black/40 text-brand-green">
            <Dumbbell className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-bold text-white">Musculação</p>
              <Badge
                variant="outline"
                className="border-brand-green/30 bg-brand-green/15 text-brand-green hover:bg-brand-green/20"
              >
                Hevy
              </Badge>
            </div>
            <p className="text-sm leading-snug font-medium text-slate-300">
              {workout.titulo}
            </p>
            <p className="text-sm text-brand-cyan">{workout.dataLabel}</p>
          </div>
        </div>
      </div>

      <div className="border-b border-zinc-800/60 px-4 py-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <WorkoutMetric
            label="Duração"
            value={formatDurationMin(workout.duracaoMin)}
          />
          <WorkoutMetric
            label="Volume"
            value={formatVolumeKg(workout.volumeKg)}
          />
          <WorkoutMetric
            label="Exercícios"
            value={String(workout.exercicios.length)}
          />
          <WorkoutMetric
            label="RPE médio"
            value={formatWorkoutAverageRpe(workout)}
          />
        </div>
        {!hasRpe ? (
          <p className="mt-3 text-xs text-slate-500">
            RPE ausente neste treino — sincronize o Hevy para atualizar os dados.
          </p>
        ) : null}
      </div>

      <div className="px-4 py-4">
        {workout.exercicios.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum exercício registrado neste treino.
          </p>
        ) : (
          <Accordion type="multiple" className="w-full">
            {workout.exercicios.map((exercise, index) => (
              <AccordionItem
                key={`${workout.id}-${exercise.title}-${index}`}
                value={`${workout.id}-${index}`}
                className="border-zinc-800/40"
              >
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="grid w-full grid-cols-1 gap-2 pr-2 sm:grid-cols-[minmax(0,1fr)_5rem_4rem] sm:items-center sm:gap-3">
                    <span className="min-w-0 text-left text-white">
                      {exercise.title}
                    </span>
                    <span className="text-xs text-slate-500 sm:text-right">
                      {exercise.sets.length} série
                      {exercise.sets.length === 1 ? "" : "s"}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold sm:text-right tabular-nums",
                        formatExerciseRpeSummary(exercise) === "—"
                          ? "text-slate-500"
                          : "text-brand-green"
                      )}
                    >
                      RPE {formatExerciseRpeSummary(exercise)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="flex flex-col gap-2 rounded-lg border border-zinc-800/50 bg-black/20 p-3">
                    {exercise.sets.map((set, setIndex) => (
                      <li
                        key={`${exercise.title}-${set.index}-${setIndex}`}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-slate-500">
                          Série {setIndex + 1}
                        </span>
                        <span className="font-mono text-xs text-white">
                          {formatSetLabel(set)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </NeonCard>
  )
}
