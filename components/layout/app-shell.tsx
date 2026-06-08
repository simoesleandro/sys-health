"use client"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { BiometryModalGate } from "@/components/modals/biometry-modal-gate"
import { MealModal } from "@/components/modals/meal-modal"
import { QuickModalsProvider } from "@/components/modals/quick-modals-context"
import { SupplementModal } from "@/components/modals/supplement-modal"
import { WaterModal } from "@/components/modals/water-modal"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { MeasurementInput } from "@/lib/biometry"

export function AppShell({
  children,
  kpiSlot,
  amazfitSlot,
  todayMeasurementForm,
}: {
  children: React.ReactNode
  kpiSlot: React.ReactNode
  amazfitSlot: React.ReactNode
  todayMeasurementForm: MeasurementInput
}) {
  return (
    <QuickModalsProvider todayMeasurementForm={todayMeasurementForm}>
      <SidebarProvider defaultOpen>
        <div className="hidden md:block">
          <AppSidebar kpiSlot={kpiSlot} amazfitSlot={amazfitSlot} />
        </div>
        <SidebarInset className="neon-site-bg">
          <div className="flex min-h-svh flex-col neon-site-bg">
            <div className="flex-1 overflow-auto">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <MealModal />
      <WaterModal />
      <SupplementModal />
      <BiometryModalGate />
    </QuickModalsProvider>
  )
}
