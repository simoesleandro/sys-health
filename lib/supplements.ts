import type { TodayMeal } from "@/lib/meal-types"

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

export const WHEY_ISOLADO_MACROS = {
  calorias: 118,
  proteinas: 24,
  carboidratos: 2,
  gorduras: 1.5,
} as const

/** @deprecated Alias legado — preferir WHEY_ISOLADO_MACROS */
export const WHEY_MACROS = {
  label: "Whey Isolado Dux 30g",
  ...WHEY_ISOLADO_MACROS,
} as const

export const WHEY_CONCENTRADO_MACROS = {
  calorias: 120,
  proteinas: 22,
  carboidratos: 4,
  gorduras: 2,
} as const

type SupplementKind =
  | "whey-isolado"
  | "whey-concentrado"
  | "whey-generic"
  | "creatina"
  | "pre-treino"
  | "magnesio"
  | "omega3"
  | "vitamina-d"
  | "generic"

/** Categoria do painel — agrupa variantes (ex.: isolado + concentrado = whey). */
export type SupplementCategory =
  | "whey"
  | "creatina"
  | "pre-treino"
  | "magnesio"
  | "omega3"
  | "vitamina-d"
  | "generic"

export function kindToCategory(kind: SupplementKind): SupplementCategory {
  if (kind.startsWith("whey")) return "whey"
  if (kind === "creatina") return "creatina"
  if (kind === "pre-treino") return "pre-treino"
  if (kind === "magnesio") return "magnesio"
  if (kind === "omega3") return "omega3"
  if (kind === "vitamina-d") return "vitamina-d"
  return "generic"
}

export function getConfigCategory(
  config: Pick<VisualSupplement, "nome">
): SupplementCategory {
  return kindToCategory(detectSupplementKind(config.nome))
}

const CATEGORY_DISPLAY: Record<
  SupplementCategory,
  { nome: string; doseHint: string; cor_tema: SupplementTheme }
> = {
  whey: {
    nome: "Whey Protein",
    doseHint: "Isolado ou Concentrado",
    cor_tema: "green",
  },
  creatina: {
    nome: "Creatina",
    doseHint: "Escolha o produto",
    cor_tema: "cyan",
  },
  "pre-treino": {
    nome: "Pré-Treino",
    doseHint: "Escolha o produto",
    cor_tema: "magenta",
  },
  magnesio: {
    nome: "Magnésio",
    doseHint: "Escolha o produto",
    cor_tema: "purple",
  },
  omega3: {
    nome: "Ômega 3",
    doseHint: "Escolha o produto",
    cor_tema: "orange",
  },
  "vitamina-d": {
    nome: "Vitamina D",
    doseHint: "Escolha o produto",
    cor_tema: "yellow",
  },
  generic: {
    nome: "Suplemento",
    doseHint: "Escolha o produto",
    cor_tema: "cyan",
  },
}

export function getCategoryMaxDailyDoses(category: SupplementCategory) {
  if (category === "whey") return 2
  return 1
}

/** Card genérico na grade quando nenhuma dose da categoria foi tomada hoje. */
export const WHEY_GENERIC_GRID_ID = "whey-generic"

export const WHEY_GENERIC_DISPLAY_NAME = "Whey Protein"

export const WHEY_GENERIC_GRID_DOSE = "Isolado ou Concentrado"

export function categoryGenericGridId(category: SupplementCategory) {
  return category === "whey" ? WHEY_GENERIC_GRID_ID : `${category}-generic`
}

export function isCategoryGenericGridId(id: string) {
  return id === WHEY_GENERIC_GRID_ID || id.endsWith("-generic")
}

export function categoryDailyGridId(
  category: SupplementCategory,
  slot: number
) {
  return `${category}-daily-${slot}`
}

type SupplementTemplate = {
  kind: SupplementKind
  cor_tema: SupplementTheme
  dosesPerDay: number
  macros: {
    calorias: number
    proteinas: number
    carboidratos: number
    gorduras: number
  }
}

