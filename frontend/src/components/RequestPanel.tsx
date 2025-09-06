import React, { useEffect, useMemo, useState } from 'react'
import KeyValueTable from './KeyValueTable'
import { jsonBeautify, jsonMinify, toCurl, type KV, type HttpRequestSpec, type BodyMode } from '../utils'

const METHODS = ['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'] as const

type Props = { onSend: (spec: HttpRequestSpec) => Promise<any> }

export default function RequestPanel({ onSend }: Props){
  const [method, setMethod] = useState<typeof METHODS[number]>('GET')
  const [url, setUrl] = useState('https://httpbin.org/get')
  const [headers, setHeaders] = useState<KV[]>([{ name:'Accept', value:'application/json' }])
  const [query, setQuery] = useState<KV[]>([{ name:'', value:'' }])

  const [bodyMode, setBodyMode] = useState<BodyMode>('none')
  const [bodyJson, setBodyJson] = useState(() => JSON.stringify({ a: 1 }, null, 2))
  const [bodyRaw, setBodyRaw] = useState('')
  const [bodyForm, setBodyForm] = useState<KV[]>([{ name:'', value:'' }])

  const [authType, setAuthType] = useState<'none'|'basic'|'bearer'>('none')
  const [basicUser, setBasicUser] = useState('')
  const [basicPass, setBasicPass] = useState('')
  const [bearer, setBearer] = useState('')

  const [tab, setTab] = useState<'params'|'headers'|'body'|'auth'|'docs'>('params')
  const [sending, setSending] = useState(false)

  useEffect(()=>{
    // restore last request
    const s = localStorage.getItem('pl:lastReq')
    if (s) {
      try {
        const o = JSON.parse(s)
        setMethod(o.method || 'GET')
        setUrl(o.url || '')
        setHeaders(o.headers || [])
        setQuery(o.queryParams || [])
        setBodyMode(o.body?.mode || 'none')
        if (o.body?.json) setBodyJson(JSON.stringify(o.body.json, null, 2))
        if (o.body?.raw) setBodyRaw(o.body.raw)
        if (o.body?.form) setBodyForm(o.body.form)
        if (o.auth?.type) setAuthType(o.auth.type)
        if (o.auth?.username) setBasicUser(o.auth.username)
        if (o.auth?.password) setBasicPass(o.auth.password)
        if (o.auth?.token) setBearer(o.auth.token)
      } catch {}
    }
  }, [])

  const spec = useMemo<HttpRequestSpec>(()=>{
    const base:any = {
      url, method,
      headers: headers.filter(x=>x.name),
      queryParams: query.filter(x=>x.name),
      body: { mode: bodyMode },
      auth: { type: authType, username: basicUser, password: basicPass, token: bearer }
    }
    if (bodyMode==='json') { try{ base.body.json = JSON.parse(bodyJson||'{}') }catch{} }
    if (bodyMode==='raw')  { base.body.raw = bodyRaw; base.body.rawContentType = 'text/plain' }
    if (bodyMode==='form') { base.body.form = bodyForm.filter(x=>x.name) }
    return base
  }, [url, method, headers, query, bodyMode, bodyJson, bodyRaw, bodyForm, authType, basicUser, basicPass, bearer])

  const curl = useMemo(()=> toCurl(spec), [spec])

  const doSend = async () => {
    setSending(true)
    try{
      localStorage.setItem('pl:lastReq', JSON.stringify(spec))
      return await onSend(spec)
    } finally {
      setSending(false)
    }
  }

  const exportReq = () => {
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `request-${new Date().toISOString().replace(/[:.]/g,'_')}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importReq = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const o = JSON.parse(String(reader.result))
        // simple mapper
        setMethod(o.method || 'GET')
        setUrl(o.url || '')
        setHeaders(o.headers || [])
        setQuery(o.queryParams || [])
        setBodyMode(o.body?.mode || 'none')
        setBodyJson(o.body?.json ? JSON.stringify(o.body.json, null, 2) : '{}')
        setBodyRaw(o.body?.raw || '')
        setBodyForm(o.body?.form || [{name:'', value:''}])
        setAuthType(o.auth?.type || 'none')
        setBasicUser(o.auth?.username || '')
        setBasicPass(o.auth?.password || '')
        setBearer(o.auth?.token || '')
      } catch (e) {
        alert('잘못된 요청 파일')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="col">
      <div className="card">
        <div className="card-h">
          <div className="card-title">Request</div>
          <div className="actions">
            <select className="method" value={method} onChange={e=>setMethod(e.target.value as any)}>
              {METHODS.map(m=> <option key={m} value={m}>{m}</option>)}
            </select>
            <input className="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." />
            <button className="btn primary" onClick={doSend} disabled={sending}>{sending?'Sending…':'Send'}</button>
          </div>
        </div>
        <div className="card-b">
          <div className="tabs">
            {(['params','headers','body','auth','docs'] as const).map(t=> (
              <button key={t} className={"tab" + (tab===t?' active':'')} onClick={()=>setTab(t)}>{t.toUpperCase()}</button>
            ))}
          </div>

          {tab==='params' && (
            <>
              <div className="hint">URL에 자동 반영됩니다.</div>
              <KeyValueTable rows={query} onChange={setQuery} addLabel="param" />
            </>
          )}

          {tab==='headers' && (
            <>
              <div className="hint">추가/삭제 가능. 중복 키는 서버별 정책에 따라 병합될 수 있습니다.</div>
              <KeyValueTable rows={headers} onChange={setHeaders} addLabel="header" />
            </>
          )}

          {tab==='body' && (
            <>
              <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
                <div className="seg">
                  {(['none','json','form','raw'] as BodyMode[]).map(m=> (
                    <label key={m} className={"seg-item" + (bodyMode===m?' on':'')}>
                      <input type="radio" name="bodyMode" value={m} checked={bodyMode===m} onChange={()=>setBodyMode(m)} />
                      {m}
                    </label>
                  ))}
                </div>
                {bodyMode==='json' && (
                  <div className="btnrow" style={{display:'flex', gap:8}}>
                    <button className="btn ghost" onClick={()=>setBodyJson(jsonBeautify(bodyJson))}>Beautify</button>
                    <button className="btn ghost" onClick={()=>setBodyJson(jsonMinify(bodyJson))}>Minify</button>
                  </div>
                )}
              </div>

              {bodyMode==='json' && (<textarea className="textarea" value={bodyJson} onChange={e=>setBodyJson(e.target.value)} />)}
              {bodyMode==='raw'  && (<textarea className="textarea" value={bodyRaw} onChange={e=>setBodyRaw(e.target.value)} />)}
              {bodyMode==='form' && (<KeyValueTable rows={bodyForm} onChange={setBodyForm} addLabel="field" />)}
              {bodyMode==='none' && (<div className="placeholder">바디 없음</div>)}
            </>
          )}

          {tab==='auth' && (
            <>
              <div className="seg">
                {(['none','basic','bearer'] as const).map(m=> (
                  <label key={m} className={"seg-item" + (authType===m?' on':'')}>
                    <input type="radio" name="authType" value={m} checked={authType===m} onChange={()=>setAuthType(m)} />
                    {m}
                  </label>
                ))}
              </div>
              {authType==='basic' && (
                <div className="two" style={{marginTop:8}}>
                  <input placeholder="username" value={basicUser} onChange={e=>setBasicUser(e.target.value)} />
                  <input type="password" placeholder="password" value={basicPass} onChange={e=>setBasicPass(e.target.value)} />
                </div>
              )}
              {authType==='bearer' && (
                <div className="two" style={{marginTop:8}}>
                  <input placeholder="token" value={bearer} onChange={e=>setBearer(e.target.value)} />
                </div>
              )}
            </>
          )}

          {tab==='docs' && (
            <>
              <div className="hint">cURL로 복사하여 공유할 수 있습니다.</div>
              <div className="copyrow">
                <div className="small">Preview cURL</div>
                <div style={{display:'flex', gap:8}}>
                  <button className="btn ghost" onClick={()=>navigator.clipboard.writeText(curl)}>Copy</button>
                  <label className="btn ghost" style={{cursor:'pointer'}}>
                    Import
                    <input type="file" accept="application/json" style={{display:'none'}} onChange={e=>{ const f=e.target.files?.[0]; if(f) importReq(f) }} />
                  </label>
                  <button className="btn ghost" onClick={exportReq}>Export</button>
                </div>
              </div>
              <pre className="code">{curl}</pre>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
