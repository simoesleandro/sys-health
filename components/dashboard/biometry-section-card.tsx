"use client"

import { Ruler } from "lucide-react"

import { SectionHeader } from "@/components/layout/section-header"
import { useQuickModals } from "@/components/modals/quick-modals-context"
import { Button } from "@/components/ui/button"
import { NeonCard } from "@/components/ui/neon-card"
import { formatWeightKg, type LatestMeasurementSummary } from "@/lib/biometry"

export function BiometrySectionCard({
  latest,
  showHeader = true,
}: {
  latest: LatestMeasurementSummary
  showHeader?: boolean
}) {
  const { openBiometryModal } = useQuickModals()

  return (
    <section className="flex flex-col gap-4">
      {showHeader ? (
        <SectionHeader
          title="Biometria"
          subtitle="Peso e perímetros corporais"
        />
      ) : null}

      <NeonCard accent="blue" className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800/60 bg-black/40 text-brand-blue">
            <Ruler className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="neon-label">Última medição</p>
            <p className="text-2xl font-bold text-brand-blue">
              {formatWeightKg(latest.peso)}
            </p>
            <p className="text-xs text-brand-cyan">
              {latest.dataLabel ?? "Sem data"}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="shrink-0 border-zinc-800/60 bg-black/40 text-brand-blue hover:bg-zinc-900/60"
          onClick={() => openBiometryModal()}
        >
          Registrar Medidas
        </Button>
      </NeonCard>
    </section>
  )
}
