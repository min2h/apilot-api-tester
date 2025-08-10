import React from 'react'

type Props = {
  resp: any
  onDownloadBody?: () => void
}

export default function ResponsePanel({ resp, onDownloadBody }: Props){
  if (!resp) return (
    <div className="card">
      <div className="card-h"><div className="card-title">Response</div></div>
      <div className="card-b"><div className="placeholder">응답 없음</div></div>
    </div>
  )

  const isErr = typeof resp.status === 'number' ? resp.status >= 400 : false

  return (
    <div className="card">
      <div className="card-h">
        <div className="card-title">Response</div>
      </div>
      <div className="card-b">
        <div className="resp-status">
          <span className={"badge " + (isErr? 'err':'ok')}> {resp.status == 200? '' : resp.status} {resp.statusText || ''}</span>
          <span className="small">{resp.durationMs} ms · {resp.sizeBytes} B</span>
        </div>

        <hr className="sep" />

        <div className="small">Headers</div>
        <table className="header">
          <thead><tr><th>Name</th><th>Value</th></tr></thead>
          <tbody>
          {(resp.headers||[]).map((h:any,idx:number)=> (
            <tr key={idx}><td>{h.name}</td><td>{h.value}</td></tr>
          ))}
          </tbody>
        </table>

        <hr className="sep" />

        <div className="copyrow">
          <div className="small">Body</div>
          {!resp.bodyIsBinary && <button className="btn ghost" onClick={()=>navigator.clipboard.writeText(resp.body || '')}>Copy</button>}
          {resp.bodyIsBinary && <button className="btn ghost" onClick={onDownloadBody}>Download</button>}
        </div>
        <pre className="code" style={{maxHeight:420, whiteSpace:'pre-wrap'}}>
          {resp.bodyIsBinary ? '[binary base64]' : (tryPrettify(resp.body))}
        </pre>
      </div>
    </div>
  )
}

function tryPrettify(body: string){
  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return String(body||'')
  }
}
