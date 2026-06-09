import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  className,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md rounded-2xl border border-zinc-800/70 bg-zinc-950/80 p-8 shadow-2xl backdrop-blur",
        className
      )}
    >
      <div className="mb-8 text-center">
        <p className="text-xs font-bold tracking-[0.35em] text-brand-cyan uppercase">
          SYS.HEALTH
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {children}
      {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
    </div>
  )
}
