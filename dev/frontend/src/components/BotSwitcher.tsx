import React from 'react'
import type { BotKey } from '../types'

const bots: {key: BotKey, label: string}[] = [
  {key:'content', label:'Content'},
  {key:'group', label:'Group Manager'},
  {key:'trade_api', label:'Trading API'},
  {key:'dex', label:'DEX'},
  {key:'learning', label:'Learning'},
  {key:'support', label:'Support'},
  {key:'crossposter', label:'Crossposter'},
]

export default function BotSwitcher({value,onChange}:{value:BotKey,onChange:(k:BotKey)=>void}){
  return (
    <select className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2"
      value={value} onChange={e=>onChange(e.target.value as BotKey)}>
      {bots.map(b=><option key={b.key} value={b.key}>{b.label}</option>)}
    </select>
  )
}
