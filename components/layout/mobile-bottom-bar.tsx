"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import * as React from "react"

import { useQuickModals } from "@/components/modals/quick-modals-context"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  NAV_ACCENT_CLASSES,
  bancoNavItem,
  mainNavItems,
  mobilePrimaryNav,
  quickActions,
} from "@/lib/navigation"
import { NavLink } from "@/components/layout/nav-link"

export function MobileBottomBar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const {
    openMealModal,
    openEditMealsFlow,
    openWaterModal,
    openSupplementModal,
  } = useQuickModals()

  function handleQuickAction(dialog: string) {
    setMenuOpen(false)
    if (dialog === "refeicao") openMealModal()
    if (dialog === "editar") openEditMealsFlow()
    if (dialog === "agua") openWaterModal()
    if (dialog === "suplemento") openSupplementModal()
    if (dialog === "banco") window.location.href = bancoNavItem.href
  }

  const overflowActive = mainNavItems
    .filter((item) => !item.mobilePrimary)
    .some(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`)
    )

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800/60 bg-zinc-950/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
        {mobilePrimaryNav.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          const accent = NAV_ACCENT_CLASSES[item.accent]

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors",
                isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Icon
                className={cn(
                  "size-5 shrink-0",
                  isActive ? accent.text : "text-slate-500"
                )}
              />
              <span className="truncate">{item.title}</span>
            </Link>
          )
        })}

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex h-auto min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium",
                overflowActive
                  ? "text-brand-cyan"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Menu className="size-5" />
              <span>Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl border-zinc-800/60 bg-black px-4 pb-8"
          >
            <SheetHeader className="text-left">
              <SheetTitle className="text-brand-cyan">
                SYS.HEALTH
              </SheetTitle>
            </SheetHeader>

            <div className="mt-4 flex flex-col gap-1">
              {mainNavItems
                .filter((item) => !item.mobilePrimary)
                .map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              <NavLink item={bancoNavItem} />
            </div>

            <Separator className="my-4 bg-white/10" />

            <p className="mb-2 neon-label">Ações rápidas</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.dialog}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 border-zinc-800/60 bg-zinc-900/40 text-slate-400"
                  onClick={() => handleQuickAction(action.dialog)}
                >
                  <span aria-hidden>{action.icon}</span>
                  {action.title}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
