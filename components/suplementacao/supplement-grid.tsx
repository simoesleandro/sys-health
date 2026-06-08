"use client"

import * as React from "react"
import { Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { toggleSupplement } from "@/lib/actions/supplements"
import { SUPPLEMENT_THEME_STYLES } from "@/lib/supplement-theme"
import type { SupplementGridItem } from "@/lib/supplements"
import { cn } from "@/lib/utils"

function SupplementCard({
  item,
  onError,
  onTakenChange,
}: {
  item: SupplementGridItem
  onError: (message: string | null) => void
  onTakenChange: (id: string, isTaken: boolean) => void
}) {
  const router = useRouter()
  const [isTaken, setIsTaken] = React.useState(item.isTaken)
  const [mealId, setMealId] = React.useState(item.mealId)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    setIsTaken(item.isTaken)
    setMealId(item.mealId)
  }, [item.id, item.isTaken, item.mealId])

  async function handleToggle() {
    if (isSaving) return

    const previousTaken = isTaken
    const previousMealId = mealId
    const nextTaken = !isTaken

    onError(null)
    setIsTaken(nextTaken)
    onTakenChange(item.id, nextTaken)
    setIsSaving(true)

    try {
      const result = await toggleSupplement(item.id, nextTaken, mealId)

      if (!result.success) {
        setIsTaken(previousTaken)
        setMealId(previousMealId)
        onTakenChange(item.id, previousTaken)
        onError(result.error)
        return
      }

      if ("mealId" in result) {
        setMealId(result.mealId)
      }

      router.refresh()
    } catch {
      setIsTaken(previousTaken)
      setMealId(previousMealId)
      onTakenChange(item.id, previousTaken)
      onError("Não foi possível atualizar o suplemento.")
    } finally {
      setIsSaving(false)
    }
  }

  const theme = SUPPLEMENT_THEME_STYLES[item.cor_tema]

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        "group relative flex min-h-[9.5rem] flex-col rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-4 text-left backdrop-blur-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40",
        theme.topBorder,
        theme.surface,
        theme.atmosphere,
        isTaken && "opacity-60"
      )}
    >
      <span
        className={cn(
          "absolute right-3 top-3 flex size-8 items-center justify-center rounded-full border-2 transition-all",
          isTaken ? theme.ringFilled : theme.ring
        )}
        aria-hidden
      >
        {isSaving ? (
          <Loader2 className="size-3.5 animate-spin text-slate-400" />
        ) : isTaken ? (
          <Check className={cn("size-4", theme.ringIcon)} strokeWidth={3} />
        ) : null}
      </span>

      <div className="pr-10">
        <p
          className={cn(
            "text-lg font-bold leading-tight text-white",
            isTaken && "text-slate-300"
          )}
        >
          {item.nome}
        </p>
        <p className="mt-1 text-xs text-zinc-400">{item.marca}</p>
      </div>

      <div className="mt-auto pt-4">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            theme.doseBadge
          )}
        >
          {item.dose}
        </span>
      </div>
    </button>
  )
}

export function SupplementGrid({
  initialItems,
}: {
  initialItems: SupplementGridItem[]
}) {
  const [error, setError] = React.useState<string | null>(null)
  const [takenById, setTakenById] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialItems.map((item) => [item.id, item.isTaken]))
  )

  React.useEffect(() => {
    setTakenById(
      Object.fromEntries(initialItems.map((item) => [item.id, item.isTaken]))
    )
  }, [initialItems])

  const takenCount = initialItems.filter(
    (item) => takenById[item.id] ?? item.isTaken
  ).length

  function handleTakenChange(id: string, isTaken: boolean) {
    setTakenById((current) => ({ ...current, [id]: isTaken }))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-500">
        {takenCount} de {initialItems.length} tomados hoje
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {initialItems.map((item) => (
          <SupplementCard
            key={item.id}
            item={item}
            onError={setError}
            onTakenChange={handleTakenChange}
          />
        ))}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
