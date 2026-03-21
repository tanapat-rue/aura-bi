# AuraBI

Zero-trust business intelligence that runs entirely in your browser.
Clean, transform, and visualize data — your data never leaves your machine.

**Production:** https://aura.inbrowserapp.work
**API:** https://aura-api.inbrowserapp.work

---

## Architecture

```
aura-bi/
├── apps/
│   ├── web/          # React + Vite frontend (Cloudflare Pages)
│   └── worker/       # Hono API + D1 (Cloudflare Worker)
└── packages/
    └── shared/       # Shared TypeScript types
```

- **Frontend** — React, Vite, Tailwind CSS, Zustand, ECharts, DuckDB-WASM
- **Backend** — Cloudflare Workers (Hono), D1 (SQLite), JWT auth
- **Data engine** — DuckDB-WASM runs in-browser; all processing is local-first
- **Hosting** — 100% Cloudflare (Pages + Workers + D1)

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+

```bash
npm install -g pnpm
```

### Install dependencies

```bash
pnpm install
```

### Set up local environment

Create `apps/worker/.dev.vars` (used by Wrangler for local secrets):

```ini
JWT_SECRET=any-random-secret-for-local-dev
```

### Run D1 migrations (first time only)

```bash
pnpm --filter @aura-bi/worker db:migrate:local
```

### Start development servers

```bash
pnpm dev
```

This starts:
| Service | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Worker API (Wrangler) | http://localhost:8787 |

> In dev mode, auth is bypassed — you are automatically logged in as an Enterprise user so all features are accessible.

---

## Project Structure

### Frontend (`apps/web/src/`)

```
lib/
  duckdb.ts          # DuckDB-WASM engine (ingestion, profiling, ETL, SQL)
  widget-types.ts    # 20 widget types, color palettes, widget factory
  widget-query.ts    # SQL query builder for each widget type
  store.ts           # Zustand store — Project model (persisted to localStorage)
components/
  DashboardCanvas.tsx    # Multi-widget dashboard canvas
  WidgetRenderer.tsx     # ECharts renderer for all widget types
  WidgetConfigPanel.tsx  # Per-widget config (dimensions, metrics, filters)
  PipelineBuilder.tsx    # Visual ETL pipeline builder
  DataProfiler.tsx       # Column profiling UI
  SearchSelect.tsx       # Searchable dropdown (replaces native <select>)
pages/
  Landing.tsx        # Marketing landing page
  Dashboard.tsx      # Main BI workspace
styles/
  index.css          # Design system (glass, input, select, btn-*)
```

### Worker (`apps/worker/src/`)

```
routes/
  auth.ts        # POST /api/auth/register, /api/auth/login, GET /api/auth/me
  dashboards.ts  # CRUD /api/dashboards
  share.ts       # POST /api/share, GET /api/share/:id
middleware/
  auth.ts        # JWT verification middleware
migrations/
  0001_init.sql  # D1 schema (users, dashboards, data_sources, shared_links)
```

---

## ETL Pipeline — Supported Transform Steps

| Step | Description |
|---|---|
| `filter` | Filter rows by condition |
| `drop_columns` | Remove columns |
| `rename_column` | Rename a column |
| `cast_type` | Change column data type |
| `fill_null` | Fill nulls with value / mean / median / mode |
| `deduplicate` | Remove duplicate rows (all columns or subset) |
| `sort` | Sort by column ASC/DESC |
| `calculated_field` | Add a new column from a SQL expression |
| `group_aggregate` | GROUP BY + aggregation functions |
| `join` | INNER / LEFT / RIGHT / FULL JOIN with another table |
| `limit` | Limit row count |
| `json_flatten` | Unnest a JSON array column into rows |
| `json_split` | Extract specific fields from a JSON/struct column |
| `custom_sql` | Write arbitrary SQL (use `__SOURCE__` as table reference) |

---

## Dashboard Widget Types

**KPI** — Scorecard, Gauge

**Charts** — Column, Bar, Stacked Column, Stacked Bar, Line, Area, Stacked Area, Pie, Donut, Treemap, Funnel, Scatter, Heatmap, Combo

**Table** — Data Table

**Filters** — Dropdown Filter, Date Range

**Other** — Text / Note

---

## Deployment

### 1. Login to Cloudflare

```bash
cd apps/worker && npx wrangler login
```

### 2. Create D1 database (first time only)

```bash
npx wrangler d1 create aura-db
```

Copy the returned `database_id` into `apps/worker/wrangler.toml`.

### 3. Run remote migrations (first time only)

```bash
pnpm --filter @aura-bi/worker db:migrate:remote
```

### 4. Set Worker secrets

```bash
cd apps/worker
npx wrangler secret put JWT_SECRET
# Enter a strong random secret when prompted
```

### 5. Deploy the Worker

```bash
pnpm --filter @aura-bi/worker deploy
```

### 6. Create Cloudflare Pages project (first time only)

```bash
cd apps/web && npx wrangler pages project create aura-bi
```

### 7. Build and deploy the frontend

```bash
pnpm --filter @aura-bi/web build
cd apps/web && npx wrangler pages deploy dist --project-name=aura-bi
```

### 8. Set custom domains

In the Cloudflare dashboard:

- **Pages** → `aura-bi` → Custom Domains → add `aura.inbrowserapp.work`
- **Workers** → `aura-bi-api` → Settings → Domains & Routes → add `aura-api.inbrowserapp.work`

---

## GitHub Actions (CI/CD)

Auto-deploy on every push to `main`.

Add these secrets in GitHub → Settings → Secrets → Actions:

| Secret | Where to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar |

The workflow at `.github/workflows/deploy.yml` will:
1. Run D1 migrations
2. Deploy the Worker
3. Build the frontend
4. Deploy to Cloudflare Pages

---

## Environment Variables

### Worker (`apps/worker/.dev.vars` for local, Wrangler secrets for production)

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret key for signing JWT tokens |

### Frontend (`apps/web/.env.production`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Worker API base URL (`https://aura-api.inbrowserapp.work`) |

---

## Useful Commands

```bash
# Run everything locally
pnpm dev

# Build frontend only
pnpm --filter @aura-bi/web build

# Run local D1 migration
pnpm --filter @aura-bi/worker db:migrate:local

# Run remote D1 migration
pnpm --filter @aura-bi/worker db:migrate:remote

# Deploy worker
pnpm --filter @aura-bi/worker deploy

# Type check
pnpm --filter @aura-bi/web tsc --noEmit
```
