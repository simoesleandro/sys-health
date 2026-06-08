"use client"

import * as React from "react"

import type { MeasurementInput } from "@/lib/biometry"

type QuickModalsContextValue = {
  mealOpen: boolean
  setMealOpen: (open: boolean) => void
  openMealModal: () => void
  waterOpen: boolean
  setWaterOpen: (open: boolean) => void
  openWaterModal: () => void
  supplementOpen: boolean
  setSupplementOpen: (open: boolean) => void
  openSupplementModal: () => void
  biometryOpen: boolean
  setBiometryOpen: (open: boolean) => void
  openBiometryModal: () => void
  todayMeasurementForm: MeasurementInput
}

const QuickModalsContext = React.createContext<QuickModalsContextValue | null>(
  null
)

export function QuickModalsProvider({
  children,
  todayMeasurementForm,
}: {
  children: React.ReactNode
  todayMeasurementForm: MeasurementInput
}) {
  const [mealOpen, setMealOpen] = React.useState(false)
  const [waterOpen, setWaterOpen] = React.useState(false)
  const [supplementOpen, setSupplementOpen] = React.useState(false)
  const [biometryOpen, setBiometryOpen] = React.useState(false)

  const value = React.useMemo(
    () => ({
      mealOpen,
      setMealOpen,
      openMealModal: () => setMealOpen(true),
      waterOpen,
      setWaterOpen,
      openWaterModal: () => setWaterOpen(true),
      supplementOpen,
      setSupplementOpen,
      openSupplementModal: () => setSupplementOpen(true),
      biometryOpen,
      setBiometryOpen,
      openBiometryModal: () => setBiometryOpen(true),
      todayMeasurementForm,
    }),
    [mealOpen, waterOpen, supplementOpen, biometryOpen, todayMeasurementForm]
  )

  return (
    <QuickModalsContext.Provider value={value}>
      {children}
    </QuickModalsContext.Provider>
  )
}

export function useQuickModals() {
  const context = React.useContext(QuickModalsContext)
  if (!context) {
    throw new Error("useQuickModals deve ser usado dentro de QuickModalsProvider")
  }
  return context
}

/** Compatível com o modal de refeição existente */
export function useMealModal() {
  const { mealOpen, setMealOpen, openMealModal } = useQuickModals()
  return { open: mealOpen, setOpen: setMealOpen, openMealModal }
}
