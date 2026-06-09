"use client"

import * as React from "react"
import { Dumbbell, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { syncHevyData } from "@/lib/actions/sync"
import { cn } from "@/lib/utils"

type SyncFeedback = {
  type: "success" | "error"
  message: string
}

export function HevySyncButton({ className }: { className?: string }) {
  const router = useRouter()
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [feedback, setFeedback] = React.useState<SyncFeedback | null>(null)

  React.useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(null), 4500)
    return () => window.clearTimeout(timer)
  }, [feedback])

  async function handleSync() {
    if (isSyncing) return

    setIsSyncing(true)
    setFeedback(null)

    try {
      const result = await syncHevyData()

      if (result.success) {
        setFeedback({ type: "success", message: result.message })
        router.refresh()
      } else {
        setFeedback({ type: "error", message: result.error })
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Não foi possível sincronizar o Hevy.",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={isSyncing}
        onClick={handleSync}
        className={cn(
          "border-zinc-800/60 bg-zinc-950/50 text-xs text-slate-300 backdrop-blur-md",
          "hover:border-green-500/35 hover:bg-green-950/25 hover:text-brand-green",
          className
        )}
      >
        {isSyncing ? (
          <>
            <Loader2 className="size-3 animate-spin" />
            Hevy...
          </>
        ) : (
          <>
            <Dumbbell className="size-3" />
            Hevy
          </>
        )}
      </Button>

      {feedback ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "fixed bottom-20 right-4 z-50 max-w-sm rounded-lg border px-3 py-2.5 text-xs backdrop-blur-md md:bottom-6",
            feedback.type === "success"
              ? "border-green-500/30 bg-zinc-950/90 text-green-300"
              : "border-red-500/30 bg-zinc-950/90 text-red-300"
          )}
        >
          {feedback.message}
        </div>
      ) : null}
    </>
  )
}
