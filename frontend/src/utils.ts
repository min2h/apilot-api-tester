export type KV = { name: string; value: string }
export type BodyMode = 'none'|'json'|'form'|'raw'|'multipart'
export type HttpRequestSpec = {
  url: string
  method: string
  headers: KV[]
  queryParams: KV[]
  body: {
    mode: BodyMode
    json?: any
    form?: KV[]
    raw?: string
    rawContentType?: string
    multipart?: any[]
  }
  auth?: {
    type?: 'none'|'basic'|'bearer'
    username?: string
    password?: string
    token?: string
  }
}
export function jsonBeautify(src: string){ try{ return JSON.stringify(JSON.parse(src), null, 2) }catch{ return src } }
export function jsonMinify(src: string){ try{ return JSON.stringify(JSON.parse(src)) }catch{ return src } }
export function toCurl(req: HttpRequestSpec){
  const url = buildUrl(req.url, req.queryParams)
  const h = (req.headers||[]).filter(x=>x.name)
  const lines = [ `curl -X ${req.method} \\`, `  '${url}' \\`, ...h.map(x=>`  -H '${x.name}: ${x.value}' \\`) ]
  if (req.body?.mode === 'json' && req.body.json){
    lines.push("  -H 'Content-Type: application/json' \\")
    lines.push("  -d '" + JSON.stringify(req.body.json).replace(/'/g, "'\\''") + "'")
  } else if (req.body?.mode === 'form' && req.body.form){
    lines.push("  -H 'Content-Type: application/x-www-form-urlencoded' \\")
    const p = new URLSearchParams()
    req.body.form.forEach(it=> it.name && p.append(it.name, it.value))
    lines.push("  -d '" + p.toString().replace(/'/g, "'\\''") + "'")
  } else if (req.body?.mode === 'raw' && req.body.raw){
    lines.push("  -d '" + String(req.body.raw).replace(/'/g, "'\\''") + "'")
  }
  return lines.join('\n')
}
export function buildUrl(base: string, query: KV[]){ const s = new URLSearchParams(); (query||[]).filter(x=>x.name).forEach(x=>s.append(x.name, x.value)); const q=s.toString(); return q ? `${base}?${q}` : base }
