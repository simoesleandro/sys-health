import { NEON_CARD_BASE } from "@/lib/neon-theme"
import type { BristolType } from "@/lib/evacuation"

export type BristolIntensityStyle = {
  border: string
  surface: string
  atmosphere: string
}

/** Tipo 1 (verde) → Tipo 7 (vermelho) — intensidade intestinal */
export const BRISTOL_INTENSITY_STYLES: BristolIntensityStyle[] = [
  {
    border: "border border-emerald-500/45",
    surface: "bg-gradient-to-b from-emerald-950/40 to-zinc-950/80",
    atmosphere:
      "shadow-[0_0_15px_rgba(16,185,129,0.12),0_0_30px_rgba(16,185,129,0.06)]",
  },
  {
    border: "border border-lime-500/45",
    surface: "bg-gradient-to-b from-lime-950/35 to-zinc-950/80",
    atmosphere:
      "shadow-[0_0_15px_rgba(132,204,22,0.12),0_0_30px_rgba(132,204,22,0.06)]",
  },
  {
    border: "border border-yellow-500/45",
    surface: "bg-gradient-to-b from-yellow-950/30 to-zinc-950/80",
    atmosphere:
      "shadow-[0_0_15px_rgba(234,179,8,0.12),0_0_30px_rgba(234,179,8,0.06)]",
  },
  {
    border: "border border-amber-500/45",
    surface: "bg-gradient-to-b from-amber-950/35 to-zinc-950/80",
    atmosphere:
      "shadow-[0_0_15px_rgba(245,158,11,0.12),0_0_30px_rgba(245,158,11,0.06)]",
  },
  {
    border: "border border-orange-500/45",
    surface: "bg-gradient-to-b from-orange-950/35 to-zinc-950/80",
    atmosphere:
      "shadow-[0_0_15px_rgba(249,115,22,0.12),0_0_30px_rgba(249,115,22,0.06)]",
  },
  {
    border: "border border-rose-500/45",
    surface: "bg-gradient-to-b from-rose-950/35 to-zinc-950/80",
    atmosphere:
      "shadow-[0_0_15px_rgba(244,63,94,0.12),0_0_30px_rgba(244,63,94,0.06)]",
  },
  {
    border: "border border-red-500/45",
    surface: "bg-gradient-to-b from-red-950/40 to-zinc-950/80",
    atmosphere:
      "shadow-[0_0_15px_rgba(239,68,68,0.12),0_0_30px_rgba(239,68,68,0.06)]",
  },
]

const NEUTRAL_HISTORY_STYLE: BristolIntensityStyle = {
  border: "border border-zinc-600/40",
  surface: "bg-gradient-to-b from-zinc-900/45 to-zinc-950/80",
  atmosphere:
    "shadow-[0_0_15px_rgba(148,163,184,0.08),0_0_30px_rgba(148,163,184,0.04)]",
}

function intensityCardClasses(style: BristolIntensityStyle) {
  return [NEON_CARD_BASE, style.border, style.surface, style.atmosphere]
}

export function bristolNeonCardClasses(tipo: BristolType) {
  const style = BRISTOL_INTENSITY_STYLES[tipo - 1]
  if (!style) return intensityCardClasses(BRISTOL_INTENSITY_STYLES[0])
  return intensityCardClasses(style)
}

export function neutralHistoryCardClasses() {
  return intensityCardClasses(NEUTRAL_HISTORY_STYLE)
}
