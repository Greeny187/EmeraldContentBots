# 🌿 Emerald DevDashboard - Vollständige Feature-Übersicht

## 📋 Inhaltsverzeichnis
1. [Überblick](#überblick)
2. [Features](#features)
3. [Dashboard Tabs](#dashboard-tabs)
4. [API Reference](#api-reference)
5. [Best Practices](#best-practices)

---

## Überblick

Das **Emerald DevDashboard** ist eine professionelle Admin-Plattform für die Verwaltung deines Emerald-Ökosystems mit:
- ✅ Telegram-basierter Authentifizierung
- ✅ Echtzeit-Metriken und Analytics
- ✅ Bot-Management und Health Checks
- ✅ Werbeverwaltung mit Targeting
- ✅ Token Accounting und Events
- ✅ Multi-Wallet Integration (NEAR, TON)

---

## Features

### 🔐 Authentifizierung & Sicherheit

```
┌─────────────────────────────────────┐
│  Telegram Login (OAuth 2.0)         │
├─────────────────────────────────────┤
│  ✓ Server-seitige Verifizierung     │
│  ✓ JWT Token (7 Tage gültig)        │
│  ✓ HMAC-SHA256 Signing              │
│  ✓ CORS Protection                  │
│  ✓ Role-based Access Control        │
│  ✓ Dev-Mode für Entwicklung         │
└─────────────────────────────────────┘
```

### 📊 Analytics & Metriken

```
┌──────────────────┬──────────────────┐
│  Gesamt-Nutzer   │   Werbungen      │
│      42          │    (aktiv) 8     │
├──────────────────┼──────────────────┤
│  Bots (aktiv)    │  Token Events    │
│       5          │      1,234       │
└──────────────────┴──────────────────┘
```

### 🎯 Werbenverwaltung

```
Platzierungen:
├─ Header (Oben Seite)
├─ Sidebar (Rechts)
├─ In-Bot (Inline in Bot)
├─ Story (Vollbild)
├─ Inline (Zwischen Inhalten)
├─ Banner (Horizontale Leiste)
└─ Modal (Pop-up)

Targeting:
├─ Bot-spezifisch
├─ Tier-basiert (Free/Pro/Enterprise)
├─ Zeitbasiert (Start/End Datum)
└─ Custom JSON Targeting
```

### 📈 Bot Metriken

```
Pro Bot:
├─ Online/Offline Status
├─ Health-Check Endpoints
├─ Letzter Health-Check
├─ Fehlerquote
├─ Response Zeit
└─ Activity Timeline
```

### 💎 Token Events

```
Event-Typen:
├─ Mint (Erstellung)
├─ Burn (Verbrennung)
├─ Reward (Belohnung)
├─ Fee (Gebühr)
├─ Redeem (Einlösung)
├─ Transfer (Überweisung)
├─ Stake (Staking)
└─ Unstake (Staking-Entfernung)
```

---

## Dashboard Tabs

### 1. 📊 Dashboard (Übersicht)

```
┌─ Statistiken
│  ├─ Gesamt Benutzer: 42
│  ├─ Aktive Werbungen: 8
│  ├─ Aktive Bots: 5
│  └─ Token Events: 1,234
├─ System Status
│  ├─ Last Check: vor 2 Minuten
│  └─ Health: 98% ✓
└─ Token Events (Chart)
   └─ Letzte 7 Tage Übersicht
```

**Funktionen:**
- Alle Daten aktualisieren
- Dev Panel öffnen
- Live-Statistiken

---

### 2. 🤖 Bots

```
┌─ Bot Liste (Grid View)
│  ├─ content-bot
│  │  └─ Status: Aktiv ✓ | 3 Endpoints
│  ├─ crossposter-bot
│  │  └─ Status: Aktiv ✓ | 1 Endpoint
│  └─ support-bot
│     └─ Status: Offline ✗
├─ Bot Metriken (Tabelle)
│  ├─ Endpoints: Health + Last Check
│  └─ Health Score: 85%
└─ Neuer Bot (+ Button)
   └─ Form: Name, Slug, Titel
```

**Funktionen:**
- Neue Bots hinzufügen
- Bot-Status überwachen
- Endpoint-Health prüfen
- Metriken anzeigen

---

### 3. 👥 Benutzer

```
┌─ Benutzer Tabelle
│  ├─ Avatar | Name | TG ID | Rolle | Tier | Erstellt | Aktion
│  ├─ [👤] | Andreas | 123456 | dev | pro | 2025-01-01 | [Tier ändern]
│  ├─ [👤] | User 2 | 789012 | user | free | 2025-01-05 | [Tier ändern]
│  └─ [👤] | User 3 | 345678 | mod | pro | 2025-01-10 | [Tier ändern]
└─ Tier-Dialog
   └─ Optionen: Free → Pro → Enterprise
```

**Funktionen:**
- Alle Nutzer anzeigen
- Tier pro Nutzer ändern
- Benutzer-Informationen
- Filter nach Rolle/Tier (später)

---

### 4. 📢 Werbungen

```
┌─ Neue Werbung (+ Button)
│  ├─ Name: "Summer Sale 2025"
│  ├─ Platzierung: Header
│  ├─ Inhalt: "<h2>50% OFF!</h2>"
│  ├─ Bot-Slug: content-bot (optional)
│  └─ Aktiv: ☑
├─ Werbungen Grid
│  ├─ [Sommer Promotion]
│  │  ├─ Status: Aktiv ✓
│  │  ├─ Platzierung: header
│  │  ├─ Bot: content-bot
│  │  └─ Aktionen: [Bearbeiten] [Löschen]
│  └─ [Winter Campaign]
│     └─ Status: Inaktiv ✗
└─ Performance-Tracking
   ├─ Impressionen: 1,234
   ├─ Clicks: 89
   └─ CTR: 7.2%
```

**Funktionen:**
- Werbung erstellen
- Multiple Platzierungen
- Bot-Targeting
- Zeitbasierte Kampagnen
- Performance-Tracking
- Bearbeiten/Löschen

---

### 5. 💎 Token & Events

```
┌─ Neues Event (+ Button)
│  ├─ Typ: [Mint ▼]
│  ├─ Menge: 1000.00
│  ├─ Unit: EMRLD
│  └─ Notiz: "Community Reward"
├─ Events Tabelle
│  ├─ Zeit | Typ | Menge | Unit | Notiz
│  ├─ 2025-01-15 15:30 | Reward | 100.00 | EMRLD | Daily
│  ├─ 2025-01-15 10:00 | Burn | 50.00 | EMRLD | Fee
│  └─ 2025-01-14 23:45 | Mint | 500.00 | EMRLD | Airdrop
└─ Zeitreihen Chart
   └─ Letzte 7 Tage: Mint vs Burn vs Reward
```

**Funktionen:**
- Event manuell erstellen
- Event-Historie
- Zeitreihen-Analysen
- Token-Bilanz
- Audit-Log

---

### 6. 💰 Wallets

```
┌─ NEAR Wallet
│  ├─ Account: emeraldcontent.near
│  ├─ Balanz: 150.5 NEAR
│  ├─ Locked: 0 NEAR
│  ├─ Storage: 2.5 MB
│  └─ Zahlungen: [zeige letzte 20]
├─ TON Wallet
│  ├─ Adresse: [EQBVG...Qkom-RFo2]
│  ├─ Button: [Speichern]
│  └─ Info: Verbunden ✓
└─ Watch Accounts
   ├─ NEAR: emeraldcontent.near
   └─ TON: UQBVG...
```

**Funktionen:**
- NEAR Account Overview
- TON Address Management
- Payment History
- Watch Accounts
- Balance Tracking

---

## API Reference

### Authentication Endpoints

```bash
# Telegram Login
POST /devdash/auth/telegram
Content-Type: application/json

{
  "id": 123456789,
  "auth_date": 1234567890,
  "hash": "abc123...",
  "username": "john_doe",
  "first_name": "John"
}

Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "role": "dev",
  "tier": "pro"
}
```

### Dashboard Endpoints

```bash
# Metrics Overview
GET /devdash/metrics/overview
Authorization: Bearer {token}

Response:
{
  "users_total": 42,
  "ads_active": 8,
  "bots_active": 5,
  "token_events_total": 1234
}
```

### Werbung Endpoints

```bash
# Liste Werbungen
GET /devdash/ads
GET /devdash/ads?bot_slug=content-bot

# Neue Werbung
POST /devdash/ads
{
  "name": "Summer Sale",
  "placement": "header",
  "content": "<h2>50% OFF</h2>",
  "is_active": true,
  "bot_slug": "content-bot",
  "start_at": 1705276800,
  "end_at": 1705363200
}

# Werbung aktualisieren
PUT /devdash/ads/1
{ "is_active": false }

# Werbung löschen
DELETE /devdash/ads/1
```

### Benutzer Endpoints

```bash
# Liste Benutzer
GET /devdash/users

# Tier ändern
POST /devdash/users/tier
{
  "telegram_id": 123456789,
  "tier": "pro",
  "role": "moderator"
}
```

### Token Events Endpoints

```bash
# Liste Events
GET /devdash/token-events?limit=50
GET /devdash/token-events?kind=mint&limit=20

# Neues Event
POST /devdash/token-events
{
  "kind": "mint",
  "amount": 1000,
  "unit": "EMRLD",
  "note": "Community Reward"
}
```

### Wallet Endpoints

```bash
# Wallet Übersicht
GET /devdash/wallets

# TON Address setzen
POST /devdash/wallets/ton
{ "address": "UQBVG..." }

# NEAR Account Overview
GET /devdash/wallets/near?account_id=emeraldcontent.near

# NEAR Zahlungen
GET /devdash/near/payments?account_id=emeraldcontent.near&limit=20
```

---

## Best Practices

### 1. 🔒 Sicherheit

```
✓ Verwende HTTPS in Production
✓ Setze starken SECRET_KEY (min 32 Zeichen)
✓ Limitiere ALLOWED_ORIGINS
✓ Verwende Dev-Login nur in Entwicklung
✓ Regelmäßige Backups der Datenbank
✓ Rotiere Telegram Bot Token regelmäßig
```

### 2. 📊 Analytics

```
✓ Überwache Bot-Health regelmäßig
✓ Analysiere Ad-Performance (CTR, Impressionen)
✓ Tracke Token-Events für Bilanzierung
✓ Überprüfe User-Retention (wöchentlich)
✓ Exportiere Reports für Archivierung
```

### 3. 🎯 Werbungen

```
✓ Teste Ad-Targeting vor Live-Schaltung
✓ Nutze zeitbasierte Kampagnen intelligent
✓ Monitore Impressionen und Clicks
✓ Rotiere Ads zur Vermeidung von Ad-Fatigue
✓ Nutze A/B Testing für Optimierung
```

### 4. 💰 Wallet Management

```
✓ Behalte Watch-Accounts aktuell
✓ Verifiziere NEAR/TON RPC URLs
✓ Überwache Transaktionen auf Anomalien
✓ Backup private Keys sicher
✓ Nutze Testnet für Tests
```

### 5. 🚀 Performance

```
✓ Nutze Datenbank-Indexes
✓ Connection Pooling richtig konfigurieren
✓ Cache häufige Queries
✓ Nutze Async Operations
✓ Monitore Query Performance
```

---

## Nächste Schritte

1. **Deploy das Dashboard**: Siehe [DEPLOYMENT.md](DEPLOYMENT.md)
2. **Konfiguriere Telegram Bot**: [Telegram BotFather](https://t.me/botfather)
3. **Setze API Keys**: NEAR RPC, TON API
4. **Erstelle erste Werbung**: Im "Werbungen" Tab
5. **Monitore Bot-Health**: Im "Bots" Tab
6. **Tracke Token-Events**: Im "Token & Events" Tab

---

## Support & Kontakt

- 📖 Dokumentation: Siehe README files
- 🐛 Issues/Bugs: GitHub Issues
- 💬 Community: Emerald Discord
- 📧 Email: support@emeraldcontent.com

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-15  
**Status**: Production Ready ✅
