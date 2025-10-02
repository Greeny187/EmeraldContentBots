-- Core tables for the DevDashboard
create table if not exists dashboard_users (
  telegram_id bigint primary key,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  role text not null default 'dev', -- 'dev' | 'admin' | 'viewer'
  tier text not null default 'pro', -- 'free' | 'pro'
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
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists dashboard_feature_flags (
  key text primary key,
  value jsonb not null,
  description text
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

-- Optional generic metrics table (bots can write here via CRON/ETL if desired)
create table if not exists bot_metrics (
  metric_date date not null,
  metric_key text not null,
  metric_value bigint not null default 0,
  primary key(metric_date, metric_key)
);
