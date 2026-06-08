"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Star } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useQuickModals } from "@/components/modals/quick-modals-context"
import { cn } from "@/lib/utils"
import {
  NAV_ACCENT_CLASSES,
  bancoNavItem,
  mainNavItems,
  quickActions,
} from "@/lib/navigation"

function isNavActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar({
  kpiSlot,
  amazfitSlot,
}: {
  kpiSlot: React.ReactNode
  amazfitSlot: React.ReactNode
}) {
  const pathname = usePathname()
  const { openMealModal, openWaterModal, openSupplementModal } =
    useQuickModals()
  const bancoActive = isNavActive(pathname, bancoNavItem.href)
  const BancoIcon = bancoNavItem.icon
  const bancoAccent = NAV_ACCENT_CLASSES[bancoNavItem.accent]

  function handleQuickAction(dialog: string) {
    if (dialog === "refeicao") openMealModal()
    if (dialog === "agua") openWaterModal()
    if (dialog === "suplemento") openSupplementModal()
    if (dialog === "banco") window.location.href = bancoNavItem.href
  }

  return (
    <Sidebar
      collapsible="offcanvas"
      variant="sidebar"
      className="border-zinc-800/60"
    >
      <SidebarHeader className="border-b border-zinc-800/60 px-4 py-5">
        <Link href="/" className="flex items-baseline gap-0.5">
          <span className="text-lg font-extrabold tracking-[0.2em] text-brand-cyan uppercase">
            SYS
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            .HEALTH
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="min-h-0 flex-1 overflow-y-auto px-1">
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="neon-kicker px-3">
            Resumo do dia
          </SidebarGroupLabel>
          <SidebarGroupContent>{kpiSlot}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-zinc-800/60" />

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="neon-label px-3">Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const Icon = item.icon
                const accent = NAV_ACCENT_CLASSES[item.accent]
                const active = isNavActive(pathname, item.href)

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        "text-slate-400 hover:bg-zinc-900/60 hover:text-white",
                        active && "bg-zinc-900/70 text-white"
                      )}
                    >
                      <Link href={item.href}>
                        {item.emoji ? (
                          <span aria-hidden className="text-sm">
                            {item.emoji}
                          </span>
                        ) : (
                          <Icon className={cn("size-4", accent.text)} />
                        )}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-zinc-800/60" />

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="neon-label px-3">
            Ações rápidas
          </SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-0.5 px-2">
            {quickActions.map((action) => (
              <Button
                key={action.dialog}
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start gap-2 text-slate-400 hover:bg-zinc-900/60 hover:text-white"
                onClick={() => handleQuickAction(action.dialog)}
              >
                <span aria-hidden>{action.icon}</span>
                {action.title}
              </Button>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto flex shrink-0 flex-col gap-4 border-t border-zinc-800/60 px-4 pt-4 pb-5">
        {amazfitSlot}

        <div
          className={cn(
            "flex flex-col gap-3 p-3",
            "rounded-xl backdrop-blur-md",
            "bg-gradient-to-b from-cyan-950/40 to-zinc-950/80",
            "border border-cyan-500/45",
            "shadow-[0_0_15px_rgba(0,212,255,0.12),0_0_30px_rgba(0,212,255,0.06)]"
          )}
        >
          <div className="flex items-center gap-3">
            <Avatar className="size-10 shrink-0 border border-zinc-800/60">
              <AvatarFallback className="bg-black text-xs font-bold text-brand-cyan">
                LR
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">Leandro R.</p>
              <p className="truncate text-[10px] text-slate-500">
                HealthOS Dashboard
              </p>
            </div>
          </div>

          <Link
            href={bancoNavItem.href}
            aria-current={bancoActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors",
              bancoActive
                ? cn("border-zinc-800/60 bg-zinc-900/70", bancoAccent.text)
                : "border-zinc-800/60 text-slate-400 hover:bg-zinc-900/50 hover:text-white"
            )}
          >
            <BancoIcon className={cn("size-4 shrink-0", bancoAccent.text)} />
            <span className="truncate">{bancoNavItem.title}</span>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center gap-2 border-zinc-800/60 bg-black/40 text-xs font-bold tracking-wide text-brand-cyan uppercase hover:bg-zinc-900/60"
            onClick={() => {
              window.open("/manifest.webmanifest", "_blank")
            }}
          >
            <Star className="size-3.5 fill-brand-cyan text-brand-cyan" />
            Manage app
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
