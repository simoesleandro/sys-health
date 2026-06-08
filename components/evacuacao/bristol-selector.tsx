"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { registerEvacuation } from "@/lib/actions/evacuation"
import { bristolNeonCardClasses } from "@/lib/bristol-theme"
import { BRISTOL_TYPES, type BristolType } from "@/lib/evacuation"
import { cn } from "@/lib/utils"

export function BristolSelector() {
  const router = useRouter()
  const [pendingType, setPendingType] = React.useState<BristolType | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  function handleSelect(tipo: BristolType) {
    setError(null)
    setPendingType(tipo)

    startTransition(async () => {
      const result = await registerEvacuation(tipo)

      if (!result.success) {
        setError(result.error)
        setPendingType(null)
        return
      }

      setPendingType(null)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {BRISTOL_TYPES.map((item) => {
          const isLoading = isPending && pendingType === item.tipo

          return (
            <button
              key={item.tipo}
              type="button"
              disabled={isPending}
              onClick={() => handleSelect(item.tipo)}
              className={cn(
                "text-left transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40",
                isPending && pendingType !== item.tipo && "opacity-60"
              )}
            >
              <div
                className={cn(
                  bristolNeonCardClasses(item.tipo),
                  "h-full cursor-pointer p-4"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-white">{item.titulo}</p>
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin text-brand-cyan" />
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {item.descricao}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
