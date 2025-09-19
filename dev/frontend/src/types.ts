export type BotKey = 'content'|'group'|'trade_api'|'dex'|'learning'|'support'|'crossposter'

export interface BotConfig {
  name: string
  baseUrl: string
}

export interface OverviewStats {
  bot_key: string
  groups_total: number
  active_today: number
  messages_today: number
  unique_users_today: number
  version: string
}

export interface GroupItem {
  chat_id: number
  title: string
  members: number
  messages_today: number
  pro_tier: 'free'|'pro'
  pro_until?: string|null
}
