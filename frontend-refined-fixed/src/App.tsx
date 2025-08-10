import React, { useState } from 'react'
import RequestPanel from './components/RequestPanel'
import ResponsePanel from './components/ResponsePanel'
import type { HttpRequestSpec } from './utils'

export default function App(){
  const [resp, setResp] = useState<any>(null)

  const send = async (spec: HttpRequestSpec) => {
    const res = await fetch('/api/send', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(spec)})
    const data = await res.json()
    setResp(data)
    return data
  }

  const downloadBinary = () => {
    if (!resp || !resp.bodyIsBinary) return
    try {
      const bytes = Uint8Array.from(atob(resp.body), c => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: 'application/octet-stream' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'response.bin'
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {}
  }

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brand">API-Testing Tools <span className="muted">· by min2h</span></div>
        <div style={{flex:1}} />
      </div>
      <div className="grid">
        <div className="col">
          <RequestPanel onSend={send} />
        </div>
        <div className="col">
          <ResponsePanel resp={resp} onDownloadBody={downloadBinary} />
        </div>
      </div>
      <footer className="note">MVP UI. 필요 시 Monaco 에디터/파일 업로드/환경변수 기능 추가 가능</footer>
    </div>
  )
}
