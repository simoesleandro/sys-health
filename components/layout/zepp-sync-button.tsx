"use client"

import * as React from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

import { useQuickModals } from "@/components/modals/quick-modals-context"
import { Button } from "@/components/ui/button"
import { syncZeppData } from "@/lib/actions/sync"
import { cn } from "@/lib/utils"

type SyncFeedback = {
  type: "success" | "error"
  message: string
}

export function ZeppSyncButton({ className }: { className?: string }) {
  const router = useRouter()
  const { showFeedback } = useQuickModals()
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
      const result = await syncZeppData()

      if (result.success) {
        showFeedback(result.message)
        router.refresh()
      } else {
        setFeedback({ type: "error", message: result.error })
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Não foi possível sincronizar o Zepp.",
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
          "border-brand-cyan/25 bg-brand-cyan/10 text-xs text-brand-cyan backdrop-blur-md",
          "hover:border-cyan-500/35 hover:bg-cyan-950/25 hover:text-brand-cyan",
          "shadow-[0_0_10px_rgba(0,212,255,0.08)] disabled:opacity-60",
          className
        )}
      >
        {isSyncing ? (
          <>
            <Loader2 className="size-3 animate-spin text-brand-cyan" />
            Sincronizando...
          </>
        ) : (
          <>
            <RefreshCw className="size-3" />
            Sincronizar
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
              ? "border-green-500/30 bg-zinc-950/90 text-green-300 shadow-[0_0_14px_rgba(34,197,94,0.18)]"
              : "border-red-500/30 bg-zinc-950/90 text-red-300 shadow-[0_0_14px_rgba(239,68,68,0.15)]"
          )}
        >
          {feedback.message}
        </div>
      ) : null}
    </>
  )
}
