/** HTTP entry — the hosted form of the catalog server.
 *
 *  Stateless: a fresh McpServer and transport per request, so any number of creators can
 *  hit the same endpoint through a tunnel or a load balancer without sharing session state.
 *  The catalog is read-only, so there is nothing a request could corrupt for anyone else. */
import { createServer as createHttp, type IncomingMessage, type ServerResponse } from 'node:http'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createServer } from './mcp.ts'
import { CATALOG_VERSION } from './source.ts'

const PORT = Number(process.env.PORT ?? 8787)

/** Optional shared secret. Read-only data, so this is about keeping the catalog private
 *  rather than protecting integrity — set CATALOG_TOKEN to require it. */
const TOKEN = process.env.CATALOG_TOKEN

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (c) => { raw += c; if (raw.length > 4_000_000) reject(new Error('body too large')) })
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : undefined) } catch (e) { reject(e) } })
    req.on('error', reject)
  })
}

const send = (res: ServerResponse, code: number, body: unknown) => {
  res.writeHead(code, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

createHttp(async (req, res) => {
  // Tunnels and browser clients both preflight; allow them explicitly.
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization, mcp-session-id, mcp-protocol-version')
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id')
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)

  if (url.pathname === '/health') {
    return send(res, 200, { ok: true, name: 'blackdash-catalog', catalogVersion: CATALOG_VERSION })
  }

  if (url.pathname !== '/mcp') return send(res, 404, { error: 'not found — POST /mcp' })

  if (TOKEN && req.headers.authorization !== `Bearer ${TOKEN}`) {
    return send(res, 401, { error: 'unauthorized' })
  }

  try {
    const server = createServer()
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    res.on('close', () => { transport.close(); server.close() })
    await server.connect(transport)
    await transport.handleRequest(req, res, req.method === 'POST' ? await readBody(req) : undefined)
  } catch (err) {
    if (!res.headersSent) send(res, 500, { error: String(err) })
  }
}).listen(PORT, () => {
  console.error(`blackdash-catalog ${CATALOG_VERSION} on http://localhost:${PORT}/mcp`)
  console.error(TOKEN ? 'auth: bearer token required' : 'auth: none (set CATALOG_TOKEN to require one)')
})
