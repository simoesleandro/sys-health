import { cn } from "@/lib/utils"

export function PageShell({
  children,
  className,
  dense = false,
}: {
  children: React.ReactNode
  className?: string
  dense?: boolean
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col p-4 md:p-6",
        dense ? "gap-5" : "gap-6 md:gap-8",
        className
      )}
    >
      {children}
    </div>
  )
}
