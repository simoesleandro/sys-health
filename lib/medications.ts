export type ActiveMedication = {
  id: number
  nome: string
  dosagem: string
  periodo: string
}

export type MedicationChecklistItem = ActiveMedication & {
  isTaken: boolean
  logId: number | null
}

// TODO: Substituir por SELECT em `medicamentos_ativos` quando a tabela existir no Supabase.
export const MOCK_ACTIVE_MEDICATIONS: ActiveMedication[] = [
  {
    id: 1,
    nome: "Tirzepatida",
    dosagem: "5 mg",
    periodo: "Semanal (domingo)",
  },
  {
    id: 2,
    nome: "Vitamina D3",
    dosagem: "1 cápsula",
    periodo: "Após o almoço",
  },
  {
    id: 3,
    nome: "Creatina",
    dosagem: "1 scoop (5 g)",
    periodo: "Pré-treino",
  },
  {
    id: 4,
    nome: "Ômega 3",
    dosagem: "2 cápsulas",
    periodo: "Após o jantar",
  },
  {
    id: 5,
    nome: "Magnésio",
    dosagem: "1 comprimido",
    periodo: "Antes de dormir",
  },
]
