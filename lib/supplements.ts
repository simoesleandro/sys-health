/** Presets de suplementação — espelha SUPP_REGISTER do Streamlit */
export type SupplementTheme =
  | "green"
  | "cyan"
  | "yellow"
  | "magenta"
  | "purple"
  | "orange"

export type VisualSupplement = {
  id: string
  nome: string
  marca: string
  dose: string
  cor_tema: SupplementTheme
  label: string
  descricao: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
}

const WHEY_MACROS = {
  label: "Whey Isolado Dux 30g",
  calorias: 118,
  proteinas: 24,
  carboidratos: 2,
  gorduras: 1.5,
} as const

/** Descrição legada (registos anteriores ao split 2x/dia). */
export const WHEY_LEGACY_DESCRICAO = "Whey Protein Isolado Dux (30g)"

export const VISUAL_SUPPLEMENTS: VisualSupplement[] = [
  {
    id: "whey-1",
    nome: "Whey Protein",
    marca: "Growth",
    dose: "30g · 1º scoop",
    cor_tema: "green",
    ...WHEY_MACROS,
    descricao: `${WHEY_LEGACY_DESCRICAO} — Dose 1`,
  },
  {
    id: "whey-2",
    nome: "Whey Protein",
    marca: "Growth",
    dose: "30g · 2º scoop",
    cor_tema: "green",
    ...WHEY_MACROS,
    descricao: `${WHEY_LEGACY_DESCRICAO} — Dose 2`,
  },
  {
    id: "creatina",
    nome: "Creatina",
    marca: "Max Titanium",
    dose: "5g",
    cor_tema: "cyan",
    label: "Creatina 6g",
    descricao: "Creatina (6g)",
    calorias: 0,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 0,
  },
  {
    id: "pre-treino",
    nome: "Pré-Treino",
    marca: "Dux Nutrition",
    dose: "1 dose",
    cor_tema: "magenta",
    label: "Pré-Treino More",
    descricao: "Pré-Treino More Dux",
    calorias: 0,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 0,
  },
  {
    id: "magnesio",
    nome: "Magnésio",
    marca: "Trio Vitha",
    dose: "400mg",
    cor_tema: "purple",
    label: "Magnésio Quelato",
    descricao: "Magnésio Quelato Trio Vitha",
    calorias: 0,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 0,
  },
  {
    id: "omega3",
    nome: "Ômega 3",
    marca: "Omegafor",
    dose: "2 cápsulas",
    cor_tema: "orange",
    label: "Ômega 3 Omegafor",
    descricao: "Ômega 3 Omegafor Plus",
    calorias: 9,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 1,
  },
  {
    id: "vit-d3-k2",
    nome: "Vitamina D",
    marca: "BioVit",
    dose: "2000 UI",
    cor_tema: "yellow",
    label: "Vit. D3 + K2 BioVit",
    descricao: "Vit. D3+K2 BioVit",
    calorias: 0,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 0,
  },
]

/** Compatível com registro em refeicoes (modal e server action). */
export type SupplementPreset = Pick<
  VisualSupplement,
  | "id"
  | "label"
  | "descricao"
  | "calorias"
  | "proteinas"
  | "carboidratos"
  | "gorduras"
>

/** Modal rápido — um preset de whey (registo em lote). */
export const SUPPLEMENT_PRESETS: SupplementPreset[] = [
  {
    id: "whey",
    label: WHEY_MACROS.label,
    descricao: WHEY_LEGACY_DESCRICAO,
    calorias: WHEY_MACROS.calorias,
    proteinas: WHEY_MACROS.proteinas,
    carboidratos: WHEY_MACROS.carboidratos,
    gorduras: WHEY_MACROS.gorduras,
  },
  ...VISUAL_SUPPLEMENTS.filter((item) => !item.id.startsWith("whey-")).map(
    ({ id, label, descricao, calorias, proteinas, carboidratos, gorduras }) => ({
      id,
      label,
      descricao,
      calorias,
      proteinas,
      carboidratos,
      gorduras,
    })
  ),
]

export function findSupplementById(id: string): SupplementPreset | undefined {
  const visual = VISUAL_SUPPLEMENTS.find((item) => item.id === id)
  if (visual) {
    return {
      id: visual.id,
      label: visual.label,
      descricao: visual.descricao,
      calorias: visual.calorias,
      proteinas: visual.proteinas,
      carboidratos: visual.carboidratos,
      gorduras: visual.gorduras,
    }
  }
  return SUPPLEMENT_PRESETS.find((item) => item.id === id)
}

export type SupplementGridItem = VisualSupplement & {
  isTaken: boolean
  mealId: number | null
}

export const WATER_QUICK_VOLUMES_ML = [200, 300, 500] as const
