"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { toggleMedication } from "@/lib/actions/medications"
import type { MedicationChecklistItem } from "@/lib/medications"
import { Checkbox } from "@/components/ui/checkbox"
import { NeonCard } from "@/components/ui/neon-card"
import { SectionHeader } from "@/components/layout/section-header"
import { cn } from "@/lib/utils"

export function MedicationChecklist({
  initialItems,
}: {
  initialItems: MedicationChecklistItem[]
}) {
  const router = useRouter()
  const [items, setItems] = React.useState(initialItems)
  const [pendingId, setPendingId] = React.useState<number | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  function handleToggle(medicationId: number, nextTaken: boolean) {
    setError(null)
    setPendingId(medicationId)

    setItems((current) =>
      current.map((item) =>
        item.id === medicationId ? { ...item, isTaken: nextTaken } : item
      )
    )

    startTransition(async () => {
      const result = await toggleMedication(medicationId, nextTaken)

      if (!result.success) {
        setItems((current) =>
          current.map((item) =>
            item.id === medicationId
              ? { ...item, isTaken: !nextTaken }
              : item
          )
        )
        setError(result.error)
        setPendingId(null)
        return
      }

      setPendingId(null)
      router.refresh()
    })
  }

  const takenCount = items.filter((item) => item.isTaken).length

  return (
    <div className="flex flex-col gap-4">
      <NeonCard accent="magenta" className="p-5">
        <SectionHeader
          title="Checklist de hoje"
          subtitle={`${takenCount} de ${items.length} itens concluídos (BRT)`}
        />

        <div className="mt-4 flex flex-col gap-2">
          {items.map((item) => {
            const isItemPending = isPending && pendingId === item.id

            return (
              <label
                key={item.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800/60 px-3 py-3 transition-colors",
                  item.isTaken ? "bg-black/40" : "bg-zinc-900/30 hover:bg-zinc-900/50",
                  isItemPending && "opacity-70"
                )}
              >
                <Checkbox
                  checked={item.isTaken}
                  disabled={isItemPending}
                  onCheckedChange={(checked) =>
                    handleToggle(item.id, checked === true)
                  }
                  className="mt-0.5"
                />

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      item.isTaken
                        ? "text-slate-500 line-through"
                        : "text-white"
                    )}
                  >
                    {item.nome}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      item.isTaken
                        ? "text-slate-600"
                        : "text-slate-400"
                    )}
                  >
                    {item.dosagem} · {item.periodo}
                  </span>
                </div>
              </label>
            )
          })}
        </div>
      </NeonCard>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
