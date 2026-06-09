import { Suspense } from "react"

import { MobileQuickBar } from "@/components/dashboard/mobile-quick-bar"
import { AppShell } from "@/components/layout/app-shell"
import { SidebarAmazfitPanel } from "@/components/layout/sidebar-amazfit-panel"
import { SidebarAmazfitSkeleton } from "@/components/layout/sidebar-amazfit-skeleton"
import { SidebarKpis } from "@/components/layout/sidebar-kpis"
import { SidebarKpisSkeleton } from "@/components/layout/sidebar-kpis-skeleton"
import { EMPTY_MEASUREMENT_INPUT } from "@/lib/biometry"
import { getTodayMeasurement, measurementToInput } from "@/lib/data"
import { getOptionalUser } from "@/lib/supabase/auth"
import {
  getUserNutritionGoals,
  getUserSupplementPresets,
} from "@/lib/user-settings"

export const revalidate = 60

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [todayMeasurement, { user }, nutritionGoals, supplementPresets] =
    await Promise.all([
      getTodayMeasurement(),
      getOptionalUser(),
      getUserNutritionGoals(),
      getUserSupplementPresets(),
    ])
  const todayMeasurementForm = todayMeasurement
    ? measurementToInput(todayMeasurement)
    : EMPTY_MEASUREMENT_INPUT
  const userEmail = user?.email ?? "Utilizador"
  const userInitials =
    userEmail
      .split("@")[0]
      ?.slice(0, 2)
      .toUpperCase() || "SH"

  return (
    <AppShell
      userEmail={userEmail}
      userInitials={userInitials}
      nutritionGoals={nutritionGoals}
      supplementPresets={supplementPresets}
      todayMeasurementForm={todayMeasurementForm}
      kpiSlot={
        <Suspense fallback={<SidebarKpisSkeleton />}>
          <SidebarKpis />
        </Suspense>
      }
      amazfitSlot={
        <Suspense fallback={<SidebarAmazfitSkeleton />}>
          <SidebarAmazfitPanel />
        </Suspense>
      }
    >
      <div className="pb-20 md:pb-0">{children}</div>
      <MobileQuickBar />
    </AppShell>
  )
}
