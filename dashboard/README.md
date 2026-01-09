# Pulse Forge Analytics Dashboard

Minimal analytics dashboard for game tuning.

## Quick Start (< 20 lines)

```bash
# 1. Start MongoDB (if not running)
mongod --dbpath /data/db &

# 2. Start Backend
cd /app/backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 &

# 3. Start Dashboard
cd /app/dashboard
npm install
npm run dev

# 4. Generate demo data
curl -X POST "http://localhost:8001/api/analytics/demo/generate?days=7&runs_per_day=50" \
  -H "X-API-Key: pulse-forge-dashboard-2024"

# 5. Open http://localhost:3001
```

## API Keys

- Ingestion: `pulse-forge-ingest-2024`
- Dashboard: `pulse-forge-dashboard-2024`

## Endpoints

- `POST /api/analytics/events/batch` - Ingest events
- `GET /api/analytics/dashboard/stats` - Get dashboard data
- `GET /api/analytics/dashboard/export/runs` - CSV export
- `POST /api/analytics/demo/generate` - Generate demo data
- `DELETE /api/analytics/demo/clear` - Clear all data

## Tech Stack

- Next.js 15 + TypeScript
- Tailwind CSS + shadcn/ui
- Recharts + TanStack Query
- FastAPI + MongoDB
