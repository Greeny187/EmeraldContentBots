import React, { useEffect, useState } from 'react'
import type { BotKey } from '../types'
import { listCampaigns, createCampaign, patchCampaign } from '../lib/api'

export default function AdsManager({bot}:{bot:BotKey}){
  const [items,setItems] = useState<any[]>([])
  const [loading,setLoading] = useState(false)
  const [title,setTitle] = useState('')
  const [body,setBody] = useState('')

  const load = async()=>{
    setLoading(true)
    try {
      const res = await listCampaigns(bot)
      setItems(res.items||[])
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[bot])

  const create = async()=>{
    await createCampaign(bot,{title, body_text:body, enabled:true})
    setTitle(''); setBody('')
    await load()
  }

  const toggle = async(id:number, enabled:boolean)=>{
    await patchCampaign(bot, id, {enabled:!enabled})
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-neutral-900 rounded-2xl">
        <div className="font-semibold mb-2">Neue Kampagne</div>
        <div className="flex gap-2 flex-wrap">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titel" className="px-3 py-2 rounded bg-neutral-800 border border-neutral-700" />
          <input value={body} onChange={e=>setBody(e.target.value)} placeholder="Text" className="px-3 py-2 rounded bg-neutral-800 border border-neutral-700 grow" />
          <button onClick={create} className="px-4 py-2 rounded-xl bg-emerald-600">Erstellen</button>
        </div>
      </div>
      <div className="p-4 bg-neutral-900 rounded-2xl">
        <div className="font-semibold mb-2">Kampagnen</div>
        {loading? 'Lade…' : (
          <ul className="space-y-2">
            {items.map((it:any)=>(
              <li key={it.id} className="flex justify-between items-center p-2 bg-neutral-800 rounded-xl">
                <div>
                  <div className="font-semibold">{it.title}</div>
                  <div className="opacity-70 text-sm">{it.body_text}</div>
                </div>
                <button onClick={()=>toggle(it.id, it.enabled)} className="px-3 py-1 rounded bg-neutral-700">
                  {it.enabled? 'Deaktivieren':'Aktivieren'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
