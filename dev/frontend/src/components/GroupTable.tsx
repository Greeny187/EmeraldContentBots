import React from 'react'
import type { GroupItem } from '../types'

export default function GroupTable({items,onPro}:{items:GroupItem[],onPro:(chat_id:number)=>void}){
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b border-neutral-800">
            <th className="py-2 pr-4">Gruppe</th>
            <th className="py-2 pr-4">Mitglieder</th>
            <th className="py-2 pr-4">Msgs (heute)</th>
            <th className="py-2 pr-4">PRO</th>
            <th className="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          {items.map(it=>(
            <tr key={it.chat_id} className="border-b border-neutral-900">
              <td className="py-2 pr-4">{it.title} <span className="opacity-60">({it.chat_id})</span></td>
              <td className="py-2 pr-4">{it.members}</td>
              <td className="py-2 pr-4">{it.messages_today}</td>
              <td className="py-2 pr-4">{it.pro_tier}{it.pro_until?` bis ${new Date(it.pro_until).toLocaleDateString()}:''}`:''}</td>
              <td className="py-2 pr-4">
                {it.pro_tier==='free' && <button onClick={()=>onPro(it.chat_id)} className="px-3 py-1 rounded-lg bg-emerald-600">+30 Tage PRO</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
