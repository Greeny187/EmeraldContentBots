-- ============================================================================
-- Emerald DevDashboard Database Migrations
-- ============================================================================

-- ============================================================================
-- Users & Authentication
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_users (
    telegram_id BIGINT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    photo_url TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    tier TEXT NOT NULL DEFAULT 'free',
    ton_address TEXT,
    near_account_id TEXT,
    near_public_key TEXT,
    near_connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_users_tier ON dashboard_users(tier);
CREATE INDEX IF NOT EXISTS idx_dashboard_users_role ON dashboard_users(role);

-- ============================================================================
-- Bots & Infrastructure
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_bots (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    title TEXT,
    env_token_key TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_bots_active ON dashboard_bots(is_active);
CREATE INDEX IF NOT EXISTS idx_dashboard_bots_username ON dashboard_bots(username);

CREATE TABLE IF NOT EXISTS dashboard_bot_endpoints (
    id BIGSERIAL PRIMARY KEY,
    bot_username TEXT NOT NULL REFERENCES dashboard_bots(username) ON DELETE CASCADE,
    base_url TEXT NOT NULL,
    api_key TEXT,
    metrics_path TEXT NOT NULL DEFAULT '/internal/metrics',
    health_path TEXT NOT NULL DEFAULT '/internal/health',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(bot_username, base_url)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_bot_endpoints_bot ON dashboard_bot_endpoints(bot_username);

-- ============================================================================
-- Advertisements (Werbungen)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_ads (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    placement TEXT NOT NULL CHECK (placement IN ('header', 'sidebar', 'in-bot', 'story', 'inline', 'banner', 'modal')),
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    targeting JSONB NOT NULL DEFAULT '{}'::jsonb,
    bot_slug TEXT,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_ads_active ON dashboard_ads(is_active);
CREATE INDEX IF NOT EXISTS idx_dashboard_ads_bot_slug ON dashboard_ads(bot_slug);
CREATE INDEX IF NOT EXISTS idx_dashboard_ads_placement ON dashboard_ads(placement);
CREATE INDEX IF NOT EXISTS idx_dashboard_ads_dates ON dashboard_ads(start_at, end_at);

-- ============================================================================
-- Token Accounting & Events
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_token_events (
    id BIGSERIAL PRIMARY KEY,
    happened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    kind TEXT NOT NULL CHECK (kind IN ('mint', 'burn', 'reward', 'fee', 'redeem', 'manual', 'transfer', 'stake', 'unstake')),
    amount NUMERIC(36, 18) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'EMRLD',
    actor_telegram_id BIGINT,
    ref JSONB NOT NULL DEFAULT '{}'::jsonb,
    note TEXT,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_token_events_kind ON dashboard_token_events(kind);
CREATE INDEX IF NOT EXISTS idx_dashboard_token_events_actor ON dashboard_token_events(actor_telegram_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_token_events_date ON dashboard_token_events(happened_at);

-- ============================================================================
-- Feature Flags & Settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_feature_flags (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    near_watch_account TEXT,
    ton_address TEXT,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Watched Accounts (Wallets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_watch_accounts (
    id BIGSERIAL PRIMARY KEY,
    chain TEXT NOT NULL CHECK (chain IN ('near', 'ton', 'ethereum')),
    account_id TEXT NOT NULL,
    label TEXT,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    balance NUMERIC(36, 18),
    last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(chain, account_id)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_watch_accounts_chain ON dashboard_watch_accounts(chain);

-- ============================================================================
-- Nonces for Sign-In Challenges
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_nonces (
    telegram_id BIGINT NOT NULL,
    nonce BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(telegram_id)
);

-- ============================================================================
-- Ad Performance Tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_ad_events (
    id BIGSERIAL PRIMARY KEY,
    ad_id BIGINT NOT NULL REFERENCES dashboard_ads(id) ON DELETE CASCADE,
    telegram_id BIGINT REFERENCES dashboard_users(telegram_id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'view')),
    bot_username TEXT,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_ad_events_ad ON dashboard_ad_events(ad_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_ad_events_user ON dashboard_ad_events(telegram_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_ad_events_type ON dashboard_ad_events(event_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_ad_events_bot ON dashboard_ad_events(bot_username);
CREATE INDEX IF NOT EXISTS idx_dashboard_ad_events_date ON dashboard_ad_events(created_at);

-- ============================================================================
-- Audit Log
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_audit_log (
    id BIGSERIAL PRIMARY KEY,
    actor_telegram_id BIGINT REFERENCES dashboard_users(telegram_id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id BIGINT,
    changes JSONB NOT NULL DEFAULT '{}'::jsonb,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_audit_actor ON dashboard_audit_log(actor_telegram_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_audit_action ON dashboard_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_dashboard_audit_date ON dashboard_audit_log(created_at);

-- ============================================================================
-- Initialize Default Settings
-- ============================================================================
INSERT INTO dashboard_settings (id, near_watch_account, ton_address)
VALUES (1, 'emeraldcontent.near', 'UQBVG-RRn7l5QZkfS4yhy8M3yhu-uniUrJc4Uy4Qkom-RFo2')
ON CONFLICT (id) DO UPDATE
SET near_watch_account = EXCLUDED.near_watch_account,
    ton_address = EXCLUDED.ton_address,
    updated_at = NOW();

-- Initialize Watch Accounts
INSERT INTO dashboard_watch_accounts (chain, account_id, label)
VALUES 
    ('near', 'emeraldcontent.near', 'Main Wallet'),
    ('ton', 'UQBVG-RRn7l5QZkfS4yhy8M3yhu-uniUrJc4Uy4Qkom-RFo2', 'Main TON Wallet')
ON CONFLICT (chain, account_id) DO NOTHING;

-- ============================================================================
-- Grants & Permissions (for multi-tenant support in future)
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
