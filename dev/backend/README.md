# Emerald DevDashboard – Backend (v0.2.0)
- Per-Bot-Tabellen (Content/TradeAPI/TradeDEX/Crossposter/Learning/Support/GroupManager)
- `GET /metrics/overview`, `GET /metrics/timeseries?days=14`
- `GET/POST /settings` für Bot-/Global-Config (keine Secrets)
- Ads optional mit `bot_slug`
- Ready für Heroku + Postgres

## Init
```bash
heroku pg:psql -a <app> < backend/init_sql/001_create_all_tables.sql
```
