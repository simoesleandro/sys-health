"use client"

import { useQuickModals } from "@/components/modals/quick-modals-context"

import { BiometryModal } from "./biometry-modal"

export function BiometryModalGate() {
  const { biometryOpen, todayMeasurementForm } = useQuickModals()

  if (!biometryOpen) return null

  return <BiometryModal initialForm={todayMeasurementForm} />
}
