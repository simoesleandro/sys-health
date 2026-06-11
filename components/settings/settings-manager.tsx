"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { GoalsForm } from "@/components/settings/goals-form"
import { SupplementFormModal } from "@/components/settings/supplement-form-modal"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { NeonCard } from "@/components/ui/neon-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { deleteSupplementProductGroup } from "@/lib/actions/settings"
import type { NutritionGoals } from "@/lib/goals"
import { SUPPLEMENT_THEME_STYLES } from "@/lib/supplement-theme"
import {
  getSupplementDisplayName,
  groupSupplementProducts,
} from "@/lib/supplements"
import type { UserSupplementConfig } from "@/lib/user-settings"
import { cn } from "@/lib/utils"

export function SettingsManager({
  initialGoals,
  initialSupplements,
}: {
  initialGoals: NutritionGoals
  initialSupplements: UserSupplementConfig[]
}) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UserSupplementConfig | null>(null)
  const [isDeleting, startDelete] = useTransition()

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(item: UserSupplementConfig) {
    setEditing(item)
    setModalOpen(true)
  }

  const supplementProducts = groupSupplementProducts(initialSupplements)

  function handleDelete(item: UserSupplementConfig) {
    const displayName = getSupplementDisplayName(item)
    if (
      !confirm(`Apagar "${displayName}"? Registos antigos não são removidos.`)
    ) {
      return
    }

    startDelete(async () => {
      const result = await deleteSupplementProductGroup(item.dbId)
      if (!result.success) {
        alert(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <>
      <PageHeader
        title="Configurações"
        subtitle="Metas nutricionais e suplementos do painel"
        kicker="SYS.HEALTH"
      />

      <NeonCard accent="blue" className="p-5 md:p-6">
        <h2 className="neon-section-title">Metas nutricionais</h2>
        <p className="mt-1 text-sm text-slate-400">
          Usadas nos KPIs, gráficos de macros e contexto do IA Coach.
        </p>
        <div className="mt-5">
          <GoalsForm initialGoals={initialGoals} />
        </div>
      </NeonCard>

      <NeonCard accent="green" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/50 px-4 py-4">
          <div>
            <h2 className="neon-section-title">Suplementos</h2>
            <p className="mt-1 text-sm text-slate-400">
              Grid de hoje, modal rápido e registro em refeições.
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreate}
            className="border-zinc-800/60 bg-black/50 text-brand-green hover:bg-zinc-900/60"
          >
            <Plus className="size-4" />
            Adicionar
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="hidden md:table-cell">Doses</TableHead>
              <TableHead className="hidden md:table-cell">Macros</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplementProducts.map(({ representative, slots }) => {
              const theme = SUPPLEMENT_THEME_STYLES[representative.cor_tema]
              const displayName = getSupplementDisplayName(representative)
              const doseSummary = slots.map((slot) => slot.dose).join(" · ")
              return (
                <TableRow key={`${representative.id}-${representative.dbId}`}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className={cn("font-medium", theme.ringIcon)}>
                        {displayName}
                      </span>
                      <span className="text-xs text-slate-500">
                        {representative.marca}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs text-slate-400 md:table-cell">
                    {doseSummary}
                  </TableCell>
                  <TableCell className="hidden text-xs text-slate-400 md:table-cell">
                    {representative.calorias} kcal · P {representative.proteinas}g
                    {slots.length > 1 ? ` · ${slots.length} doses/dia` : ""}
                  </TableCell>
                  <TableCell>
                    {representative.ativo ? (
                      <span className="text-xs text-brand-green">Sim</span>
                    ) : (
                      <span className="text-xs text-slate-500">Não</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(representative)}
                        aria-label={`Editar ${displayName}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={isDeleting}
                        onClick={() => handleDelete(representative)}
                        aria-label={`Apagar ${displayName}`}
                      >
                        <Trash2 className="size-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {supplementProducts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Nenhum suplemento configurado.
          </p>
        ) : null}
      </NeonCard>

      <SupplementFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        onSaved={() => router.refresh()}
      />
    </>
  )
}