const SUPPLEMENT_TEMPLATES: Record<SupplementKind, SupplementTemplate> = {
  "whey-isolado": {
    kind: "whey-isolado",
    cor_tema: "green",
    dosesPerDay: 2,
    macros: WHEY_ISOLADO_MACROS,
  },
  "whey-concentrado": {
    kind: "whey-concentrado",
    cor_tema: "green",
    dosesPerDay: 2,
    macros: WHEY_CONCENTRADO_MACROS,
  },
  "whey-generic": {
    kind: "whey-generic",
    cor_tema: "green",
    dosesPerDay: 2,
    macros: WHEY_ISOLADO_MACROS,
  },
  creatina: {
    kind: "creatina",
    cor_tema: "cyan",
    dosesPerDay: 1,
    macros: { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 },
  },
  "pre-treino": {
    kind: "pre-treino",
    cor_tema: "magenta",
    dosesPerDay: 1,
    macros: { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 },
  },
  magnesio: {
    kind: "magnesio",
    cor_tema: "purple",
    dosesPerDay: 1,
    macros: { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 },
  },
  omega3: {
    kind: "omega3",
    cor_tema: "orange",
    dosesPerDay: 1,
    macros: { calorias: 9, proteinas: 0, carboidratos: 0, gorduras: 1 },
  },
  "vitamina-d": {
    kind: "vitamina-d",
    cor_tema: "yellow",
    dosesPerDay: 1,
    macros: { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 },
  },
  generic: {
    kind: "generic",
    cor_tema: "cyan",
    dosesPerDay: 1,
    macros: { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 },
  },
}

export function slugifyPresetId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function detectSupplementKind(nome: string): SupplementKind {
  const n = nome.trim().toLowerCase()

  if (n.includes("whey")) {
    if (n.includes("concentrado") || n.includes("concentrate")) {
      return "whey-concentrado"
    }
    if (n.includes("isolado") || n.includes("isolate")) {
      return "whey-isolado"
    }
    return "whey-generic"
  }
  if (n.includes("creatina")) return "creatina"
  if (n.includes("pré-treino") || n.includes("pre-treino") || n.includes("pre treino")) {
    return "pre-treino"
  }
  if (n.includes("magnésio") || n.includes("magnesio")) return "magnesio"
  if (n.includes("ômega") || n.includes("omega")) return "omega3"
  if (n.includes("vitamina d") || n.includes("vit. d") || n.includes("vit d")) {
    return "vitamina-d"
  }

  return "generic"
}

function defaultDoseForKind(kind: SupplementKind, slot: number, total: number) {
  if (kind.startsWith("whey")) {
    const scoop = total > 1 ? `Scoop ${slot}` : "Scoop 1"
    return `30g · ${scoop}`
  }
  switch (kind) {
    case "creatina":
      return "5g"
    case "pre-treino":
      return "1 dose"
    case "magnesio":
      return "400mg"
    case "omega3":
      return "2 cápsulas"
    case "vitamina-d":
      return "2000 UI"
    default:
      return "1 dose"
  }
}

export type GeneratedSupplementConfig = {
  presetId: string
  nome: string
  marca: string
  dose: string
  corTema: SupplementTheme
  label: string
  descricao: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
}

export function buildSupplementConfigsFromProduct(
  nome: string,
  marca: string,
  options: {
    existingPresetIds: Iterable<string>
    sortOrder: number
  }
): GeneratedSupplementConfig[] {
  const productName = nome.trim()
  const brand = marca.trim()
  if (!productName) return []

  const kind = detectSupplementKind(productName)
  const template = SUPPLEMENT_TEMPLATES[kind]
  const existing = new Set(options.existingPresetIds)
  const baseSlug = slugifyPresetId(
    brand ? `${productName}-${brand}` : productName
  )

  let presetId = baseSlug
  let attempt = 2
  while (existing.has(presetId)) {
    presetId = `${baseSlug}-${attempt}`
    attempt += 1
  }

  const dose = configDoseForKind(kind)

  return [
    {
      presetId,
      nome: productName,
      marca: brand,
      dose,
      corTema: template.cor_tema,
      label: buildProductLabel(productName, brand, kind),
      descricao: buildProductDescricao(productName, brand, kind, dose),
      calorias: template.macros.calorias,
      proteinas: template.macros.proteinas,
      carboidratos: template.macros.carboidratos,
      gorduras: template.macros.gorduras,
    },
  ]
}

