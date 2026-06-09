import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Brain,
  CalendarDays,
  Dumbbell,
  LineChart,
  Ruler,
  Settings,
  Star,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react"

export type NavAccent =
  | "cyan"
  | "blue"
  | "magenta"
  | "purple"
  | "green"
  | "orange"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  accent: NavAccent
  emoji?: string
  /** Exibir na bottom bar mobile (máx. 4 + menu) */
  mobilePrimary?: boolean
}

/** Menu principal — espelha as 9 seções do dashboard Streamlit */
export const mainNavItems: NavItem[] = [
  { title: "Hoje", href: "/", icon: CalendarDays, accent: "cyan", mobilePrimary: true },
  { title: "Evolução", href: "/evolucao", icon: TrendingUp, accent: "blue", mobilePrimary: true },
  { title: "Registros", href: "/registros", icon: UtensilsCrossed, accent: "orange", mobilePrimary: true },
  { title: "Treinos", href: "/treinos", icon: Dumbbell, accent: "green", mobilePrimary: true },
  { title: "Histórico", href: "/historico", icon: LineChart, accent: "purple" },
  { title: "Biometria", href: "/biometria", icon: Ruler, accent: "blue" },
  { title: "Evacuação", href: "/evacuacao", icon: Activity, accent: "green" },
  { title: "IA Coach", href: "/ia-coach", icon: Brain, accent: "cyan" },
]

export const settingsNavItem: NavItem = {
  title: "Configurações",
  href: "/configuracoes",
  icon: Settings,
  accent: "blue",
}

export const bancoNavItem: NavItem = {
  title: "Banco de Alimentos",
  href: "/banco-alimentos",
  icon: Star,
  accent: "orange",
  emoji: "⭐",
}

export const NAV_ACCENT_CLASSES: Record<NavAccent, { text: string }> = {
  cyan: { text: "text-brand-cyan" },
  blue: { text: "text-brand-blue" },
  magenta: { text: "text-brand-magenta" },
  purple: { text: "text-brand-purple" },
  green: { text: "text-brand-green" },
  orange: { text: "text-orange-400" },
}

export type QuickAction = {
  title: string
  icon: string
  dialog: string
}

/** Ações rápidas da sidebar Streamlit (modais — wiring futuro) */
export const quickActions: QuickAction[] = [
  { title: "Nova refeição", icon: "➕", dialog: "refeicao" },
  { title: "Editar refeições", icon: "✏️", dialog: "editar" },
  { title: "Água", icon: "💧", dialog: "agua" },
  { title: "Suplemento", icon: "💊", dialog: "suplemento" },
  { title: "Banco", icon: "⭐", dialog: "banco" },
]

export const mobilePrimaryNav = mainNavItems.filter((item) => item.mobilePrimary)
