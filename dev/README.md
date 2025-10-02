# Emerald Ökosystem – DevDashboard (Extended v0.2)

Frontend: statisch (Tailwind + Chart.js + Telegram Login Widget)
Backend: FastAPI, asyncpg, JWT, CORS (Heroku-ready)
DB: Postgres-Tabellen pro Bot + Meta-Tabellen

## Quick Start
1) Backend deployen, `.env` setzen, SQL ausführen:
   ```bash
   heroku pg:psql -a <app> < backend/init_sql/001_create_all_tables.sql
   ```
2) Frontend `API_BASE` & `BOT_USERNAME` setzen, GitHub Pages aktivieren
3) Telegram-Login → Überblick, Metriken, Bots, Pro/Free, Werbung, Flags, Settings
