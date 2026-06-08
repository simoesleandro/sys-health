import { cn } from "@/lib/utils"

export function SectionHeader({
  title,
  subtitle,
  className,
}: {
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <header className={cn("flex flex-col gap-1", className)}>
      <h2 className="neon-section-title">{title}</h2>
      {subtitle ? <p className="neon-section-subtitle">{subtitle}</p> : null}
    </header>
  )
}
