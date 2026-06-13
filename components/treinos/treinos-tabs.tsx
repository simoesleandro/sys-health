"use client"

import { HevySyncButton } from "@/components/layout/hevy-sync-button"
import { ZeppSyncButton } from "@/components/layout/zepp-sync-button"
import { HevyCard } from "@/components/treinos/hevy-card"
import { ZeppCard } from "@/components/treinos/zepp-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { HevyWorkout, ZeppRunSession } from "@/lib/treinos"

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export function TreinosTabs({
  hevyWorkouts,
  zeppRuns,
}: {
  hevyWorkouts: HevyWorkout[]
  zeppRuns: ZeppRunSession[]
}) {
  return (
    <Tabs defaultValue="hevy" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:w-auto">
        <TabsTrigger value="hevy">Musculação (Hevy)</TabsTrigger>
        <TabsTrigger value="zepp">Cardio (Zepp)</TabsTrigger>
      </TabsList>

      <TabsContent value="hevy" className="mt-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950/50 px-3 py-2.5 backdrop-blur-md">
          <p className="text-xs text-slate-500">
            Treinos de musculação sincronizados do Hevy
          </p>
          <HevySyncButton />
        </div>

        {hevyWorkouts.length === 0 ? (
          <EmptyState message="Nenhum treino Hevy sincronizado ainda." />
        ) : (
          hevyWorkouts.map((workout) => (
            <HevyCard key={workout.id} workout={workout} />
          ))
        )}
      </TabsContent>

      <TabsContent value="zepp" className="mt-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950/50 px-3 py-2.5 backdrop-blur-md">
          <p className="text-xs text-slate-500">
            Corridas e caminhadas do relógio Zepp
          </p>
          <ZeppSyncButton />
        </div>

        {zeppRuns.length === 0 ? (
          <EmptyState message="Nenhuma corrida registrada pelo Zepp ainda." />
        ) : (
          zeppRuns.map((session) => (
            <ZeppCard key={session.id} session={session} />
          ))
        )}
      </TabsContent>
    </Tabs>
  )
}
