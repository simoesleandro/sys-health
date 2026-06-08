"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { NeonCard } from "@/components/ui/neon-card"
import {
  formatDurationMin,
  formatSetLabel,
  formatVolumeKg,
  type HevyWorkout,
} from "@/lib/treinos"

export function HevyCard({ workout }: { workout: HevyWorkout }) {
  return (
    <NeonCard accent="green" className="overflow-hidden">
      <div className="border-b border-zinc-800/60 px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-base leading-snug font-bold text-white">
              {workout.titulo}
            </p>
            <p className="text-sm text-brand-cyan">{workout.dataLabel}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {workout.duracaoMin != null
                ? formatDurationMin(workout.duracaoMin)
                : "—"}
            </Badge>
            <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
              {formatVolumeKg(workout.volumeKg)}
            </Badge>
          </div>
        </div>
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
              >
                <AccordionTrigger className="!grid w-full grid-cols-[minmax(0,1fr)_5.5rem_1.25rem] items-center gap-x-3 text-sm font-medium hover:no-underline [&_[data-slot=accordion-trigger-icon]]:col-start-3 [&_[data-slot=accordion-trigger-icon]]:row-start-1 [&_[data-slot=accordion-trigger-icon]]:justify-self-end">
                  <span className="min-w-0 truncate text-left">
                    {exercise.title}
                  </span>
                  <span className="text-right text-xs font-normal whitespace-nowrap text-muted-foreground tabular-nums">
                    {exercise.sets.length} série
                    {exercise.sets.length === 1 ? "" : "s"}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="flex flex-col gap-2 pl-1">
                    {exercise.sets.map((set) => (
                      <li
                        key={`${exercise.title}-${set.index}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          Série {set.index + 1}
                        </span>
                        <span className="font-mono text-xs">
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
