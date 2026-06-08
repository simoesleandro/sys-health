import { neonCardClasses, type NeonAccent } from "@/lib/neon-theme"
import { cn } from "@/lib/utils"

export function NeonCard({
  accent = "cyan",
  className,
  children,
  glow = true,
}: {
  accent?: NeonAccent
  className?: string
  children: React.ReactNode
  glow?: boolean
}) {
  return (
    <div className={cn(neonCardClasses(accent, { glow }), className)}>
      {children}
    </div>
  )
}
