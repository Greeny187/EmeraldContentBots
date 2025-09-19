import React, { useEffect, useState } from 'react'
import { initTelegramUI } from './lib/auth'
import type { BotKey, OverviewStats } from './types'
import BotSwitcher from './components/BotSwitcher'
import StatsTable from './components/StatsTable'
import AdsManager from './components/AdsManager'
import ProManager from './components/ProManager'
import { fetchOverview } from './lib/api'

export default function App(){
  const [bot,setBot] = useState<BotKey>('content')
  const [tab,setTab] = useState<'overview'|'stats'|'pro'|'ads'>('overview')
  const [overview,setOverview] = useState<OverviewStats|null>(null)

  useEffect(()=>{ initTelegramUI() },[])
  useEffect(()=>{
    setOverview(null)
    fetchOverview(bot).then(setOverview).catch(()=>setOverview({
      bot_key: bot, groups_total: 0, active_today: 0, messages_today: 0, unique_users_today: 0, version: 'dev'
    }))
  },[bot])

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Emerald Dev MiniApp</h1>
        <BotSwitcher value={bot} onChange={setBot} />
      </header>

      <nav className="flex gap-2">
        {(['overview','stats','pro','ads'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-3 py-2 rounded-xl ${tab===t?'bg-emerald-600':'bg-neutral-800'}`}>
            {t.toUpperCase()}
          </button>
        ))}
      </nav>

      {tab==='overview' && (
        <div className="space-y-4">
          <StatsTable data={overview} />
          <div className="opacity-70 text-sm">Version: {overview?.version||'–'} | Bot: {overview?.bot_key}</div>
        </div>
      )}

      {tab==='pro' && <ProManager bot={bot} />}
      {tab==='ads' && <AdsManager bot={bot} />}

      {tab==='stats' && (
        <div className="opacity-70">Detailstatistiken (Gruppen/Zeiten/Features) – API anschließen.</div>
      )}
    </div>
  )
}
