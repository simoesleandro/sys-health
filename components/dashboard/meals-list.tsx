import { DeleteMealButton } from "@/components/dashboard/delete-meal-button"
import { MealMacroBadges } from "@/components/dashboard/meal-macro-badges"
import { NeonCard } from "@/components/ui/neon-card"
import {
  formatComponentQuantity,
  formatMealTimeBrt,
  getTodayMeals,
} from "@/lib/data"

function MealCard({
  mealId,
  hora,
  categoria,
  componentes,
  calorias,
  proteinas,
  carboidratos,
  gorduras,
}: {
  mealId: number
  hora: string
  categoria: string
  componentes: { nome: string; gramas?: number; qtd?: number; unidade?: string }[]
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
}) {
  return (
    <NeonCard accent="cyan" className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-800/60 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
          <span className="font-mono text-sm font-bold text-brand-cyan">
            {hora}
          </span>
          <span className="text-base font-extrabold tracking-tight text-white">
            {categoria}
          </span>
        </div>
        <DeleteMealButton mealId={mealId} categoria={categoria} />
      </div>

      <div className="px-4 py-3">
        <ul className="flex flex-col gap-2">
          {componentes.map((item, index) => {
            const quantidade = formatComponentQuantity(item)
            return (
              <li
                key={`${item.nome}-${index}`}
                className="flex items-baseline gap-2 text-sm text-slate-300"
              >
                {quantidade && (
                  <span className="shrink-0 font-mono text-xs text-slate-500">
                    {quantidade}
                  </span>
                )}
                <span>{item.nome}</span>
              </li>
            )
          })}
        </ul>
      </div>

      <MealMacroBadges
        calorias={calorias}
        proteinas={proteinas}
        carboidratos={carboidratos}
        gorduras={gorduras}
      />
    </NeonCard>
  )
}

export async function MealsList() {
  const meals = await getTodayMeals()

  if (meals.length === 0) {
    return (
      <NeonCard accent="cyan" className="px-5 py-6">
        <p className="neon-section-title">Nenhuma refeição registrada hoje</p>
        <p className="neon-section-subtitle mt-2">
          Use a ação rápida &quot;Nova refeição&quot; na sidebar para registrar
          a primeira refeição do dia.
        </p>
      </NeonCard>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {meals.map((meal) => (
        <MealCard
          key={meal.id}
          mealId={meal.id}
          hora={formatMealTimeBrt(meal.dataHora)}
          categoria={meal.categoria}
          componentes={meal.componentes}
          calorias={meal.calorias}
          proteinas={meal.proteinas}
          carboidratos={meal.carboidratos}
          gorduras={meal.gorduras}
        />
      ))}
    </div>
  )
}
