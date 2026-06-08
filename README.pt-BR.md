# SYS.HEALTH Web

**Português (BR)** · [English](./README.md)

<p align="center">
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  </a>
  <a href="https://react.dev/">
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
  <a href="https://tailwindcss.com/">
    <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  </a>
  <a href="https://supabase.com/">
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  </a>
  <a href="https://web.dev/progressive-web-apps/">
    <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge" alt="PWA" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/simoesleandro">
    <img src="https://img.shields.io/badge/GitHub-simoesleandro-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  <a href="https://www.linkedin.com/in/leandro-sim%C3%B5es-7a0b3537b/">
    <img src="https://img.shields.io/badge/LinkedIn-Leandro_Simoes-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
</p>

Dashboard web do **SYS.HEALTH** — ecossistema pessoal de saúde e performance. Consolida nutrição, treino, wearable (Zepp/Amazfit), medidas corporais, medicação, evacuação e IA Coach num único painel com design **Neon Frosted Glass**.

> Versão Next.js do ecossistema original ([simoesleandro/syshealth](https://github.com/simoesleandro/syshealth)), que também inclui dashboard Streamlit, bot Telegram e sync wearable.

**Repositório:** [github.com/simoesleandro/sys-health](https://github.com/simoesleandro/sys-health)

---

## Funcionalidades

| Módulo | Rota | Descrição |
|--------|------|-----------|
| **Hoje** | `/` | KPIs do dia, refeições, suplementos, biometria, wearable e gráficos |
| **Evolução** | `/evolucao` | Tendências 14 dias, peso histórico completo, composição corporal |
| **Registros** | `/registros` | Refeições e registos nutricionais |
| **Treinos** | `/treinos` | Musculação (Hevy) e cardio detalhado (Zepp) |
| **Histórico** | `/historico` | Resumo por data |
| **Medicação** | `/medicacao` | Checklist diário de medicamentos |
| **Evacuação** | `/evacuacao` | Escala de Bristol |
| **Biometria** | `/biometria` | Peso e perímetros corporais |
| **Banco de alimentos** | `/banco-alimentos` | CRUD de alimentos favoritos |
| **IA Coach** | `/ia-coach` | Chat com contexto de saúde (Gemini) |

### Integrações

- **Supabase** — PostgreSQL como fonte de verdade (`refeicoes`, `medidas`, `amazfit_dados`, `amazfit_workouts`, `hevy_treinos`)
- **Zepp / Amazfit** — sync de resumo diário + treinos de corrida via Server Actions
- **Hevy** — treinos de musculação (sync em desenvolvimento)
- **Google Gemini** — IA Coach e análise contextual

---

## Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **UI:** Tailwind CSS 4, shadcn/ui, Recharts
- **Dados:** Supabase (`@supabase/supabase-js`)
- **IA:** Vercel AI SDK + Gemini
- **PWA:** `@ducanh2912/next-pwa`
- **Fonte:** Exo 2

---

## Pré-requisitos

- Node.js 20+
- Projeto [Supabase](https://supabase.com/) com as tabelas necessárias
- Variáveis de ambiente (ver abaixo)

---

## Instalação

```bash
git clone https://github.com/simoesleandro/sys-health.git
cd sys-health
npm install
```

Copie `.env.example` para `.env.local` e preencha os valores (**nunca commite** `.env.local`):

```bash
cp .env.example .env.local
```

No Windows (PowerShell):

```powershell
Copy-Item .env.example .env.local
```

Aplique a migração de treinos Zepp no Supabase:

```sql
-- ver supabase/migrations/20260608_amazfit_workouts.sql
```

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento em **http://localhost:3535** (acessível na LAN) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção na porta **3535** |
| `npm run lint` | ESLint |
| `npm run firewall:open` | Abre a porta 3535 no firewall do Windows (LAN) |

---

## Sync Zepp

O botão **Sincronizar** no header (ou na aba Cardio) dispara `syncZeppData()`, que:

1. Busca o resumo diário (`band_data.json`) → `amazfit_dados`
2. Encadeia `syncZeppWorkouts()` → `amazfit_workouts` (pace, duração, FC, distância)

Os indicadores verdes no header aparecem quando a última sync está dentro de **48h** (hoje/ontem, horário de Brasília).

---

## Estrutura do projeto

```
app/(dashboard)/     # Páginas do painel
components/          # UI, modais, gráficos, layout
lib/
  actions/           # Server Actions (sync, meals, biometry…)
  data.ts            # Fetch Supabase (cache React)
  zepp-api.ts        # Cliente API Zepp
  trends.ts          # Tendências 14 dias
supabase/migrations/ # SQL versionado
```

Documentação detalhada do ecossistema: [`GUIA-DO-PROJETO.md`](./GUIA-DO-PROJETO.md).

---

## Autor

**Leandro Simões** — projeto de portfólio / uso pessoal (FIAP 2026).

<p align="center">
  <a href="https://github.com/simoesleandro">
    <img src="https://img.shields.io/badge/GitHub-simoesleandro-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  <a href="https://www.linkedin.com/in/leandro-sim%C3%B5es-7a0b3537b/">
    <img src="https://img.shields.io/badge/LinkedIn-Leandro_Simoes-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
</p>

---

## Licença

Projeto privado / uso pessoal. Consulte o repositório principal para mais contexto.
