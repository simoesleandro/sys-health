import { NUTRITION_GOALS } from "@/lib/goals"
import { NEON_ACCENTS } from "@/lib/neon-theme"
import { cn } from "@/lib/utils"

type MacroBarProps = {
  label: string
  value: number
  goal: number
  unit: string
  accent: "cyan" | "blue" | "magenta"
}

function MacroBar({ label, value, goal, unit, accent }: MacroBarProps) {
  const styles = NEON_ACCENTS[accent]
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-end justify-between gap-3">
        <p className={cn("text-xs font-bold tracking-wide uppercase", styles.text)}>
          {label}
        </p>
        <p className="text-sm font-bold text-white">
          {Math.round(value)}
          {unit}
          <span className="ml-1 font-medium text-slate-400">
            / {goal}
            {unit}
          </span>
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-black/60">
        <div
          className={cn("h-full rounded-full", styles.progress)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-500">{pct}% da meta</p>
    </div>
  )
}

export function MacroBars({
  proteinas,
  carboidratos,
  gorduras,
}: {
  proteinas: number
  carboidratos: number
  gorduras: number
}) {
  return (
    <div className="flex flex-col gap-5">
      <MacroBar
        label="Proteínas"
        value={proteinas}
        goal={NUTRITION_GOALS.PROTEIN_G}
        unit="g"
        accent="cyan"
      />
      <MacroBar
        label="Carboidratos"
        value={carboidratos}
        goal={NUTRITION_GOALS.CARBS_G}
        unit="g"
        accent="blue"
      />
      <MacroBar
        label="Gorduras"
        value={gorduras}
        goal={NUTRITION_GOALS.FATS_G}
        unit="g"
        accent="magenta"
      />
    </div>
  )
}
