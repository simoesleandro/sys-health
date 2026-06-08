export type BristolType = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type BristolTypeInfo = {
  tipo: BristolType
  titulo: string
  descricao: string
}

export const BRISTOL_TYPES: BristolTypeInfo[] = [
  {
    tipo: 1,
    titulo: "Tipo 1",
    descricao: "Caroços duros e separados",
  },
  {
    tipo: 2,
    titulo: "Tipo 2",
    descricao: "Salsicha grumosa com caroços",
  },
  {
    tipo: 3,
    titulo: "Tipo 3",
    descricao: "Salsicha com fendas na superfície",
  },
  {
    tipo: 4,
    titulo: "Tipo 4",
    descricao: "Como uma salsicha, liso e macio",
  },
  {
    tipo: 5,
    titulo: "Tipo 5",
    descricao: "Pedaços macios com bordas definidas",
  },
  {
    tipo: 6,
    titulo: "Tipo 6",
    descricao: "Pedaços fofos com bordas irregulares",
  },
  {
    tipo: 7,
    titulo: "Tipo 7",
    descricao: "Aquoso, sem pedaços sólidos",
  },
]

export type EvacuationRecord = {
  id: number
  dataHora: string
  horaLabel: string
  tipo: BristolType
  tipoLabel: string
  observacao: string | null
}

export function getBristolLabel(tipo: number) {
  const entry = BRISTOL_TYPES.find((item) => item.tipo === tipo)
  return entry ? `${entry.titulo} — ${entry.descricao}` : `Tipo ${tipo}`
}
