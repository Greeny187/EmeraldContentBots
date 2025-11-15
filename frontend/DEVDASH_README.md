# 🌿 Emerald DevDashboard

Ein umfassendes Admin-Dashboard zur Verwaltung deines Emerald-Ökosystems mit Telegram-Authentifizierung, Bot-Verwaltung, Werbeverwaltung und Wallet-Integration.

## Features

### 🔐 Authentifizierung
- **Telegram Login**: Sichere Authentifizierung via Telegram
- **JWT Tokens**: Langlebige Sessions
- **Dev-Mode**: Schneller Test-Login für Entwicklung

### 📊 Dashboard
- **Echtzeitmetriken**: Benutzer, Bots, Werbungen, Token-Events
- **Token Events**: Übersicht aller Minting, Burns, Rewards
- **System Status**: Health-Checks und Bot-Metriken

### 🤖 Bot-Management
- Liste aller Bots mit Status
- Health-Check Endpoints pro Bot
- Detaillierte Metriken
- Bot-Erstellung über UI

### 👥 Benutzer-Verwaltung
- Alle Dashboard-Nutzer anzeigen
- Tier-System (Free, Pro, Enterprise)
- Role-Management
- Benutzer-Informationen und Wallets

### 📢 Werbeverwaltung
- **Mehrere Platzierungen**: Header, Sidebar, In-Bot, Story, Inline, Banner, Modal
- **Targeting**: Bot-spezifische Werbungen
- **Zeitbasierte Kampagnen**: Start/End Datumserstellung
- **Performance Tracking**: Impressionen und Clicks
- **CRUD Operationen**: Erstellen, Bearbeiten, Löschen

### 💎 Token Accounting
- Manuelles Event-Tracking (Mint, Burn, Reward, Fee, etc.)
- Zeitreihen-Analysen
- Token-Bewegungsverfolgung
- Audit-Log für Transparenz

### 💰 Wallet Integration
- **NEAR Wallet**: Account Overview und Payments
- **TON Wallet**: Address Management
- Watch-Accounts für beide Blockchains
- Payment-History

## Technologie-Stack

### Backend
- **Framework**: aiohttp (Python)
- **Database**: PostgreSQL
- **Auth**: JWT + Telegram OAuth
- **API**: RESTful

### Frontend
- **HTML5**: Moderne semantische Struktur
- **CSS3**: Gradient-Design mit Glasmorphism
- **JavaScript (ES6+)**: App-Logik
- **TonConnect UI**: TON Wallet Integration

## Installation

### 1. Backend Setup

```bash
# Python Dependencies installieren
pip install aiohttp psycopg-pool python-dotenv

# Datenbank-Migrations ausführen
psql -U postgres -d your_db_name -f backend/init_sql/002_devdash_migrations.sql
```

### 2. Environment Variablen

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/emerald_content

# Telegram
BOT1_TOKEN=your_telegram_bot_token
BOT_USERNAME=YourBotUsername
DEV_LOGIN_CODE=your_dev_code_for_testing

# JWT
SECRET_KEY=your_secret_key_min_32_chars

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://another-domain.com

# NEAR Config
NEAR_NETWORK=mainnet
NEAR_RPC_URL=https://rpc.mainnet.near.org

# TON Config
TON_API_BASE=https://tonapi.io
TON_API_KEY=your_ton_api_key
```

### 3. Frontend Setup

```bash
# HTML/JS Datei in deinen Web-Root kopieren
cp frontend/devdash.html /var/www/html/
cp frontend/devdash.js /var/www/html/

# In index.html oder bestehender Page einbinden:
<a href="/devdash.html">DevDashboard</a>
```

## API Endpoints

### Authentication
- `POST /devdash/auth/telegram` - Telegram Login
- `POST /devdash/dev-login` - Dev-Mode Login
- `GET /devdash/auth/check` - Token Verification

### Dashboard
- `GET /devdash/me` - Aktuelle User Info
- `GET /devdash/metrics/overview` - Gesamt-Übersicht
- `GET /devdash/metrics/timeseries` - Zeitreihen

### Bots
- `GET /devdash/bots` - Bot-Liste
- `POST /devdash/bots` - Neuer Bot
- `GET /devdash/bots/metrics` - Bot-Metriken
- `GET /devdash/bots/endpoints` - Health-Check Endpoints

### Werbungen
- `GET /devdash/ads` - Werbungen auflisten
- `POST /devdash/ads` - Neue Werbung
- `PUT /devdash/ads/{id}` - Werbung aktualisieren
- `DELETE /devdash/ads/{id}` - Werbung löschen

### Benutzer
- `GET /devdash/users` - Alle Benutzer
- `POST /devdash/users/tier` - Tier ändern

### Token Events
- `GET /devdash/token-events` - Events auflisten
- `POST /devdash/token-events` - Neues Event

### Wallets
- `GET /devdash/wallets` - Wallet-Übersicht
- `GET /devdash/wallets/near` - NEAR Account Overview
- `POST /devdash/wallets/near` - NEAR Account setzen
- `GET /devdash/near/payments` - NEAR Zahlungen
- `POST /devdash/wallets/ton` - TON Address setzen

## Datenbank Schema

### Haupttabellen

```sql
-- Benutzer
dashboard_users
├── telegram_id (PK)
├── username, first_name, last_name
├── role, tier
├── ton_address, near_account_id
└── timestamps

