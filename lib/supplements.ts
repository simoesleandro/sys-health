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

export const WHEY_MACROS = {
  label: "Whey Isolado Dux 30g",
  calorias: 118,
  proteinas: 24,
  carboidratos: 2,
  gorduras: 1.5,
} as const

/** Descrição legada (registos anteriores ao split 2x/dia). */
export const WHEY_LEGACY_DESCRICAO = "Whey Protein Isolado Dux (30g)"

export const DEFAULT_VISUAL_SUPPLEMENTS: VisualSupplement[] = [
  {
    id: "whey-1",
    nome: "Whey Protein",
    marca: "Growth",
    dose: "30g · 1º scoop",
    cor_tema: "green",
    label: "Whey Isolado Dux 30g — Dose 1",
    descricao: `${WHEY_LEGACY_DESCRICAO} — Dose 1`,
    calorias: WHEY_MACROS.calorias,
    proteinas: WHEY_MACROS.proteinas,
    carboidratos: WHEY_MACROS.carboidratos,
    gorduras: WHEY_MACROS.gorduras,
  },
  {
    id: "whey-2",
    nome: "Whey Protein",
    marca: "Growth",
    dose: "30g · 2º scoop",
    cor_tema: "green",
    label: "Whey Isolado Dux 30g — Dose 2",
    descricao: `${WHEY_LEGACY_DESCRICAO} — Dose 2`,
    calorias: WHEY_MACROS.calorias,
    proteinas: WHEY_MACROS.proteinas,
    carboidratos: WHEY_MACROS.carboidratos,
    gorduras: WHEY_MACROS.gorduras,
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

/** @deprecated Use getUserSupplementPresets() */
export const VISUAL_SUPPLEMENTS = DEFAULT_VISUAL_SUPPLEMENTS

export type SupplementGridItem = VisualSupplement & {
  isTaken: boolean
  mealId: number | null
}

export const WATER_QUICK_VOLUMES_ML = [200, 300, 500] as const
