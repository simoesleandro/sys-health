export type NeonAccent =
  | "cyan"
  | "blue"
  | "magenta"
  | "purple"
  | "green"
  | "orange"

export const NEON_ACCENTS: Record<
  NeonAccent,
  {
    border: string
    text: string
    progress: string
    atmosphere: string
    /** Gradiente interno: accent no topo → escuro embaixo */
    surface: string
    chart: string
  }
> = {
  cyan: {
    border: "border border-cyan-500/45",
    text: "text-brand-cyan",
    progress: "bg-brand-cyan",
    atmosphere:
      "shadow-[0_0_15px_rgba(0,212,255,0.12),0_0_30px_rgba(0,212,255,0.06)]",
    surface: "bg-gradient-to-b from-cyan-950/40 to-zinc-950/80",
    chart: "#00d4ff",
  },
  blue: {
    border: "border border-blue-500/45",
    text: "text-brand-blue",
    progress: "bg-brand-blue",
    atmosphere:
      "shadow-[0_0_15px_rgba(59,130,246,0.12),0_0_30px_rgba(59,130,246,0.06)]",
    surface: "bg-gradient-to-b from-blue-950/40 to-zinc-950/80",
    chart: "#3b82f6",
  },
  magenta: {
    border: "border border-fuchsia-500/45",
    text: "text-brand-magenta",
    progress: "bg-brand-magenta",
    atmosphere:
      "shadow-[0_0_15px_rgba(255,45,154,0.12),0_0_30px_rgba(255,45,154,0.06)]",
    surface: "bg-gradient-to-b from-fuchsia-950/40 to-zinc-950/80",
    chart: "#ff2d9a",
  },
  purple: {
    border: "border border-purple-500/45",
    text: "text-brand-purple",
    progress: "bg-brand-purple",
    atmosphere:
      "shadow-[0_0_15px_rgba(155,92,255,0.12),0_0_30px_rgba(155,92,255,0.06)]",
    surface: "bg-gradient-to-b from-purple-950/40 to-zinc-950/80",
    chart: "#9b5cff",
  },
  green: {
    border: "border border-emerald-500/45",
    text: "text-brand-green",
    progress: "bg-brand-green",
    atmosphere:
      "shadow-[0_0_15px_rgba(0,230,118,0.12),0_0_30px_rgba(0,230,118,0.06)]",
    surface: "bg-gradient-to-b from-emerald-950/40 to-zinc-950/80",
    chart: "#00e676",
  },
  orange: {
    border: "border border-orange-500/45",
    text: "text-orange-400",
    progress: "bg-orange-400",
    atmosphere:
      "shadow-[0_0_15px_rgba(249,115,22,0.12),0_0_30px_rgba(249,115,22,0.06)]",
    surface: "bg-gradient-to-b from-orange-950/40 to-zinc-950/80",
    chart: "#f97316",
  },
}

export const NEON_CARD_BASE = "rounded-xl backdrop-blur-md"

export function neonCardClasses(
  accent: NeonAccent,
  options?: { glow?: boolean }
) {
  const styles = NEON_ACCENTS[accent]
  const glow = options?.glow ?? true

  return [
    NEON_CARD_BASE,
    styles.surface,
    styles.border,
    glow && styles.atmosphere,
  ]
}
