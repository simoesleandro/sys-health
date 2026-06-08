# SYS.HEALTH — Guia completo do projeto



> Documento de referência do repositório `simoesleandro/syshealth`  

> Última revisão: junho/2026 · build dashboard: `2026-06-07-mob-bar-no-tab`



---



## 1. O que é este projeto



**SYS.HEALTH** é um ecossistema pessoal de saúde e performance. Consolida nutrição, treino, sono, HRV, medicação, medidas corporais, evacuação e análise por IA em um único fluxo de dados.



| Canal | Função |

|-------|--------|

| **Dashboard Streamlit** | Visualização, edição, gráficos, sync manual, IA Coach |

| **Bot Telegram** | Registro rápido por texto/foto, comandos, sync Zepp |

| **Banco Supabase/SQLite** | Fonte única de verdade |

| **API Flask (opcional)** | Endpoints REST para ferramentas externas |



**Demo:** [syshealth.streamlit.app](https://syshealth.streamlit.app/)  

**Repo:** [github.com/simoesleandro/syshealth](https://github.com/simoesleandro/syshealth)



---



## 2. Arquitetura de alto nível



```

┌─────────────────────────────────────────────────────────────────┐

│                         SYS.HEALTH                              │

├────────────────────┬────────────────────┬───────────────────────┤

│  Dashboard         │  Bot Telegram      │  Sync wearable        │

│  Streamlit Cloud   │  Fly.io (GRU)      │  Zepp API             │

│  dashboard.py      │  main.py + bot.py  │  zepp_sync.py         │

└─────────┬──────────┴─────────┬──────────┴───────────┬───────────┘

          │                    │                      │

          └────────────────────▼──────────────────────┘

                    ┌─────────────────────┐

                    │ Supabase PostgreSQL │  ← produção (SUPABASE_URL)

                    │ ou SQLite local     │  ← dev (nutricao.db)

                    └─────────────────────┘



Integrações externas:

  Gemini 2.5 Flash  → NLP + Vision (bot + dashboard + nutri_engine)

  Hevy API          → treinos de musculação

  Google Calendar   → agenda no dashboard (somente leitura)

  USDA FoodData     → busca nutricional opcional

```



### Por que dois deploys separados?



| Serviço | Onde roda | Motivo |

|---------|-----------|--------|

| Dashboard | Streamlit Community Cloud | Stateless, redeploy automático no `git push` |

| Bot + scheduler Zepp | Fly.io worker (`syshealth-bot`) | Processo 24/7, sem porta HTTP |



---



## 3. Estrutura de pastas e arquivos principais



```

Projeto_Fit/

├── dashboard.py              # App Streamlit principal (~4800 linhas)

├── app_sidebar.py            # Sidebar compartilhada (dashboard + Banco)

├── banco_alimentos.py        # Lógica da página Banco de Alimentos

├── busca_alimentos_ui.py     # Busca live via st.iframe + JS

├── pages/

│   └── 1_Banco_de_Alimentos.py   # Entry multipage Streamlit

├── sections/                 # Módulos lazy-load do dashboard

│   ├── banco_teaser.py

│   ├── biometria.py

│   ├── evacuacao.py

│   ├── historico.py

│   └── medicacao.py

├── bot.py                    # Bot Telegram + Gemini

├── main.py                   # Entry Fly.io: bot + scheduler Zepp 10:00 BRT

├── db.py                     # Abstração SQLite / PostgreSQL

├── nutri_engine.py           # Macros, TACO/USDA, decomposição IA

├── zepp_sync.py              # Cliente API Zepp (Amazfit Bip 6)

├── api_server.py             # Flask REST (porta 5060, local)

├── get_gcal_token.py         # OAuth Google Calendar (uma vez)

├── sh_tokens.py              # Design tokens + ícones Material

├── sh_components.py          # Componentes HTML reutilizáveis

├── sh_buttons_css.py         # CSS global de botões

├── .streamlit/

│   ├── config.toml           # Tema escuro, nav multipage oculta

│   └── secrets.toml.example  # Template de secrets do Cloud

├── fly.toml                  # Deploy bot Fly.io

├── Dockerfile.bot            # Imagem Python 3.11 do bot

├── requirements.txt          # Deps dashboard (+ bot shared)

├── requirements-bot.txt      # Deps mínimas do worker Fly.io

├── .python-version           # 3.11.9 (referência local)

├── CLAUDE.md                 # Memória técnica para agentes IA

├── README.md                 # Apresentação do projeto

└── docs/

    └── GUIA-DO-PROJETO.md    # Este documento

```



### Papel de cada arquivo core



| Arquivo | Responsabilidade |

|---------|------------------|

| `dashboard.py` | KPIs do dia, gráficos, modais `@st.dialog`, sync Zepp/Hevy, IA Coach, boot do app, CSS global |

| `app_sidebar.py` | KPIs sidebar, menu âncoras, ações rápidas, barra mobile, `IntersectionObserver`, centralização de modais |

| `db.py` | `query()`, `execute()`, `init_tables()`, tradução `_pg_sql()` SQLite→PostgreSQL |

| `bot.py` | Handlers Telegram, Gemini Vision/NLP, salvamento no banco |

| `main.py` | `init_tables()`, thread do bot, thread scheduler Zepp às **10:00 BRT** |

| `nutri_engine.py` | Tabela local de alimentos, USDA, cálculo proporcional de porções, IA para decompor pratos |

| `zepp_sync.py` | Fetch passos/sono/HRV/PAI/corrida → tabela `amazfit_dados` |



---



## 4. Banco de dados



### Seleção de backend



```python

# db.py

SUPABASE_URL definido → PostgreSQL (pg8000) via Supabase

SUPABASE_URL vazio    → SQLite em DB_PATH (default: nutricao.db)

```



### Tabelas principais



| Tabela | Conteúdo |

|--------|----------|

| `refeicoes` | Refeições com macros + `componentes_json` (itens do carrinho) |

| `agua` | Registros de hidratação (ml) |

| `medidas` | Peso e perímetros corporais (upsert por **data**) |

| `medicacao` | Doses de Tirzepatida (mg) |

| `amazfit_dados` | Passos, calorias, sono, HRV, PAI, corrida (PK: `data_hora`) |

| `hevy_treinos` | Treinos importados da Hevy (PK: `id` string) |

| `alimentos_favoritos` | Banco pessoal de alimentos/combos (porção ref. g/ml/und) |

| `ia_analises_clinicas` | Histórico de análises do IA Coach |

| `evacuacoes` | Registro intestinal (criada no boot do dashboard se ausente) |



### Timezone (crítico)



- Streamlit Cloud e Fly.io rodam em **UTC**

- Filtros “hoje” usam **`America/Sao_Paulo`** (BRT)

- No PostgreSQL: `(data_hora AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')`

- Função `_pg_sql()` em `db.py` traduz padrões SQLite (`date(...)`, `strftime`, `datetime`) para SQL PostgreSQL



### Regras de acesso



- Sempre `db(query, params=[...])` — **nunca** f-string com valores do usuário

- Colunas nullable: proteger `iloc[0]` com `if val is not None`

- Medidas: **UPDATE** se já existe linha do dia, senão **INSERT**



---



## 5. Integrações externas



### Gemini 2.5 Flash



- **Pacote:** `google-generativeai==0.8.3`

- **Env:** `GEMINI_API_KEY`

- **Usos:** bot (texto + foto), dashboard (IA Coach), `nutri_engine.decompor_refeicao_ia()`

- **Vision:** um prompt unificado detecta prato vs bioimpedância vs outro



### Zepp / Amazfit Bip 6



- **Env:** `ZEPP_APP_TOKEN`, `ZEPP_USER_ID`

- **Auto-sync:** `main.py` às **10:00 BRT** (worker Fly.io)

- **Manual:** bot `/sync` ou botões ⌚ Zepp no header do dashboard

- **Tabela:** `amazfit_dados`

- **Cloud:** auto-sync desligado no Streamlit (`ZEPP_AUTO_SYNC=0` / detecção de runtime)



### Hevy



- **Env:** `HEVY_API_KEY`

- **Sync manual:** botão 💪 Hevy no header → `_hevy_sync_dashboard()`

- **Tabela:** `hevy_treinos`



### Google Calendar



- **Env:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`

- **Setup:** rodar `python get_gcal_token.py` uma vez

- **Uso:** aba Agenda em “Hoje” (somente leitura)



### Telegram



- **Env:** `TELEGRAM_TOKEN` — **somente Fly.io**, nunca no Streamlit Cloud

- **Deploy secrets:** `fly secrets set TELEGRAM_TOKEN="..." --app syshealth-bot`



### USDA FoodData Central



- **Env:** `USDA_API_KEY` (default `DEMO_KEY`)

- **Uso:** busca nutricional em `nutri_engine.py`



---



## 6. Bot Telegram (`bot.py`)



### Comandos



| Comando | Ação |

|---------|------|

| `/start` | Mensagem de boas-vindas |

| `/sync` | Sync imediato Zepp |

| `/status` | Resumo do dia |

| `/hrv 38` | Registra HRV manual |

| `/pai 117` | Registra PAI manual |



### Handlers



- **Foto:** Gemini Vision → refeição ou medidas corporais

- **Texto livre:** Gemini NLP → refeição, água, peso, etc.

- **Presets:** Whey, Creatina (macros fixos)



### Deploy



```bash

fly deploy --config fly.toml

fly scale count 1 --app syshealth-bot

fly status --app syshealth-bot

```



---



## 7. Dashboard Streamlit



### Entry e páginas



| Arquivo | Papel |

|---------|-------|

| `dashboard.py` | Página principal (scroll contínuo) |

| `pages/1_Banco_de_Alimentos.py` | Multipage → `banco_alimentos.render_banco_page()` |



`.streamlit/config.toml`: `showSidebarNavigation = false` — menu multipage padrão oculto; navegação pela sidebar customizada.



### Seções (âncoras `#sec-*`)



Ordem no DOM = ordem do menu lateral:



| Âncora | Conteúdo |

|--------|----------|

| `sec-hoje` | Tabs: Nutrição · Wearable · Agenda |

| `sec-evolucao` | Gráfico de peso |

| `sec-registros` | Lista de refeições do dia |

| `sec-treinos` | Hevy + corrida Zepp |

| `sec-historico` | Tendências (fragment lazy) |

| `sec-medicacao` | Tirzepatida |

| `sec-biometria` | Medidas corporais |

| `sec-evacuacao` | Saúde intestinal |

| `sec-ia` | IA Coach |

| `sec-banco` | Card teaser + link para página Banco |



**Menu sidebar:** 9 itens (Hoje → IA Coach). Banco de Alimentos só em **Ações rápidas**.



### Modais (`@st.dialog`)



| Modal | Função |

|-------|--------|

| Nova refeição | Carrinho multi-item, busca alimentos, macros |

| Editar refeições | Lista + edição completa |

| Hidratação · Recovery | Água + HRV |

| Suplementação | Whey, creatina, etc. |

| Biometria nova/editar | Medidas do dia |

| Medicação nova/editar | Tirzepatida |

| Evacuação | Registro + histórico |



**Abrir modal:** sidebar ou barra mobile gravam `session_state["open_dialog"]`; após a sidebar, o dashboard faz `pop` e chama a função do modal. Callbacks **não** chamam `@st.dialog` nem `st.rerun()` diretamente.



### Sidebar (`app_sidebar.py`)



- KPIs do dia (calorias, proteína, água, balanço)

- Painel Amazfit (passos, sono, HRV, PAI)

- Menu HTML com links `#sec-*` + `IntersectionObserver`

- **Ações rápidas:** Nova refeição, Editar, Água, Suplemento, Banco

- `_flush_pending_switch()` — processa `st.switch_page` **fora** de callbacks



### Barra mobile (≤680px)



- Três botões: ➕ Refeição · 💧 Água · 💊 Suplemento

- Renderizada só no **dashboard** (`render_mobile_quick_bar`)

- CSS media query + classes `sh-xs` / `sh-sm`

- Usa `st.button` inline (mesma aba, sem links HTML)



### Banco de Alimentos (página dedicada)



- CRUD de `alimentos_favoritos`

- Busca live: `st.iframe` + JS (`busca_alimentos_ui.embed_html_iframe`)

- Ações URL: `?banco_act=star|edit|del&banco_id=`

- Ações rápidas da sidebar voltam ao dashboard via `_pending_switch`



### Metas nutricionais (dashboard)



| Constante | Valor |

|-----------|-------|

| TMB | 1863 kcal |

| META_PROT | 190 g |

| META_CARB | 241 g |

| META_GORD | 75 g |

| META_AGUA | 3,5 L |

| META_PASS | 10 000 passos |

| META_SONO | 90 min (meta sono profundo) |

| META_PAI | 100 |



**Saldo calórico** = TMB + gasto wearable − consumido (`deficit`).



### Categorias de refeição



Café da Manhã, Lanche da Manhã, Almoço, Lanche da Tarde, Jantar, Lanche da Noite, Pré-Treino, Pós-Treino — sugeridas pela hora BRT (`_cat_hora()`).



---



## 8. Design system (jun/2026)



| Módulo | Conteúdo |

|--------|----------|

| `sh_tokens.py` | Cores (`CYAN`, `GREEN`, …), fontes, `ROOT_CSS`, ícones Material (`EDIT_ICON`, `STAR_ICON`, …) |

| `sh_components.py` | `section_anchor()`, `sh_section()`, `sh_metric()`, `sh_card()`, `panel()`, `pbar()` |

| `sh_buttons_css.py` | `FLUID_BUTTONS_CSS`, hover, a11y, tabelas mobile |



**Tema** (`.streamlit/config.toml`): fundo `#080c14`, accent `#00d4ff`, dark mode.



**Build visível:** rodapé do dashboard exibe `_APP_BUILD` (identifica deploy no Cloud).



**Importante:** ícones Material importar de `sh_tokens` — **não** de `app_sidebar` (evita ImportError no Cloud).



---



## 9. Padrões de código e UX



### Streamlit — gotchas



| Fazer | Evitar |

|-------|--------|

| `st.html()` para JS do observer | `st.components.v1.html` (deprecado) |

| `st.iframe` para busca live no Banco | iframe dentro de `@st.dialog` |

| `st.text_input` + `@st.fragment` no modal refeição | postMessage / URL params no modal |

| `on_click` → só `session_state` | `@st.dialog` / `st.rerun()` em callback |

| `_notif()` + toast | `st.success()` + rerun imediato |

| `_invalidate_cache(fn)` cirúrgico | `st.cache_data.clear()` global |

| CSS em `_CSS_BUNDLE` (módulo) | `@st.cache_resource` em strings CSS gigantes (Python 3.13 TokenError) |



### Cache



- `@st.cache_data(ttl=60)` em queries sidebar e dashboard

- Invalidação após writes via `_invalidate_cache()`



### Feedback e metas



- `_check_goal_celebrations()` — overlay ao bater meta proteína/água

- Timezone sempre `ZoneInfo("America/Sao_Paulo")`



---



## 10. Deploy e secrets



### Streamlit Community Cloud



| Item | Valor |

|------|-------|

| Repo | `simoesleandro/syshealth` |

| Branch | `main` |

| Entry | `dashboard.py` |

| Python | **3.11** (Advanced settings no painel — **não** usar `packages.txt` para versão) |

| Redeploy | Automático no push (~1 min) |



**Secrets:** copiar de `.streamlit/secrets.toml.example` → App Settings → Secrets (TOML).



**Shim no topo de `dashboard.py`:** copia `st.secrets` → `os.environ` para `db.py`.



### Fly.io (bot)



| Item | Valor |

|------|-------|

| App | `syshealth-bot` |

| Região | `gru` |

| Dockerfile | `Dockerfile.bot` |

| Comando | `python -u main.py` |

| VM | 256 MB shared CPU |



```powershell

fly deploy --config fly.toml

fly secrets set TELEGRAM_TOKEN="..." --app syshealth-bot

fly secrets set SUPABASE_URL="..." --app syshealth-bot

fly secrets set GEMINI_API_KEY="..." --app syshealth-bot

# Uma variável por comando no PowerShell

```



### Render (legado)



`render.yaml` — worker com volume SQLite em `/data/nutricao.db` (alternativa antiga ao Supabase).



---



## 11. Variáveis de ambiente



| Variável | Onde | Obrigatório |

|----------|------|-------------|

| `SUPABASE_URL` | Cloud, Fly, local prod | Sim (Cloud) |

| `DB_PATH` | Local SQLite | Dev sem Supabase |

| `GEMINI_API_KEY` | Bot, dashboard | Recomendado |

| `TELEGRAM_TOKEN` | Fly.io only | Bot |

| `ZEPP_APP_TOKEN`, `ZEPP_USER_ID` | Bot, dashboard sync | Opcional |

| `HEVY_API_KEY` | Dashboard | Opcional |

| `GOOGLE_*` | Dashboard agenda | Opcional |

| `USDA_API_KEY` | nutri_engine | Opcional |

| `ZEPP_AUTO_SYNC` | Dashboard | Desligado no Cloud |



---



## 12. Dependências



### `requirements.txt` (dashboard)



- `streamlit>=1.40.0,<2`

- `pandas`, `plotly`, `Pillow`

- `google-generativeai==0.8.3`

- `pg8000` (PostgreSQL)

- `google-api-python-client`, `google-auth*` (Calendar)

- `flask`, `pyTelegramBotAPI` (compartilhado com utilitários locais)



### `requirements-bot.txt` (Fly.io)



Subset sem Streamlit/plotly — bot + Gemini + DB + Pillow.



### Python



- **3.11.9** recomendado (`.python-version`)

- Evitar **3.13+** no Cloud (wheels/cache issues históricos)

- **Não** usar `packages.txt` com `python-3.11` — não é pacote apt válido



---



## 13. Utilitários locais



| Script | Uso |

|--------|-----|

| `streamlit run dashboard.py` | Dashboard local |

| `python main.py` | Bot + scheduler (local) |

| `python zepp_sync.py --date YYYY-MM-DD --days N` | Sync Zepp manual |

| `python get_gcal_token.py` | Obter refresh token Google |

| `python api_server.py` | API REST porta 5060 |

| `start_zepp.bat` / `start_api.bat` | Atalhos Windows |



### API Flask (`api_server.py`)



Rotas: `/health`, `/api/resumo`, `/api/treinos`, `/api/treinos/analise`, `/api/corpo`, `/api/sono`, `/api/corridas`.



---



## 14. Como rodar localmente



```bash

git clone https://github.com/simoesleandro/syshealth.git

cd syshealth

python -m venv venv

venv\Scripts\activate          # Windows

pip install -r requirements.txt



# Secrets locais

copy .streamlit\secrets.toml.example .streamlit\secrets.toml

# Editar SUPABASE_URL ou deixar vazio para nutricao.db (SQLite)



streamlit run dashboard.py

```



Bot (terminal separado):



```bash

pip install -r requirements-bot.txt

# .env com TELEGRAM_TOKEN, SUPABASE_URL, GEMINI_API_KEY, ZEPP_*

python main.py

```



---



## 15. Fluxos importantes



### Registrar refeição (dashboard)



1. Sidebar ou barra mobile → `open_dialog = "refeicao"`

2. Modal Nova Refeição → carrinho de itens

3. Busca alimentos (fragment Streamlit nativo no modal)

4. Salvar → `INSERT refeicoes` + invalidação de cache



### Sync Zepp (dashboard)



1. Botão ⌚ Zepp → `_run_header_sync("zepp")`

2. `zepp_sync.zepp_sync(hoje)` → `save()` → toast `_notif()`



### Navegação Banco → Dashboard (ação rápida)



1. `_queue_open_dialog(dlg, active_page="banco")`

2. Grava `open_dialog` + `_pending_switch = dashboard.py`

3. `_flush_pending_switch()` → `st.switch_page`

4. Dashboard abre modal correspondente



---



## 16. Documentação complementar



| Arquivo | Conteúdo |

|---------|----------|

| `CLAUDE.md` | Memória técnica completa para IA (deploy, gotchas, checklist UX) |

| `README.md` | Apresentação e quick start |

| `README.en.md` | Versão em inglês |

| `.streamlit/secrets.toml.example` | Template de secrets |



---



## 17. Autor e aviso



**Leandro Simões** — projeto de portfólio / uso pessoal (FIAP 2026).



Dados de saúde são privados. Não commitar secrets (`.env`, `secrets.toml` estão no `.gitignore`).



---



*Para atualizar este guia após mudanças grandes, revise `_APP_BUILD`, seções do dashboard e `CLAUDE.md`.*