function configDoseForKind(kind: SupplementKind) {
  if (kind.startsWith("whey")) return "30g"
  return defaultDoseForKind(kind, 1, 1)
}

function buildProductLabel(nome: string, marca: string, kind: SupplementKind) {
  const brand = marca.trim()
  if (kind.startsWith("whey")) {
    return brand ? `${nome.trim()} ${brand} 30g` : `${nome.trim()} 30g`
  }
  return brand ? `${nome.trim()} ${brand}` : nome.trim()
}

function buildProductDescricao(
  nome: string,
  marca: string,
  kind: SupplementKind,
  dose: string
) {
  const brand = marca.trim()
  const base = brand ? `${nome.trim()} ${brand}` : nome.trim()
  if (kind.startsWith("whey")) {
    return `${base} (30g)`
  }
  return `${base} (${dose})`
}

/** Nome legível na grade — distingue isolado/concentrado mesmo em dados antigos. */
export function getSupplementDisplayName(
  item: Pick<VisualSupplement, "nome" | "label" | "descricao" | "id">
) {
  if (isCategoryGenericGridId(item.id)) {
    if (item.id === WHEY_GENERIC_GRID_ID) return WHEY_GENERIC_DISPLAY_NAME
    const category = item.id.replace(/-generic$/, "") as SupplementCategory
    return CATEGORY_DISPLAY[category]?.nome ?? item.nome.trim()
  }

  if (item.nome.trim() !== WHEY_GENERIC_DISPLAY_NAME) {
    return item.nome.trim()
  }

  const source = `${item.label} ${item.descricao}`.toLowerCase()
  if (source.includes("concentrado") || source.includes("concentrate")) {
    return "Whey Protein Concentrado"
  }
  if (source.includes("isolado") || source.includes("isolate")) {
    return "Whey Protein Isolado"
  }

  return item.nome.trim()
}

export function wheyFamilyKey(
  item: Pick<VisualSupplement, "nome" | "marca" | "label" | "descricao" | "id">
) {
  return `${getSupplementDisplayName(item)}|${item.marca.trim()}`
}

/** Chave única produto+marca para evitar cadastros duplicados. */
export function productGroupKeyFromInput(nome: string, marca: string) {
  const productName = nome.trim()
  const brand = marca.trim()
  if (productName.toLowerCase().includes("whey")) {
    return wheyFamilyKey({
      nome: productName,
      marca: brand,
      label: "",
      descricao: "",
      id: "x",
    })
  }
  return `${productName}|${brand}`
}

export function productGroupKeysMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function productFamilyKey(
  item: Pick<VisualSupplement, "nome" | "marca" | "label" | "descricao" | "id">
) {
  if (isWheySupplement(item)) return wheyFamilyKey(item)
  return `${item.nome.trim()}|${item.marca.trim()}`
}

export function familySlugForCategory(item: VisualSupplement) {
  return slugifyPresetId(productFamilyKey(item).replace(/\|/g, "-"))
}

export function groupFamiliesInCategory(
  category: SupplementCategory,
  configs: VisualSupplement[]
) {
  const map = new Map<string, VisualSupplement[]>()

  for (const item of configs) {
    if (getConfigCategory(item) !== category) continue
    const key = productFamilyKey(item)
    const list = map.get(key) ?? []
    list.push(item)
    map.set(key, list)
  }

  return map
}

export function getCanonicalFamiliesInCategory(
  category: SupplementCategory,
  configs: VisualSupplement[]
) {
  return [...groupFamiliesInCategory(category, configs).values()].map(
    (slots) => normalizeFamilySlots(slots, new Map())[0]
  )
}

export function categoryUsesDynamicGrid(
  category: SupplementCategory,
  configs: VisualSupplement[]
) {
  return (
    groupFamiliesInCategory(category, configs).size > 1 ||
    getCategoryMaxDailyDoses(category) > 1
  )
}

export function getActiveCategories(
  configs: (VisualSupplement & { sortOrder?: number })[]
) {
  const order = new Map<SupplementCategory, number>()

  for (const item of configs) {
    const category = getConfigCategory(item)
    const current = order.get(category)
    const next = item.sortOrder ?? 0
    if (current == null || next < current) {
      order.set(category, next)
    }
  }

  return [...order.entries()]
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0], "pt-BR"))
    .map(([category]) => category)
}

