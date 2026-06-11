"use client"

import { Check } from "lucide-react"

import { SUPPLEMENT_THEME_STYLES } from "@/lib/supplement-theme"
import {
  getSupplementDisplayName,
  isCategoryGenericGridId,
  type SupplementGridItem,
} from "@/lib/supplements"
import { cn } from "@/lib/utils"

function SupplementCard({ item }: { item: SupplementGridItem }) {
  const theme = SUPPLEMENT_THEME_STYLES[item.cor_tema]
  const isTaken = item.isTaken
  const displayName = getSupplementDisplayName(item)
  const isGenericCategory = isCategoryGenericGridId(item.id)

  return (
    <div
      aria-label={`${displayName}${isTaken ? " — tomado hoje" : ""}`}
      className={cn(
        "relative flex min-h-[9.5rem] flex-col rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-4 backdrop-blur-md transition-all",
        theme.topBorder,
        theme.surface,
        theme.atmosphere,
        isTaken && "opacity-75"
      )}
    >
      <span
        className={cn(
          "absolute right-3 top-3 flex size-8 items-center justify-center rounded-full border-2 transition-all",
          isTaken ? theme.ringFilled : theme.ring
        )}
        aria-hidden
      >
        {isTaken ? (
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
          {displayName}
        </p>
        {isGenericCategory ? (
          <p className="mt-1 text-xs text-zinc-500">
            Registe pelo + Suplementos
          </p>
        ) : item.marca ? (
          <p className="mt-1 text-xs text-zinc-400">{item.marca}</p>
        ) : null}
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
    </div>
  )
}

export function SupplementGrid({
  initialItems,
}: {
  initialItems: SupplementGridItem[]
}) {
  const takenCount = initialItems.filter((item) => item.isTaken).length

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-500">
        {takenCount} de {initialItems.length} tomados hoje
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {initialItems.map((item) => (
          <SupplementCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
