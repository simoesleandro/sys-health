"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings, Star } from "lucide-react"

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
import { SignOutButton } from "@/components/auth/sign-out-button"
import { Button } from "@/components/ui/button"
import { useQuickModals } from "@/components/modals/quick-modals-context"
import { cn } from "@/lib/utils"
import {
  NAV_ACCENT_CLASSES,
  bancoNavItem,
  mainNavItems,
  quickActions,
  settingsNavItem,
} from "@/lib/navigation"

function isNavActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar({
  kpiSlot,
  amazfitSlot,
  userEmail,
  userInitials,
}: {
  kpiSlot: React.ReactNode
  amazfitSlot: React.ReactNode
  userEmail: string
  userInitials: string
}) {
  const pathname = usePathname()
  const {
    openMealModal,
    openWaterModal,
    openSupplementModal,
    openEditMealsFlow,
  } = useQuickModals()
  const bancoActive = isNavActive(pathname, bancoNavItem.href)
  const settingsActive = isNavActive(pathname, settingsNavItem.href)
  const BancoIcon = bancoNavItem.icon
  const SettingsIcon = settingsNavItem.icon
  const bancoAccent = NAV_ACCENT_CLASSES[bancoNavItem.accent]
  const settingsAccent = NAV_ACCENT_CLASSES[settingsNavItem.accent]

  function handleQuickAction(dialog: string) {
    if (dialog === "refeicao") {
      openMealModal()
      return
    }
    if (dialog === "editar") {
      openEditMealsFlow()
      return
    }
    if (dialog === "agua") openWaterModal()
    if (dialog === "suplemento") openSupplementModal()
    if (dialog === "banco") window.location.href = bancoNavItem.href
  }

  return (
    <Sidebar
      collapsible="none"
      variant="sidebar"
      className="hidden overflow-x-hidden border-zinc-800/60 md:flex [&_[data-sidebar=sidebar]]:overflow-x-hidden"
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

      <SidebarContent className="no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-1">
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
                      tooltip={item.title}
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

        <SidebarSeparator className="bg-zinc-800/60" />

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="neon-kicker px-3">
            Resumo do dia
          </SidebarGroupLabel>
          <SidebarGroupContent>{kpiSlot}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto flex w-full min-w-0 shrink-0 flex-col gap-3 overflow-x-hidden border-t border-zinc-800/60 px-3 pt-3 pb-4">
        <div className="min-w-0 overflow-hidden">{amazfitSlot}</div>

        <div
          className={cn(
            "flex min-w-0 flex-col gap-3 overflow-hidden p-3",
            "rounded-xl backdrop-blur-md",
            "bg-gradient-to-b from-cyan-950/40 to-zinc-950/80",
            "border border-cyan-500/45",
            "shadow-[inset_0_1px_0_rgba(0,212,255,0.08)]"
          )}
        >
          <div className="flex items-center gap-3">
            <Avatar className="size-10 shrink-0 border border-zinc-800/60">
              <AvatarFallback className="bg-black text-xs font-bold text-brand-cyan">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{userEmail}</p>
              <p className="truncate text-[10px] text-slate-500">
                HealthOS Dashboard
              </p>
            </div>
            <SignOutButton
              compact
              className="h-8 w-8 shrink-0 px-0 text-slate-400 hover:text-white"
            />
          </div>

          <Link
            href={settingsNavItem.href}
            aria-current={settingsActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors",
              settingsActive
                ? cn("border-zinc-800/60 bg-zinc-900/70", settingsAccent.text)
                : "border-zinc-800/60 text-slate-400 hover:bg-zinc-900/50 hover:text-white"
            )}
          >
            <SettingsIcon className={cn("size-4 shrink-0", settingsAccent.text)} />
            <span className="truncate">{settingsNavItem.title}</span>
          </Link>

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
