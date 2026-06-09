# SYS.HEALTH Web

**English** · [Português (BR)](./README.pt-BR.md)

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

Web dashboard for **SYS.HEALTH** — a personal health & performance ecosystem. It unifies nutrition, training, wearables (Zepp/Amazfit), body measurements, medication, bowel tracking, and an AI coach in a single **Neon Frosted Glass** panel.

> Next.js edition of the original ecosystem ([simoesleandro/syshealth](https://github.com/simoesleandro/syshealth)), which also includes a Streamlit dashboard, Telegram bot, and wearable sync.

---

## Features

| Module | Route | Description |
|--------|-------|-------------|
| **Today** | `/` | Daily KPIs, meals, supplements, biometrics, wearable metrics, charts |
| **Evolution** | `/evolucao` | 14-day trends, full weight history, body composition |
| **Logs** | `/registros` | Meals and nutrition entries |
| **Workouts** | `/treinos` | Strength (Hevy) and detailed cardio (Zepp) |
| **History** | `/historico` | Day-by-day summary |
| **Medication** | `/medicacao` | Daily medication checklist |
| **Bowel** | `/evacuacao` | Bristol scale — summary cards, register & history modals |
| **Biometrics** | `/biometria` | Weight and body measurements |
| **Food bank** | `/banco-alimentos` | Favorite foods CRUD |
| **Settings** | `/configuracoes` | Per-user nutrition goals and supplements |
| **AI Coach** | `/ia-coach` | Health-context chat (Gemini) |

### Integrations

- **Supabase** — PostgreSQL source of truth (`refeicoes`, `medidas`, `amazfit_dados`, `amazfit_workouts`, `hevy_treinos`)
- **Zepp / Amazfit** — daily summary + run workouts via Server Actions
- **Hevy** — strength training (sync in progress)
- **Google Gemini** — AI coach, meal analysis by text/photo (manual review before save)

---

## Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **UI:** Tailwind CSS 4, shadcn/ui, Recharts
- **Data:** Supabase (`@supabase/supabase-js`)
- **AI:** Vercel AI SDK + Gemini
- **PWA:** `@ducanh2912/next-pwa`
- **Font:** Exo 2

---

## Prerequisites

- Node.js 20+
- [Supabase](https://supabase.com/) project with the required tables
- Environment variables (see below)

---

## Setup

```bash
git clone https://github.com/simoesleandro/sys-health.git
cd sys-health
npm install
```

Copy `.env.example` to `.env.local` and fill in your values (**never commit** `.env.local`):

```bash
cp .env.example .env.local
```

Apply SQL migrations in Supabase (SQL Editor), in order under `supabase/migrations/`.

**Gemini:** set `GEMINI_API_KEY` in `.env.local` for dev and in **Vercel → Environment Variables** for production (not in Supabase). Requires prepaid credits on [Google AI Studio](https://aistudio.google.com).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server at **http://localhost:3535** (LAN accessible) |
| `npm run build` | Production build |
| `npm run start` | Production server on port **3535** |
| `npm run lint` | ESLint |
| `npm run firewall:open` | Open port 3535 on Windows firewall (LAN) |

---

## Zepp sync

The **Sync** button in the header (or Cardio tab) calls `syncZeppData()`, which:

1. Fetches the daily summary (`band_data.json`) → `amazfit_dados`
2. Chains `syncZeppWorkouts()` → `amazfit_workouts` (pace, duration, HR, distance)

Header indicators turn green when the last sync is within **48h** (today/yesterday BRT).

---

## Project structure

```
app/(dashboard)/     # Dashboard pages
components/          # UI, modals, charts, layout
lib/
  actions/           # Server Actions (sync, meals, biometry…)
  data.ts            # Supabase fetch (React cache)
  zepp-api.ts        # Zepp API client
  trends.ts          # 14-day trends
supabase/migrations/ # Versioned SQL
```

Full ecosystem docs (Portuguese): [`GUIA-DO-PROJETO.md`](./GUIA-DO-PROJETO.md).

---

## Author

**Leandro Simões** — portfolio / personal project (FIAP 2026).

<p align="center">
  <a href="https://github.com/simoesleandro">
    <img src="https://img.shields.io/badge/GitHub-simoesleandro-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  <a href="https://www.linkedin.com/in/leandro-sim%C3%B5es-7a0b3537b/">
    <img src="https://img.shields.io/badge/LinkedIn-Leandro_Simoes-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
</p>

---

## License

Private / personal use. See the main repository for broader context.
