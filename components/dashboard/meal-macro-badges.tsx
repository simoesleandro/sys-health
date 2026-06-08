const MACRO_PILLS = [
  {
    label: "P",
    valueKey: "proteinas" as const,
    className:
      "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
  {
    label: "C",
    valueKey: "carboidratos" as const,
    className:
      "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    label: "G",
    valueKey: "gorduras" as const,
    className:
      "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
]

export function MealMacroBadges({
  calorias,
  proteinas,
  carboidratos,
  gorduras,
}: {
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
}) {
  const values = { proteinas, carboidratos, gorduras }

  return (
    <div className="border-t border-zinc-800/60 px-4 pb-3 pt-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-bold text-white">
          {Math.round(calorias)} kcal
        </span>
        {MACRO_PILLS.map((pill) => (
          <span
            key={pill.valueKey}
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${pill.className}`}
          >
            {pill.label} {Math.round(values[pill.valueKey])}g
          </span>
        ))}
      </div>
    </div>
  )
}
