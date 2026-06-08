import type { SupplementTheme } from "@/lib/supplements"

export type SupplementThemeStyle = {
  topBorder: string
  surface: string
  atmosphere: string
  ring: string
  ringFilled: string
  ringIcon: string
  doseBadge: string
}

export const SUPPLEMENT_THEME_STYLES: Record<SupplementTheme, SupplementThemeStyle> =
  {
    green: {
      topBorder: "border-t-emerald-500/50",
      surface: "bg-gradient-to-b from-emerald-950/20 to-transparent",
      atmosphere:
        "shadow-[0_0_15px_rgba(16,185,129,0.1),0_0_30px_rgba(16,185,129,0.05)]",
      ring: "border-emerald-500/40",
      ringFilled: "border-emerald-400 bg-emerald-500/25",
      ringIcon: "text-emerald-300",
      doseBadge:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    },
    cyan: {
      topBorder: "border-t-cyan-500/50",
      surface: "bg-gradient-to-b from-cyan-950/20 to-transparent",
      atmosphere:
        "shadow-[0_0_15px_rgba(0,212,255,0.1),0_0_30px_rgba(0,212,255,0.05)]",
      ring: "border-cyan-500/40",
      ringFilled: "border-cyan-400 bg-cyan-500/25",
      ringIcon: "text-cyan-300",
      doseBadge: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
    },
    yellow: {
      topBorder: "border-t-yellow-500/50",
      surface: "bg-gradient-to-b from-yellow-950/20 to-transparent",
      atmosphere:
        "shadow-[0_0_15px_rgba(234,179,8,0.1),0_0_30px_rgba(234,179,8,0.05)]",
      ring: "border-yellow-500/40",
      ringFilled: "border-yellow-400 bg-yellow-500/25",
      ringIcon: "text-yellow-300",
      doseBadge: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
    },
    magenta: {
      topBorder: "border-t-fuchsia-500/50",
      surface: "bg-gradient-to-b from-fuchsia-950/20 to-transparent",
      atmosphere:
        "shadow-[0_0_15px_rgba(255,45,154,0.1),0_0_30px_rgba(255,45,154,0.05)]",
      ring: "border-fuchsia-500/40",
      ringFilled: "border-fuchsia-400 bg-fuchsia-500/25",
      ringIcon: "text-fuchsia-300",
      doseBadge: "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-400",
    },
    purple: {
      topBorder: "border-t-purple-500/50",
      surface: "bg-gradient-to-b from-purple-950/20 to-transparent",
      atmosphere:
        "shadow-[0_0_15px_rgba(155,92,255,0.1),0_0_30px_rgba(155,92,255,0.05)]",
      ring: "border-purple-500/40",
      ringFilled: "border-purple-400 bg-purple-500/25",
      ringIcon: "text-purple-300",
      doseBadge: "border-purple-500/20 bg-purple-500/10 text-purple-400",
    },
    orange: {
      topBorder: "border-t-orange-500/50",
      surface: "bg-gradient-to-b from-orange-950/20 to-transparent",
      atmosphere:
        "shadow-[0_0_15px_rgba(249,115,22,0.1),0_0_30px_rgba(249,115,22,0.05)]",
      ring: "border-orange-500/40",
      ringFilled: "border-orange-400 bg-orange-500/25",
      ringIcon: "text-orange-300",
      doseBadge: "border-orange-500/20 bg-orange-500/10 text-orange-400",
    },
  }
