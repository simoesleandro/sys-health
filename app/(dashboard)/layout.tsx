import { Suspense } from "react"

import { MobileQuickBar } from "@/components/dashboard/mobile-quick-bar"
import { AppShell } from "@/components/layout/app-shell"
import { SidebarAmazfitPanel } from "@/components/layout/sidebar-amazfit-panel"
import { SidebarAmazfitSkeleton } from "@/components/layout/sidebar-amazfit-skeleton"
import { SidebarKpis } from "@/components/layout/sidebar-kpis"
import { SidebarKpisSkeleton } from "@/components/layout/sidebar-kpis-skeleton"
import { EMPTY_MEASUREMENT_INPUT } from "@/lib/biometry"
import { getTodayMeasurement, measurementToInput } from "@/lib/data"

export const revalidate = 60

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const todayMeasurement = await getTodayMeasurement()
  const todayMeasurementForm = todayMeasurement
    ? measurementToInput(todayMeasurement)
    : EMPTY_MEASUREMENT_INPUT

  return (
    <AppShell
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
