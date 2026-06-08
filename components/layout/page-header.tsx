import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  subtitle,
  kicker,
  statusSlot,
  className,
  children,
}: {
  title: string
  subtitle?: string
  kicker?: string
  statusSlot?: React.ReactNode
  className?: string
  children?: React.ReactNode
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="flex flex-col gap-1.5">
        {kicker ? (
          <p className="neon-kicker">{kicker}</p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <h1 className="neon-page-title">{title}</h1>
          {statusSlot ? (
            <div className="flex items-center sm:pt-0.5">{statusSlot}</div>
          ) : null}
        </div>
        {subtitle ? <p className="neon-page-subtitle">{subtitle}</p> : null}
      </div>
      {children}
    </header>
  )
}
