"use client"

import * as React from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { refreshCalendarAgenda } from "@/lib/actions/calendar"
import { cn } from "@/lib/utils"

export function CalendarRefreshButton({ className }: { className?: string }) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  async function handleRefresh() {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      await refreshCalendarAgenda()
      router.refresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      disabled={isRefreshing}
      onClick={handleRefresh}
      className={cn(
        "border-zinc-800/60 bg-zinc-950/50 text-xs text-slate-300 backdrop-blur-md",
        "hover:border-brand-magenta/35 hover:bg-fuchsia-950/20 hover:text-brand-magenta",
        className
      )}
    >
      {isRefreshing ? (
        <>
          <Loader2 className="size-3 animate-spin" />
          Atualizando...
        </>
      ) : (
        <>
          <RefreshCw className="size-3" />
          Atualizar
        </>
      )}
    </Button>
  )
}
