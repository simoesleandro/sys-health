"use client"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { BiometryModalGate } from "@/components/modals/biometry-modal-gate"
import { EditMealModal } from "@/components/modals/edit-meal-modal"
import { EditMealsPickerModal } from "@/components/modals/edit-meals-picker-modal"
import { MealModal } from "@/components/modals/meal-modal"
import { QuickModalsProvider } from "@/components/modals/quick-modals-context"
import { SupplementModal } from "@/components/modals/supplement-modal"
import { WaterModal } from "@/components/modals/water-modal"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import type { MeasurementInput } from "@/lib/biometry"
import type { NutritionGoals } from "@/lib/goals"
import type { SupplementPreset } from "@/lib/supplements"

export function AppShell({
  children,
  kpiSlot,
  amazfitSlot,
  todayMeasurementForm,
  nutritionGoals,
  supplementPresets,
  userEmail,
  userInitials,
}: {
  children: React.ReactNode
  kpiSlot: React.ReactNode
  amazfitSlot: React.ReactNode
  todayMeasurementForm: MeasurementInput
  nutritionGoals: NutritionGoals
  supplementPresets: SupplementPreset[]
  userEmail: string
  userInitials: string
}) {
  return (
    <QuickModalsProvider
      todayMeasurementForm={todayMeasurementForm}
      nutritionGoals={nutritionGoals}
      supplementPresets={supplementPresets}
    >
      <SidebarProvider defaultOpen>
        <AppSidebar
          kpiSlot={kpiSlot}
          amazfitSlot={amazfitSlot}
          userEmail={userEmail}
          userInitials={userInitials}
        />
        <SidebarInset className="neon-site-bg">
          <div className="flex min-h-svh flex-col neon-site-bg">
            <div className="sticky top-0 z-20 hidden shrink-0 items-center gap-2 border-b border-zinc-800/60 bg-zinc-950/80 px-4 py-2 backdrop-blur-md md:flex">
              <SidebarTrigger className="text-slate-400 hover:text-white" />
              <span className="text-xs text-slate-500">
                Menu · Ctrl+B
              </span>
            </div>
            <div className="flex-1 overflow-auto">{children}</div>
          </div>
        </SidebarInset>
        <MealModal />
        <EditMealsPickerModal />
        <EditMealModal />
        <WaterModal />
        <SupplementModal />
        <BiometryModalGate />
      </SidebarProvider>
    </QuickModalsProvider>
  )
}
