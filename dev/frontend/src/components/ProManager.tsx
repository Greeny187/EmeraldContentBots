import React, { useEffect, useState } from 'react'
import type { BotKey, GroupItem } from '../types'
import { fetchGroups, proSet } from '../lib/api'
import GroupTable from './GroupTable'

export default function ProManager({bot}:{bot:BotKey}){
  const [items,setItems] = useState<GroupItem[]>([])
  const [q,setQ] = useState('')
  const [page,setPage] = useState(1)

  async function load(){
    const res = await fetchGroups(bot, page, q)
    setItems(res.items||[])
  }
  useEffect(()=>{ load() },[bot,page,q])

  const onPro = async (chat_id:number)=>{
    const until = new Date(Date.now()+30*24*3600*1000).toISOString()
    await proSet(bot, chat_id, until, 'pro')
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Suche…" className="px-3 py-2 rounded bg-neutral-800 border border-neutral-700 grow" />
      </div>
      <GroupTable items={items} onPro={onPro} />
      <div className="flex gap-2 justify-end">
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 rounded bg-neutral-800">Zurück</button>
        <button onClick={()=>setPage(p=>p+1)} className="px-3 py-1 rounded bg-neutral-800">Weiter</button>
      </div>
    </div>
  )
}
