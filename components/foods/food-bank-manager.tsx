"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"

import { FoodFormModal } from "@/components/foods/food-form-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
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
import { Input } from "@/components/ui/input"
import { NeonCard } from "@/components/ui/neon-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { deleteFood } from "@/lib/actions/foods"
import {
  formatFoodPortion,
  formatMacro,
  type FavoriteFood,
} from "@/lib/foods"

function normalizeSearchTerm(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
}

function isComboFood(food: FavoriteFood) {
  return normalizeSearchTerm(food.categoria) === "combo"
}

type FoodTypeFilter = "all" | "foods" | "combos"

export function FoodBankManager({ foods }: { foods: FavoriteFood[] }) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<FoodTypeFilter>("all")
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingFood, setEditingFood] = React.useState<FavoriteFood | null>(
    null
  )
  const [foodToDelete, setFoodToDelete] = React.useState<FavoriteFood | null>(
    null
  )
  const [deleteError, setDeleteError] = React.useState<string | null>(null)
  const [feedback, setFeedback] = React.useState<string | null>(null)
  const [isDeleting, startDeleteTransition] = React.useTransition()

  React.useEffect(() => {
    if (!feedback) return

    const timer = window.setTimeout(() => setFeedback(null), 3600)
    return () => window.clearTimeout(timer)
  }, [feedback])

  function openCreateModal() {
    setEditingFood(null)
    setModalOpen(true)
  }

  function openEditModal(food: FavoriteFood) {
    setEditingFood(food)
    setModalOpen(true)
  }

  function handleSaved(message: string) {
    setFeedback(message)
    router.refresh()
  }

  const filteredFoods = React.useMemo(() => {
    const term = normalizeSearchTerm(search)

    return foods.filter((food) => {
      const isCombo = isComboFood(food)
      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "combos" && isCombo) ||
        (typeFilter === "foods" && !isCombo)
      const matchesSearch =
        !term || normalizeSearchTerm(food.descricao).includes(term)

      return matchesType && matchesSearch
    })
  }, [foods, search, typeFilter])

  const comboCount = foods.filter(isComboFood).length
  const foodCount = foods.length - comboCount
  const hasSearch = search.trim().length > 0

  function openDeleteDialog(food: FavoriteFood) {
    setFoodToDelete(food)
    setDeleteError(null)
  }

  function handleDelete() {
    if (!foodToDelete) return
    startDeleteTransition(async () => {
      const result = await deleteFood(foodToDelete.id)
      if (!result.success) {
        setDeleteError(result.error)
        return
      }
      setFoodToDelete(null)
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
        {feedback ? (
          <div
            className="flex items-center gap-2 border-b border-brand-cyan/20 bg-brand-cyan/10 px-4 py-3 text-sm text-brand-cyan"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-b border-zinc-800/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar alimento por nome…"
              className="pl-9"
              aria-label="Buscar alimento"
            />
          </div>

          <Tabs
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as FoodTypeFilter)}
            className="w-full sm:w-auto"
          >
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="all" className="flex-1 sm:flex-none">
                Todos
                <span className="text-xs text-muted-foreground">
                  {foods.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="foods" className="flex-1 sm:flex-none">
                Alimentos
                <span className="text-xs text-muted-foreground">
                  {foodCount}
                </span>
              </TabsTrigger>
              <TabsTrigger value="combos" className="flex-1 sm:flex-none">
                Combos
                <span className="text-xs text-muted-foreground">
                  {comboCount}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {deleteError ? (
          <p
            className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive"
            role="alert"
          >
            {deleteError}
          </p>
        ) : null}

        {foods.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum alimento cadastrado. Clique em &quot;Adicionar Alimento&quot;
            para começar.
          </p>
        ) : filteredFoods.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {hasSearch
              ? `Nenhum item encontrado para "${search.trim()}".`
              : "Nenhum item encontrado nesse filtro."}
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
              {filteredFoods.map((food) => (
                <TableRow key={food.id}>
                  <TableCell className="max-w-[200px] truncate font-medium">
                    <span className="inline-flex max-w-full items-center gap-2">
                      <span className="truncate">{food.descricao}</span>
                      {isComboFood(food) ? (
                        <Badge
                          variant="outline"
                          className="border-brand-cyan/30 text-brand-cyan"
                        >
                          Combo
                        </Badge>
                      ) : null}
                    </span>
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
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => openEditModal(food)}
                        aria-label={`Editar ${food.descricao}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => openDeleteDialog(food)}
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
                            onClick={() => openDeleteDialog(food)}
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

      <AlertDialog
        open={foodToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setFoodToDelete(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar alimento?</AlertDialogTitle>
            <AlertDialogDescription>
              {foodToDelete
                ? `"${foodToDelete.descricao}" será removido do banco. Esta ação não pode ser desfeita.`
                : "Este alimento será removido do banco."}
            </AlertDialogDescription>
            {deleteError ? (
              <p className="text-sm text-destructive" role="alert">
                {deleteError}
              </p>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault()
                handleDelete()
              }}
            >
              {isDeleting ? "Apagando…" : "Apagar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