export function suppFamilyPresetId(
  category: SupplementCategory,
  item: VisualSupplement
) {
  return `supp-family:${category}:${familySlugForCategory(item)}`
}

export function parseSuppFamilyPresetId(id: string) {
  if (id.startsWith("whey-family:")) {
    return {
      category: "whey" as SupplementCategory,
      familySlug: id.slice("whey-family:".length),
    }
  }

  if (!id.startsWith("supp-family:")) return null

  const rest = id.slice("supp-family:".length)
  const separator = rest.indexOf(":")
  if (separator <= 0) return null

  return {
    category: rest.slice(0, separator) as SupplementCategory,
    familySlug: rest.slice(separator + 1),
  }
}

export function isSuppFamilyRegistrationId(id: string) {
  return parseSuppFamilyPresetId(id) !== null
}

/** @deprecated Use isSuppFamilyRegistrationId */
export function isWheyRegistrationId(id: string) {
  return isSuppFamilyRegistrationId(id)
}

function findFamilyBySlug(
  configs: VisualSupplement[],
  category: SupplementCategory,
  familySlug: string
) {
  for (const [, slots] of groupFamiliesInCategory(category, configs)) {
    const representative = normalizeFamilySlots(slots, new Map())[0]
    if (!representative) continue
    if (familySlugForCategory(representative) === familySlug) {
      return representative
    }
  }
  return undefined
}

function categoryDailyMarker(category: SupplementCategory, dailySlot: number) {
  return `— ${CATEGORY_DISPLAY[category].nome} ${dailySlot} do dia`
}

function buildDailyRegistrationLabel(config: VisualSupplement) {
  return config.label
}

function buildDailyRegistrationDescricao(
  config: VisualSupplement,
  category: SupplementCategory,
  dailySlot: number
) {
  const brand = config.marca.trim()
  const base = brand
    ? `${config.nome.trim()} ${brand}`
    : config.nome.trim()
  return `${base} (${config.dose}) ${categoryDailyMarker(category, dailySlot)}`
}

function inferCategoryFromMealText(
  meal: TodayMeal,
  category: SupplementCategory
) {
  const text =
    `${meal.descricao} ${meal.componentes.map((component) => component.nome).join(" ")}`.toLowerCase()
  const display = CATEGORY_DISPLAY[category].nome.toLowerCase()

  if (category === "whey") {
    return text.includes("whey")
  }

  if (text.includes(display)) return true

  for (const keyword of CATEGORY_KEYWORDS[category]) {
    if (text.includes(keyword)) return true
  }

  return false
}

const CATEGORY_KEYWORDS: Record<SupplementCategory, string[]> = {
  whey: ["whey", "isolado", "concentrado"],
  creatina: ["creatina"],
  "pre-treino": ["pré-treino", "pre-treino", "pre treino"],
  magnesio: ["magnésio", "magnesio"],
  omega3: ["ômega", "omega"],
  "vitamina-d": ["vitamina d", "vit. d", "vit d"],
  generic: [],
}

export function isCategoryMeal(
  meal: TodayMeal,
  configs: VisualSupplement[],
  category: SupplementCategory
) {
  if (category === "whey" && isLegacyIsolatedWheyMeal(meal)) return true

  const marker = CATEGORY_DISPLAY[category].nome
  if (
    meal.descricao.includes(marker) &&
    meal.descricao.includes(" do dia")
  ) {
    return true
  }

  const categoryConfigs = configs.filter(
    (item) => getConfigCategory(item) === category
  )

  for (const preset of categoryConfigs) {
    if (meal.descricao === preset.descricao) return true
    if (meal.componentes.some((component) => component.nome === preset.label)) {
      return true
    }
  }

  return inferCategoryFromMealText(meal, category)
}

export function findFamilyConfigForMeal(
  meal: TodayMeal,
  configs: VisualSupplement[],
  category: SupplementCategory
) {
  if (category === "whey") {
    return findFamilyConfigForWheyMeal(meal, configs)
  }

  for (const family of getCanonicalFamiliesInCategory(category, configs)) {
    if (meal.descricao === family.descricao) return family
    if (meal.componentes.some((component) => component.nome === family.label)) {
      return family
    }
  }

  if (inferCategoryFromMealText(meal, category)) {
    return getCanonicalFamiliesInCategory(category, configs)[0]
  }

  return undefined
}

