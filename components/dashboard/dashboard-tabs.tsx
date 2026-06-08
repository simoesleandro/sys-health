"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const TAB_STYLES = {
  nutricao:
    "data-[state=active]:text-brand-cyan data-[state=active]:after:bg-brand-cyan/50",
  wearable:
    "data-[state=active]:text-brand-purple data-[state=active]:after:bg-brand-purple/50",
  agenda:
    "data-[state=active]:text-brand-magenta data-[state=active]:after:bg-brand-magenta/50",
} as const

export function DashboardTabs({
  nutritionSlot,
  wearableSlot,
  agendaSlot,
}: {
  nutritionSlot: React.ReactNode
  wearableSlot: React.ReactNode
  agendaSlot: React.ReactNode
}) {
  return (
    <Tabs defaultValue="nutricao" className="w-full gap-5">
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-6 border-b border-zinc-800/60 bg-transparent p-0"
      >
        <TabsTrigger
          value="nutricao"
          className={cn(
            "rounded-none border-0 bg-transparent px-0 pb-3 text-xs font-bold tracking-[0.16em] text-slate-500 uppercase after:h-0.5",
            TAB_STYLES.nutricao
          )}
        >
          Nutrição
        </TabsTrigger>
        <TabsTrigger
          value="wearable"
          className={cn(
            "rounded-none border-0 bg-transparent px-0 pb-3 text-xs font-bold tracking-[0.16em] text-slate-500 uppercase after:h-0.5",
            TAB_STYLES.wearable
          )}
        >
          Wearable
        </TabsTrigger>
        <TabsTrigger
          value="agenda"
          className={cn(
            "rounded-none border-0 bg-transparent px-0 pb-3 text-xs font-bold tracking-[0.16em] text-slate-500 uppercase after:h-0.5",
            TAB_STYLES.agenda
          )}
        >
          Agenda
        </TabsTrigger>
      </TabsList>

      <TabsContent value="nutricao" className="mt-0">
        {nutritionSlot}
      </TabsContent>
      <TabsContent value="wearable" className="mt-0">
        {wearableSlot}
      </TabsContent>
      <TabsContent value="agenda" className="mt-0">
        {agendaSlot}
      </TabsContent>
    </Tabs>
  )
}
