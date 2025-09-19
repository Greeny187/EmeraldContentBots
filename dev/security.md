# Security

- **Auth Layer 1:** Telegram WebApp `initData` Signaturprüfung im Backend (HMAC-SHA256 mit Bot-Token).
- **Auth Layer 2:** Admin-Whitelist (`ADMIN_IDS`) – nur erlaubte User erhalten 200/OK.
- **CORS:** Frontend-Domain (GitHub Pages) whitelisten.
- **HTTPS:** Erzwingen (prod).

**Wichtig:** Niemals DB-Zugangsdaten ins Frontend legen. Alle schreibenden Aktionen nur über Admin-API.
