import type { BotKey, BotConfig, OverviewStats, GroupItem } from '../types'

const cfg: Record<BotKey, BotConfig> = await fetch('./config.json').then(r=>r.json()).then(j=>j.bots)

// Telegram init data header
function initDataHeader(): HeadersInit {
  // @ts-ignore
  const initData = window?.Telegram?.WebApp?.initData || ''
  return { 'x-telegram-init-data': initData }
}

export async function fetchOverview(bot: BotKey): Promise<OverviewStats> {
  const url = cfg[bot].baseUrl + '/stats/overview'
  const res = await fetch(url, { headers: initDataHeader() })
  if(!res.ok) throw new Error('Overview error '+res.status)
  return res.json()
}

export async function fetchGroups(bot: BotKey, page=1, q=''): Promise<{page:number, items: GroupItem[]}> {
  const url = new URL(cfg[bot].baseUrl + '/stats/groups')
  url.searchParams.set('page', String(page))
  if(q) url.searchParams.set('q', q)
  const res = await fetch(url, { headers: initDataHeader() })
  if(!res.ok) throw new Error('Groups error '+res.status)
  return res.json()
}

export async function proSet(bot: BotKey, chat_id: number, until?: string, tier='pro') {
  const url = cfg[bot].baseUrl + '/pro/set'
  const res = await fetch(url, {
    method:'POST',
    headers: { 'Content-Type':'application/json', ...initDataHeader() },
    body: JSON.stringify({chat_id, until, tier})
  })
  if(!res.ok) throw new Error('PRO set error '+res.status)
  return res.json()
}

export async function listCampaigns(bot: BotKey) {
  const url = cfg[bot].baseUrl + '/ads/campaigns'
  const res = await fetch(url, { headers: initDataHeader() })
  if(!res.ok) throw new Error('Ads list error '+res.status)
  return res.json()
}

export async function createCampaign(bot: BotKey, payload: any) {
  const url = cfg[bot].baseUrl + '/ads/campaigns'
  const res = await fetch(url, {
    method:'POST', headers: {'Content-Type':'application/json', ...initDataHeader()}, body: JSON.stringify(payload)
  })
  if(!res.ok) throw new Error('Ads create error '+res.status)
  return res.json()
}

export async function patchCampaign(bot: BotKey, id: number, payload: any) {
  const url = cfg[bot].baseUrl + `/ads/campaigns/${id}`
  const res = await fetch(url, {
    method:'PATCH', headers: {'Content-Type':'application/json', ...initDataHeader()}, body: JSON.stringify(payload)
  })
  if(!res.ok) throw new Error('Ads patch error '+res.status)
  return res.json()
}
