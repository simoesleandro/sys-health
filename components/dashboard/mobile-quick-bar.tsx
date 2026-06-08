"use client"

import { Droplets, Pill, Plus } from "lucide-react"

import { useQuickModals } from "@/components/modals/quick-modals-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const quickItems = [
  {
    id: "refeicao",
    label: "Refeição",
    icon: Plus,
    action: "openMealModal" as const,
  },
  {
    id: "agua",
    label: "Água",
    icon: Droplets,
    action: "openWaterModal" as const,
  },
  {
    id: "suplemento",
    label: "Suplemento",
    icon: Pill,
    action: "openSupplementModal" as const,
  },
]

export function MobileQuickBar() {
  const { openMealModal, openWaterModal, openSupplementModal } =
    useQuickModals()

  const handlers = {
    openMealModal,
    openWaterModal,
    openSupplementModal,
  }

  return (
    <nav
      aria-label="Ações rápidas"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 block border-t border-border/40",
        "bg-background/90 backdrop-blur-md md:hidden",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-3">
        {quickItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              className="flex h-auto min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium text-foreground hover:bg-muted/50"
              onClick={() => handlers[item.action]()}
            >
              <Icon className="size-5 shrink-0 text-cyan" />
              <span>{item.label}</span>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
