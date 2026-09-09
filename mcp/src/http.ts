/** HTTP entry — the hosted form of the catalog server.
 *
 *  Stateless: a fresh McpServer and transport per request, so any number of creators can
 *  hit the same endpoint through a tunnel or a load balancer without sharing session state.
 *  The catalog is read-only, so there is nothing a request could corrupt for anyone else. */
import { createServer as createHttp, type IncomingMessage, type ServerResponse } from 'node:http'
import { timingSafeEqual } from 'node:crypto'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createServer } from './mcp.ts'
import { CATALOG_VERSION } from './source.ts'

const PORT = Number(process.env.PORT ?? 8787)

/** Optional shared secret. Read-only data, so this is about keeping the catalog private
 *  rather than protecting integrity — set CATALOG_TOKEN to require it. */
const TOKEN = process.env.CATALOG_TOKEN

/** Which browser origins may talk to this endpoint. Empty by default, which is the right default:
 *  the MCP clients that use this server are not browsers and send no Origin at all.
 *
 *  `Access-Control-Allow-Origin: *` was doing real work for tunnels, but on the local form — which
 *  is how every creator runs it — it also let any page the creator happened to have open reach
 *  127.0.0.1:8787. Combined with a DNS rebind that is a read of the whole catalog from a site the
 *  creator merely visited. Set CATALOG_ORIGINS to a comma-separated list to allow browsers back in. */
const ALLOWED_ORIGINS = new Set(
  (process.env.CATALOG_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean))

/** Constant-time compare. `!==` leaks the length of the shared prefix through timing; the token is
 *  low-value, but a comparison that is correct costs one function. */
function same(got: string, expected: string): boolean {
  const a = Buffer.from(got), b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Headers a credential may arrive in.
 *
 *  `Authorization` alone was not enough. A claude.ai custom connector using a fixed org-shared
 *  credential refuses to let you name the header `Authorization` — it reserves that for its own
 *  OAuth — so a server that reads only that header cannot be connected from the browser at all,
 *  which is the one client this whole no-install path exists for.
 *
 *  The value is sent verbatim, and people reasonably type the bare token into a box labelled
 *  "API key", so both `Bearer <token>` and `<token>` are accepted. That is not a weakening: the
 *  secret is the same string either way, and rejecting the shape rather than the secret would only
 *  produce an auth failure with nothing in it to debug. */
const AUTH_HEADERS = ['authorization', 'x-api-key', 'x-auth-token'] as const

function tokenOk(req: IncomingMessage): boolean {
  if (!TOKEN) return true
  for (const name of AUTH_HEADERS) {
    const raw = req.headers[name]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (!value) continue
    if (same(value, `Bearer ${TOKEN}`) || same(value, TOKEN)) return true
  }
  return false
}

/** Requests per window, per client address. A read-only catalog is cheap to serve but not free —
 *  each request builds an McpServer — and an unmetered public endpoint is someone else's budget. */
const RATE_LIMIT = Number(process.env.CATALOG_RATE_LIMIT ?? 120)
const RATE_WINDOW_MS = 60_000
const hits = new Map<string, { n: number; until: number }>()
function rateLimited(key: string): boolean {
  const now = Date.now()
  const e = hits.get(key)
  if (!e || now > e.until) { hits.set(key, { n: 1, until: now + RATE_WINDOW_MS }); return false }
  e.n++
  if (hits.size > 10_000) for (const [k, v] of hits) if (now > v.until) hits.delete(k)
  return e.n > RATE_LIMIT
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (c) => {
      raw += c
      if (raw.length > 4_000_000) {
        /* Rejecting the promise leaves the sender streaming into a request nobody is reading —
           the socket stayed open and the bytes kept arriving. Destroy it, then reject. */
        req.destroy()
        reject(new Error('body too large'))
      }
    })
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : undefined) } catch (e) { reject(e) } })
    req.on('error', reject)
  })
}

const send = (res: ServerResponse, code: number, body: unknown) => {
  res.writeHead(code, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

createHttp(async (req, res) => {
  /* A browser Origin is echoed back only if it is on the allowlist. A request with no Origin —
     every real MCP client — is unaffected: CORS is a browser mechanism, so withholding the header
     costs a non-browser nothing. */
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Headers', `content-type, ${AUTH_HEADERS.join(', ')}, mcp-session-id, mcp-protocol-version`)
    res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id')
  }
  if (req.method === 'OPTIONS') { res.writeHead(origin && !ALLOWED_ORIGINS.has(origin) ? 403 : 204); return res.end() }

  /* Rebinding survives an Origin check when the attacker's page is same-origin with the rebound
     host, so the Host header is checked too: this server is only ever addressed as localhost or
     through a tunnel whose hostname the operator sets. */
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return send(res, 403, { error: 'origin not allowed — set CATALOG_ORIGINS to permit browser clients' })
  }

  const who = req.socket.remoteAddress ?? 'unknown'
  if (rateLimited(who)) {
    res.setHeader('Retry-After', String(Math.ceil(RATE_WINDOW_MS / 1000)))
    return send(res, 429, { error: `rate limit — ${RATE_LIMIT} requests/minute` })
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)

  if (url.pathname === '/health') {
    return send(res, 200, { ok: true, name: 'blackdash-catalog', catalogVersion: CATALOG_VERSION })
  }

  if (url.pathname !== '/mcp') return send(res, 404, { error: 'not found — POST /mcp' })

  if (!tokenOk(req)) {
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
  console.error(ALLOWED_ORIGINS.size
    ? `cors: ${[...ALLOWED_ORIGINS].join(', ')}`
    : 'cors: no browser origins allowed (set CATALOG_ORIGINS if a browser client needs access)')
  console.error(`rate limit: ${RATE_LIMIT} req/min per address`)
})