export function getTodayCategoryMeals(
  meals: TodayMeal[],
  configs: VisualSupplement[],
  category: SupplementCategory
) {
  return meals
    .filter((meal) => isCategoryMeal(meal, configs, category))
    .sort(
      (a, b) =>
        new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime() ||
        a.id - b.id
    )
    .slice(0, getCategoryMaxDailyDoses(category))
}

function buildGenericCategoryCard(
  category: SupplementCategory
): SupplementGridItem {
  const meta = CATEGORY_DISPLAY[category]
  return {
    id: categoryGenericGridId(category),
    nome: meta.nome,
    marca: "",
    dose: meta.doseHint,
    cor_tema: meta.cor_tema,
    label: meta.nome,
    descricao: meta.nome,
    calorias: 0,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 0,
    isTaken: false,
    mealId: null,
  }
}

function buildGridItemFromCategoryMeal(
  meal: TodayMeal,
  configs: VisualSupplement[],
  category: SupplementCategory,
  dailySlot: number
): SupplementGridItem {
  const family = findFamilyConfigForMeal(meal, configs, category)
  const displayName = family?.nome.trim() ?? CATEGORY_DISPLAY[category].nome

  return {
    id: categoryDailyGridId(category, dailySlot),
    nome: category === "whey" && family ? getSupplementDisplayName(family) : displayName,
    marca: family?.marca.trim() ?? "",
    dose: family?.dose ?? CATEGORY_DISPLAY[category].doseHint,
    cor_tema: family?.cor_tema ?? CATEGORY_DISPLAY[category].cor_tema,
    label: family?.label ?? displayName,
    descricao: meal.descricao,
    calorias: meal.calorias,
    proteinas: meal.proteinas,
    carboidratos: meal.carboidratos,
    gorduras: meal.gorduras,
    isTaken: true,
    mealId: meal.id,
  }
}

export function normalizeFamilySlots<
  T extends VisualSupplement & { sortOrder?: number },
>(slots: T[], taken: Map<string, number> = new Map()) {
  if (!slots.length) return []

  const picked = [...slots].sort((a, b) => {
    const aTaken = taken.has(a.id) ? 0 : 1
    const bTaken = taken.has(b.id) ? 0 : 1
    if (aTaken !== bTaken) return aTaken - bTaken

    const aOrder = a.sortOrder ?? 0
    const bOrder = b.sortOrder ?? 0
    if (aOrder !== bOrder) return aOrder - bOrder

    return a.id.localeCompare(b.id)
  })[0]

  return picked ? [picked] : []
}

export function parseWheySlotIndex(dose: string) {
  const scoopMatch = dose.match(/scoop\s*(\d+)/i)
  if (scoopMatch) return Number(scoopMatch[1])

  const ordinalMatch = dose.match(/(\d+)[º°]?\s*scoop/i)
  if (ordinalMatch) return Number(ordinalMatch[1])

  if (/dose\s*1|1[º°]/.test(dose)) return 1
  if (/dose\s*2|2[º°]/.test(dose)) return 2

  return 1
}

/** Mantém no máximo 2 doses por família — descarta cadastros duplicados. */
export function normalizeWheyFamilySlots<
  T extends VisualSupplement & { sortOrder?: number },
>(slots: T[], taken: Map<string, number>, maxDoses = 2) {
  const bySlotIndex = new Map<number, T[]>()

  for (const slot of slots) {
    const index = parseWheySlotIndex(slot.dose)
    const list = bySlotIndex.get(index) ?? []
    list.push(slot)
    bySlotIndex.set(index, list)
  }

  const result: T[] = []

  for (let index = 1; index <= maxDoses; index += 1) {
    const candidates = bySlotIndex.get(index)
    if (!candidates?.length) continue

    const picked = [...candidates].sort((a, b) => {
      const aTaken = taken.has(a.id) ? 0 : 1
      const bTaken = taken.has(b.id) ? 0 : 1
      if (aTaken !== bTaken) return aTaken - bTaken

      const aOrder = a.sortOrder ?? 0
      const bOrder = b.sortOrder ?? 0
      if (aOrder !== bOrder) return aOrder - bOrder

      return a.id.localeCompare(b.id)
    })[0]

    result.push(picked)
  }

  return result
}

