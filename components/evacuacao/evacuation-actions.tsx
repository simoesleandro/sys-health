"use client"

import * as React from "react"
import { ClipboardList, Plus } from "lucide-react"

import { EvacuationHistoryModal } from "@/components/evacuacao/evacuation-history-modal"
import { EvacuationRegisterModal } from "@/components/evacuacao/evacuation-register-modal"
import { Button } from "@/components/ui/button"
import type { EvacuationRecord } from "@/lib/evacuation"

export function EvacuationActions({
  history,
}: {
  history: EvacuationRecord[]
}) {
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(false)

  return (
    <>
      <section
        aria-label="Ações de registro intestinal"
        className="flex flex-col gap-3 sm:flex-row"
      >
        <Button
          type="button"
          size="lg"
          className="flex-1 bg-brand-green font-semibold text-black hover:bg-brand-green/90"
          onClick={() => setRegisterOpen(true)}
        >
          <Plus className="size-5" />
          Registrar
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="flex-1 border-zinc-700 bg-zinc-950/50 font-semibold text-white hover:bg-zinc-900"
          onClick={() => setHistoryOpen(true)}
        >
          <ClipboardList className="size-5" />
          Histórico de evacuações
        </Button>
      </section>

      <EvacuationRegisterModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
      />
      <EvacuationHistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        records={history}
      />
    </>
  )
}