-- Bots
dashboard_bots
├── id (PK)
├── username (unique)
├── title, env_token_key
├── is_active, meta
└── timestamps

-- Werbungen
dashboard_ads
├── id (PK)
├── name, placement, content
├── is_active, start_at, end_at
├── targeting, bot_slug
├── impressions, clicks
└── timestamps

-- Token Events
dashboard_token_events
├── id (PK)
├── happened_at
├── kind (mint, burn, reward, ...)
├── amount, unit
├── actor_telegram_id
├── ref, note
└── meta

-- Watch Accounts
dashboard_watch_accounts
├── id (PK)
├── chain (near, ton)
├── account_id
├── balance, last_updated
└── timestamps

-- Ad Events (Tracking)
dashboard_ad_events
├── id (PK)
├── ad_id → dashboard_ads
├── telegram_id → dashboard_users
├── event_type (impression, click, view)
├── bot_username
└── timestamps
```

## Verwendung

### 1. Login
```javascript
// Telegram-Button wird automatisch geladen
// Nach Login wird JWT Token gespeichert und Dashboard angezeigt
```

### 2. Dashboard-Tabs
- **Dashboard**: Übersicht und Statistiken
- **Bots**: Bot-Verwaltung und Metriken
- **Benutzer**: User-Management und Tier-Anpassung
- **Werbungen**: Ad-Erstellung und Management
- **Token & Events**: Accounting und Event-Tracking
- **Wallets**: NEAR/TON Integration

### 3. Werbung erstellen

```javascript
// Im Frontend: "Werbung erstellen" Form ausfüllen
{
  name: "Sommer Promotion",
  placement: "header",
  content: "<h2>Bis zu 50% Rabatt!</h2>",
  bot_slug: "content-bot",
  is_active: true,
  targeting: { tier: "free" }
}
```

### 4. Benutzer-Tier ändern

```javascript
// Im Frontend: Benutzer → Tier ändern
{
  telegram_id: 123456789,
  tier: "pro",
  role: "moderator"
}
```

## Admin Funktionen (Dev Panel)

```javascript
// Dev-Mode Zugriff mit Code:
POST /devdash/dev-login
{
  "code": "your_dev_code",
  "telegram_id": 123456789,
  "username": "admin"
}
```

## Sicherheit

- ✅ **Telegram Verification**: Alle Auth-Daten werden server-seitig verifiziert
- ✅ **JWT Tokens**: 7 Tage Gültigkeit mit Signatur
- ✅ **CORS**: Nur erlaubte Origins
- ✅ **Prepared Statements**: SQL-Injection Schutz
- ✅ **Role-Based Access**: User/Admin/Dev Rollen
- ✅ **HTTPS Required**: Production-Only

## Performance

- 🚀 **PostgreSQL Indexes**: Optimierte Queries
- 🚀 **Connection Pooling**: Min 1, Max 5 Connections
- 🚀 **Async/Await**: Non-blocking I/O
- 🚀 **JSON Caching**: Memo Optimization

## Troubleshooting

### Token Invalid
```
→ localStorage.removeItem('emerald_devdash_token')
→ Browser Cache leeren
→ Neu anmelden
```

### Ads not showing
```
→ Überprüfe `is_active` Flag
→ Überprüfe start_at/end_at Daten
→ Überprüfe bot_slug Targeting
```

### NEAR/TON Connection Failed
```
→ API Keys in .env prüfen
→ RPC URL Erreichbarkeit prüfen
→ Network Configuration (mainnet/testnet)
```

## Erweiterungen (Geplant)

- [ ] Dark/Light Mode Toggle
- [ ] Advanced Analytics & Charts
- [ ] Ad Performance Reports
- [ ] A/B Testing für Ads
- [ ] User Segmentation
- [ ] Webhook Integration
- [ ] Multi-Language Support
- [ ] 2FA für Admin
- [ ] Notification System
- [ ] Export/Import Features

## Support & Contributing

Bei Fragen oder Fehlern bitte ein Issue erstellen oder zum Emerald Team kontaktieren.

---

**Made with 🌿 for Emerald Community**