function slugifyFamilyKey(key: string) {
  return slugifyPresetId(key.replace(/\|/g, "-"))
}

/** Descrição legada (registos anteriores ao split 2x/dia). */
export const WHEY_LEGACY_DESCRICAO = "Whey Protein Isolado Dux (30g)"

export const DEFAULT_VISUAL_SUPPLEMENTS: VisualSupplement[] = [
  {
    id: "whey-1",
    nome: "Whey Protein Isolado",
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
    nome: "Whey Protein Isolado",
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

/** @deprecated Use getCategoryMaxDailyDoses("whey") */
export const MAX_DAILY_WHEY_DOSES = 2

export function dailyWheyGridId(slot: number) {
  return `whey-daily-${slot}`
}

export function isWheySupplement(item: Pick<VisualSupplement, "id" | "nome">) {
  const nome = item.nome.toLowerCase()
  return item.id.startsWith("whey") || nome.includes("whey")
}

export function isDefaultIsolatedWhey(item: Pick<VisualSupplement, "id">) {
  return item.id === "whey-1" || item.id === "whey-2"
}

export function wheyFamilyPresetId(
  item: Pick<VisualSupplement, "nome" | "marca" | "label" | "descricao" | "id">
) {
  return `whey-family:${slugifyFamilyKey(wheyFamilyKey(item))}`
}

export function parseWheyFamilyPresetId(id: string): string | null {
  if (!id.startsWith("whey-family:")) return null
  return id.slice("whey-family:".length)
}

export function groupWheyFamilies<T extends VisualSupplement>(items: T[]) {
  const map = new Map<string, T[]>()
  for (const item of items.filter(isWheySupplement)) {
    const key = wheyFamilyKey(item)
    const list = map.get(key) ?? []
    list.push(item)
    map.set(key, list)
  }
  for (const [key, list] of map) {
    map.set(key, [...list].sort((a, b) => a.id.localeCompare(b.id)))
  }
  return map
}

/** @deprecated Use groupWheyFamilies */
export function groupWheyByNome<T extends VisualSupplement>(items: T[]) {
  return groupWheyFamilies(items)
}

function parseMealWheySlotIndex(meal: TodayMeal) {
  const fromDescricao = meal.descricao.match(/dose\s*(\d+)/i)
  if (fromDescricao) return Number(fromDescricao[1])

  for (const component of meal.componentes) {
    const fromLabel = component.nome.match(/dose\s*(\d+)/i)
    if (fromLabel) return Number(fromLabel[1])
  }

  return null
}

function mealMatchesWheySlot(meal: TodayMeal, slot: VisualSupplement) {
  if (meal.descricao === slot.descricao) return true

  const slotIndex = parseWheySlotIndex(slot.dose)
  const mealSlotIndex = parseMealWheySlotIndex(meal)

  return meal.componentes.some((component) => {
    if (component.nome !== slot.label) return false
    if (mealSlotIndex != null && mealSlotIndex !== slotIndex) return false
    return true
  })
}

function inferWheyFamilyFromMealText(
  meal: TodayMeal,
  configs: VisualSupplement[]
) {
  const text =
    `${meal.descricao} ${meal.componentes.map((component) => component.nome).join(" ")}`.toLowerCase()

  const byFamily = groupWheyFamilies(configs.filter(isWheySupplement))

  if (text.includes("concentrado") || text.includes("concentrate")) {
    for (const [, slots] of byFamily) {
      const first = slots[0]
      if (getSupplementDisplayName(first).toLowerCase().includes("concentrado")) {
        return normalizeWheyFamilySlots(slots, new Map())[0]
      }
    }
  }

  if (text.includes("isolado") || text.includes("isolate")) {
    for (const [, slots] of byFamily) {
      const first = slots[0]
      if (getSupplementDisplayName(first).toLowerCase().includes("isolado")) {
        return normalizeWheyFamilySlots(slots, new Map())[0]
      }
    }
  }

  return undefined
}

export function isWheyMeal(meal: TodayMeal, configs: VisualSupplement[]) {
  if (isLegacyIsolatedWheyMeal(meal)) return true

  const text =
    `${meal.descricao} ${meal.componentes.map((component) => component.nome).join(" ")}`.toLowerCase()
  if (text.includes("whey")) return true

  for (const preset of configs.filter(isWheySupplement)) {
    if (meal.descricao === preset.descricao) return true
    if (meal.componentes.some((component) => component.nome === preset.label)) {
      return true
    }
  }

  return false
}

export function findFamilyConfigForWheyMeal(
  meal: TodayMeal,
  configs: VisualSupplement[]
) {
  if (isLegacyIsolatedWheyMeal(meal)) {
    for (const [, slots] of groupWheyFamilies(configs)) {
      const first = slots[0]
      if (getSupplementDisplayName(first).toLowerCase().includes("isolado")) {
        return normalizeWheyFamilySlots(slots, new Map())[0]
      }
    }
  }

  for (const [, slots] of groupWheyFamilies(configs.filter(isWheySupplement))) {
    const canonical = normalizeWheyFamilySlots(slots, new Map())
    for (const slot of canonical) {
      if (meal.descricao === slot.descricao) return slot
      if (meal.componentes.some((component) => component.nome === slot.label)) {
        return slot
      }
    }
  }

  return inferWheyFamilyFromMealText(meal, configs)
}

/** @deprecated Use getTodayCategoryMeals(meals, configs, "whey") */
export function getTodayWheyMeals(
  meals: TodayMeal[],
  configs: VisualSupplement[]
) {
  return getTodayCategoryMeals(meals, configs, "whey")
}

export function mealMatchesSupplement(
  meal: TodayMeal,
  preset: VisualSupplement
) {
  if (isWheySupplement(preset)) {
    return mealMatchesWheySlot(meal, preset)
  }

  if (meal.descricao === preset.descricao) return true

  return meal.componentes.some(
    (component) =>
      component.nome === preset.label || component.nome === preset.descricao
  )
}

function isLegacyIsolatedWheyMeal(meal: TodayMeal) {
  return (
    meal.descricao === WHEY_LEGACY_DESCRICAO ||
    (meal.componentes.some(
      (component) => component.nome === "Whey Isolado Dux 30g"
    ) &&
      !meal.descricao.includes("Dose"))
  )
}

function sortGridItems<T extends { sortOrder?: number; nome: string }>(
  items: T[]
) {
  return [...items].sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      a.nome.localeCompare(b.nome, "pt-BR")
  )
}

/** Grade por categoria: genérico sem consumo; com consumo → 1 card por dose do dia. */
export function buildSupplementGridItems<
  T extends VisualSupplement & { sortOrder?: number; ativo?: boolean },
>(meals: TodayMeal[], configs: T[]): SupplementGridItem[] {
  const active = configs.filter((item) => item.ativo !== false)
  const items: SupplementGridItem[] = []

  for (const category of getActiveCategories(active)) {
    if (categoryUsesDynamicGrid(category, active)) {
      const categoryMeals = getTodayCategoryMeals(meals, active, category)

      if (categoryMeals.length === 0) {
        items.push(buildGenericCategoryCard(category))
        continue
      }

      items.push(
        ...categoryMeals.map((meal, index) =>
          buildGridItemFromCategoryMeal(meal, active, category, index + 1)
        )
      )
      continue
    }

    for (const family of getCanonicalFamiliesInCategory(category, active)) {
      const meal = meals.find(
        (entry) =>
          isCategoryMeal(entry, active, category) &&
          mealMatchesSupplement(entry, family)
      )

      items.push({
        ...family,
        isTaken: Boolean(meal),
        mealId: meal?.id ?? null,
      })
    }
  }

  return sortGridItems(items)
}

/** Modal/registro: opções por categoria (dinâmica) ou produto único (estática). */
export function buildRegistrationPresets(
  configs: VisualSupplement[]
): SupplementPreset[] {
  const active = configs.filter((item) => item.id)
  const presets: SupplementPreset[] = []

  for (const category of getActiveCategories(active)) {
    const families = getCanonicalFamiliesInCategory(category, active)
    const dynamic = categoryUsesDynamicGrid(category, active)

    for (const family of families) {
      const displayName =
        category === "whey"
          ? getSupplementDisplayName(family)
          : family.nome.trim()

      presets.push({
        id: dynamic ? suppFamilyPresetId(category, family) : family.id,
        label: dynamic ? brandLabel(family, displayName) : family.label,
        descricao: family.descricao,
        calorias: family.calorias,
        proteinas: family.proteinas,
        carboidratos: family.carboidratos,
        gorduras: family.gorduras,
      })
    }
  }

  return presets.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"))
}

/** @deprecated Use buildRegistrationPresets */
export function buildWheyFamilyPresets(
  configs: VisualSupplement[]
): SupplementPreset[] {
  return buildRegistrationPresets(configs).filter((preset) =>
    preset.id.startsWith("whey-family:") || preset.id.startsWith("supp-family:whey:")
  )
}

function brandLabel(
  item: Pick<VisualSupplement, "marca">,
  displayName: string
) {
  const brand = item.marca.trim()
  return brand ? `${displayName} · ${brand}` : displayName
}

export type ResolvePresetOptions = {
  additionalCategoryDoses?: Partial<Record<SupplementCategory, number>>
  /** @deprecated Use additionalCategoryDoses.whey */
  additionalWheyToday?: number
}

export function resolvePresetForRegistration(
  id: string,
  configs: (VisualSupplement & { ativo?: boolean })[],
  meals: TodayMeal[],
  options?: ResolvePresetOptions
): SupplementPreset | undefined {
  const active = configs.filter((item) => item.ativo !== false)
  const extraByCategory = {
    ...options?.additionalCategoryDoses,
    whey:
      (options?.additionalCategoryDoses?.whey ?? 0) +
      (options?.additionalWheyToday ?? 0),
  }

  const familyParsed = parseSuppFamilyPresetId(id)
  if (familyParsed) {
    const { category, familySlug } = familyParsed
    const dosesToday =
      getTodayCategoryMeals(meals, active, category).length +
      (extraByCategory[category] ?? 0)

    if (dosesToday >= getCategoryMaxDailyDoses(category)) return undefined

    const family = findFamilyBySlug(active, category, familySlug)
    if (!family) return undefined

    const dailySlot = dosesToday + 1

    return {
      id,
      label: buildDailyRegistrationLabel(family),
      descricao: buildDailyRegistrationDescricao(
        family,
        category,
        dailySlot
      ),
      calorias: family.calorias,
      proteinas: family.proteinas,
      carboidratos: family.carboidratos,
      gorduras: family.gorduras,
    }
  }

  if (id === "whey") {
    const legacyIsolado = [...groupWheyFamilies(active).entries()].find(
      ([key]) => key.startsWith(`${WHEY_GENERIC_DISPLAY_NAME}|`)
    )?.[1]
    if (legacyIsolado?.length) {
      return resolvePresetForRegistration(
        suppFamilyPresetId("whey", legacyIsolado[0]),
        configs,
        meals,
        options
      )
    }
  }

  const visual = active.find((item) => item.id === id)
  if (!visual) return undefined

  const category = getConfigCategory(visual)
  if (categoryUsesDynamicGrid(category, active)) return undefined

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

export function groupSupplementProducts<
  T extends VisualSupplement & { dbId?: number },
>(items: T[]) {
  const groups = new Map<string, T[]>()

  for (const item of items) {
    const key = productFamilyKey(item)
    const list = groups.get(key) ?? []
    list.push(item)
    groups.set(key, list)
  }

  return [...groups.entries()]
    .map(([, slots]) => {
      const sorted = normalizeFamilySlots(
        slots as (T & { sortOrder?: number })[],
        new Map()
      )
      return {
        slots: sorted,
        representative: sorted[0],
      }
    })
    .sort((a, b) => {
      const aOrder =
        (a.representative as T & { sortOrder?: number }).sortOrder ?? 0
      const bOrder =
        (b.representative as T & { sortOrder?: number }).sortOrder ?? 0
      return aOrder - bOrder || a.representative.nome.localeCompare(b.representative.nome, "pt-BR")
    })
}

export const WATER_QUICK_VOLUMES_ML = [200, 300, 500] as const
