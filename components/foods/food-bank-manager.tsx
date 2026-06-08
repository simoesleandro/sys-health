"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"

import { FoodFormModal } from "@/components/foods/food-form-modal"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/layout/page-header"
import { NeonCard } from "@/components/ui/neon-card"
import { deleteFood } from "@/lib/actions/foods"
import {
  formatFoodPortion,
  formatMacro,
  type FavoriteFood,
} from "@/lib/foods"

export function FoodBankManager({ foods }: { foods: FavoriteFood[] }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingFood, setEditingFood] = React.useState<FavoriteFood | null>(
    null
  )
  const [isDeleting, startDeleteTransition] = React.useTransition()

  function openCreateModal() {
    setEditingFood(null)
    setModalOpen(true)
  }

  function openEditModal(food: FavoriteFood) {
    setEditingFood(food)
    setModalOpen(true)
  }

  function handleSaved() {
    router.refresh()
  }

  function handleDelete(food: FavoriteFood) {
    if (
      !confirm(`Apagar "${food.descricao}"? Esta ação não pode ser desfeita.`)
    ) {
      return
    }

    startDeleteTransition(async () => {
      const result = await deleteFood(food.id)
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
        title="Banco de Alimentos"
        subtitle="Gerencie alimentos e combos favoritos"
        kicker="SYS.HEALTH"
      >
        <Button
          type="button"
          className="shrink-0 border-zinc-800/60 bg-black/50 text-brand-cyan hover:bg-zinc-900/60"
          onClick={openCreateModal}
        >
          <Plus className="size-4" />
          Adicionar Alimento
        </Button>
      </PageHeader>

      <NeonCard accent="orange" className="overflow-hidden">
        {foods.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum alimento cadastrado. Clique em &quot;Adicionar Alimento&quot;
            para começar.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Porção</TableHead>
                <TableHead className="text-right">Kcal</TableHead>
                <TableHead className="text-right">Proteína</TableHead>
                <TableHead className="text-right">Carbo</TableHead>
                <TableHead className="text-right">Gordura</TableHead>
                <TableHead className="w-[72px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foods.map((food) => (
                <TableRow key={food.id}>
                  <TableCell className="max-w-[200px] truncate font-medium">
                    {food.descricao}
                  </TableCell>
                  <TableCell>
                    {formatFoodPortion(
                      food.qtdReferencia,
                      food.unidadeReferencia
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMacro(food.calorias)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMacro(food.proteinas)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMacro(food.carboidratos)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMacro(food.gorduras)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
                        onClick={() => openEditModal(food)}
                        aria-label={`Editar ${food.descricao}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="hidden text-muted-foreground hover:text-destructive sm:inline-flex"
                        onClick={() => handleDelete(food)}
                        disabled={isDeleting}
                        aria-label={`Apagar ${food.descricao}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="sm:hidden"
                            aria-label={`Ações para ${food.descricao}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(food)}>
                            <Pencil className="size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDelete(food)}
                          >
                            <Trash2 className="size-4" />
                            Apagar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </NeonCard>

      <FoodFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        food={editingFood}
        onSaved={handleSaved}
      />
    </>
  )
}
