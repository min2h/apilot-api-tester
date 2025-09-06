import React from 'react'
import type { KV } from '../utils'

type Props = {
  rows: KV[]
  onChange: (rows: KV[]) => void
  addLabel?: string
  allowEmptyRow?: boolean
}

export default function KeyValueTable({ rows, onChange, addLabel='add', allowEmptyRow=false }: Props){
  const change = (i:number, key: keyof KV, val: string) => {
    const next = rows.slice()
    next[i] = { ...next[i], [key]: val }
    onChange(next)
  }
  const add = () => onChange([ ...rows, { name: '', value: '' } ])
  const remove = (i:number) => onChange(rows.filter((_,idx)=>idx!==i))

  return (
    <div>
      <div className="kv-head">
        <div>Name</div>
        <div>Value</div>
        <div className="ta-r">Actions</div>
      </div>
      {rows.map((r, i)=> (
        <div key={i} className="kv-row">
          <input value={r.name} placeholder="name" onChange={e=>change(i,'name',e.target.value)} />
          <input value={r.value} placeholder="value" onChange={e=>change(i,'value',e.target.value)} />
          <div className="ta-r">
            <button className="btn ghost" onClick={()=>remove(i)} title="remove">삭제</button>
          </div>
        </div>
      ))}
      <div className="mt-8">
        <button className="btn" onClick={add}>+ {addLabel}</button>
      </div>
    </div>
  )
}
