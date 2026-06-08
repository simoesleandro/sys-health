import { neonCardClasses, NEON_ACCENTS, type NeonAccent } from "@/lib/neon-theme"
import { cn } from "@/lib/utils"

export function BrandMetricCard({
  label,
  value,
  meta,
  accent,
  progress,
  className,
}: {
  label: string
  value: string
  meta?: string
  accent: NeonAccent
  progress?: number
  className?: string
}) {
  const styles = NEON_ACCENTS[accent]
  const pct =
    progress != null ? Math.min(100, Math.max(0, Math.round(progress))) : null

  return (
    <div
      className={cn(
        neonCardClasses(accent),
        "flex flex-col px-4 py-4",
        className
      )}
    >
      <p className="neon-label">{label}</p>
      <p className="neon-metric mt-2">{value}</p>
      {meta ? (
        <p className="mt-1.5 text-xs font-medium text-slate-500">{meta}</p>
      ) : null}
      {pct != null ? (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/60">
          <div
            className={cn("h-full rounded-full", styles.progress)}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}
