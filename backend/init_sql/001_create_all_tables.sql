-- Core tables and per-bot tables
create table if not exists dashboard_users (
  telegram_id bigint primary key,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  role text not null default 'dev',
  tier text not null default 'pro',
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists dashboard_bots (
  id serial primary key,
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists dashboard_ads (
  id serial primary key,
  name text not null,
  placement text not null check (placement in ('header','sidebar','in-bot','story','inline')),
  content text not null,
  is_active boolean not null default true,
  start_at timestamp,
  end_at timestamp,
  targeting jsonb not null default '{}'::jsonb,
  bot_slug text,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists dashboard_feature_flags (
  key text primary key,
  value jsonb not null,
  description text
);

create table if not exists dashboard_settings (
  scope text not null,
  key text not null,
  value jsonb not null,
  primary key(scope, key)
);

create table if not exists bot_metrics (
  metric_date date not null,
  metric_key text not null,
  metric_value bigint not null default 0,
  primary key(metric_date, metric_key)
);

create table if not exists content_bot_messages (
  id bigserial primary key,
  user_id bigint not null,
  chat_id bigint,
  msg_type text,
  created_at timestamp not null default now()
);

create table if not exists trade_api_orders (
  id bigserial primary key,
  user_id bigint,
  exchange text,
  market_type text,
  symbol text,
  side text,
  qty numeric,
  status text,
  created_at timestamp not null default now()
);

create table if not exists trade_dex_swaps (
  id bigserial primary key,
  user_id bigint,
  chain text,
  dex text,
  token_in text,
  token_out text,
  amount_in numeric,
  tx_hash text,
  created_at timestamp not null default now()
);

create table if not exists crossposter_posts (
  id bigserial primary key,
  user_id bigint,
  platform text,
  status text,
  created_at timestamp not null default now()
);

create table if not exists learning_sessions (
  id bigserial primary key,
  user_id bigint,
  course text,
  action text,
  duration_min int,
  created_at timestamp not null default now()
);

create table if not exists support_tickets (
  id bigserial primary key,
  user_id bigint,
  channel text,
  status text,
  created_at timestamp not null default now()
);

create table if not exists group_manager_events (
  id bigserial primary key,
  group_id bigint,
  user_id bigint,
  event_type text,
  created_at timestamp not null default now()
);

create index if not exists idx_cbm_created on content_bot_messages (created_at);
create index if not exists idx_tao_created on trade_api_orders (created_at);
create index if not exists idx_tds_created on trade_dex_swaps (created_at);
create index if not exists idx_cp_created on crossposter_posts (created_at);
create index if not exists idx_ls_created on learning_sessions (created_at);
create index if not exists idx_st_created on support_tickets (created_at);
create index if not exists idx_gm_created on group_manager_events (created_at);
