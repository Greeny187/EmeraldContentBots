import React from 'react'
import type { OverviewStats } from '../types'

export default function StatsTable({data}:{data:OverviewStats|null}){
  if(!data) return <div className="opacity-70">Lade Übersicht…</div>
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="p-4 bg-neutral-900 rounded-2xl shadow">Gruppen total<br/><b className="text-xl">{data.groups_total}</b></div>
      <div className="p-4 bg-neutral-900 rounded-2xl shadow">Aktiv heute<br/><b className="text-xl">{data.active_today}</b></div>
      <div className="p-4 bg-neutral-900 rounded-2xl shadow">Msgs heute<br/><b className="text-xl">{data.messages_today}</b></div>
      <div className="p-4 bg-neutral-900 rounded-2xl shadow">Unique User heute<br/><b className="text-xl">{data.unique_users_today}</b></div>
    </div>
  )
}
