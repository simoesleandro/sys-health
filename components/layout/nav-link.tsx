"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { NAV_ACCENT_CLASSES, type NavItem } from "@/lib/navigation"

type NavLinkProps = {
  item: NavItem
  className?: string
  iconClassName?: string
  showLabel?: boolean
  onNavigate?: () => void
}

export function NavLink({
  item,
  className,
  iconClassName,
  showLabel = true,
  onNavigate,
}: NavLinkProps) {
  const pathname = usePathname()
  const isActive =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(`${item.href}/`)

  const Icon = item.icon
  const accent = NAV_ACCENT_CLASSES[item.accent]

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-zinc-900/70 text-white"
          : "text-slate-400 hover:bg-zinc-900/50 hover:text-white",
        className
      )}
    >
      {item.emoji ? (
        <span aria-hidden className="text-sm">
          {item.emoji}
        </span>
      ) : null}
      <Icon
        className={cn(
          "size-4 shrink-0",
          accent.text,
          iconClassName
        )}
      />
      {showLabel && <span>{item.title}</span>}
    </Link>
  )
}
