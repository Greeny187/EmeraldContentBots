# Emerald Ökosystem – Dev MiniApp (Shared)

**Hosting:** GitHub Pages (static)  
**Backends:** vorhandene Heroku-Bot-Instanzen (je Bot) – Admin-API-Router wird in jeden Bot eingebunden.  
**Auth:** Telegram WebApp Signaturprüfung im Backend (Admin-IDs Whitelist).  
**Scope:** Alle Bots, alle bisherigen Dev-Features (Stats, PRO, Ads, Logs/DB-Infos), gruppiert nach Bot/Gruppe/User.

## Struktur

```
dev-miniapp/
├─ frontend/            # React + Vite + Tailwind; als Telegram Web App; auf GitHub Pages hostbar
├─ backend/             # FastAPI Router (admin_api.py), der in JEDEN Bot (Heroku) gemountet wird
├─ shared/
│  ├─ sql/migration.sql # bot_key-Dimension & Indizes
│  └─ python/           # Patch-Snippets für ads.py, payments.py, devmenu.py
├─ config/example.env   # Beispiel-Umgebungsvariablen
├─ deploy/github-pages.md
└─ security.md
```

## Schnellstart

1) **DB-Migration** auf *jeder* Bot-Datenbank ausführen: `shared/sql/migration.sql`  
2) **Backend-Router** in *jeden* Bot integrieren (Heroku): `backend/admin_api.py` mounten, Admin-IDs setzen.  
3) **Frontend**: In `frontend/public/config.json` die Bot-URLs auf eure Heroku-Instanzen setzen.  
4) **Deploy** Frontend auf GitHub Pages (siehe `deploy/github-pages.md`).  
5) **Telegram**: In der Website/MiniApp-URL den Pfad zu GitHub Pages hinterlegen.

## Hinweis
- Frontend ruft ausschließlich die Admin-APIs eurer Bots auf (read/write). Keine DB-Credentials im Client.
- Admin-API prüft Telegram WebApp Signatur *und* Admin-Whitelist.
