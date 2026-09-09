/** POC — throwaway. Proves an MCP App can serve the real catalog and the real validator
 *  to a chat GUI, so a creator needs nothing installed.
 *
 *  Two tools:
 *    bundle_validate — the authoritative validator, reached over MCP instead of `npm run validate`
 *    site_preview    — the same, plus SSR'd HTML, rendered in-conversation by app.html
 *
 *  The page render below is a deliberate copy of platform/src/build.ts for the POC only.
 *  Production must call into that module, not duplicate it — two renderers is the exact
 *  drift this repo is organised to prevent. */
import { createServer as createHttp, type IncomingMessage } from 'node:http'
import { timingSafeEqual } from 'node:crypto'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server'
import { createElement, renderToStaticMarkup } from '@blackdash/renderer/ssr'
import { catalog } from '@blackdash/renderer/blocks'
import { validateBundle } from '@blackdash/renderer/validate-bundle'
import { CATALOG_VERSION } from '@blackdash/renderer/catalog-version'
import type { Site, Theme, Page } from '@blackdash/renderer/schema'

const PORT = Number(process.env.PORT ?? 8788)
const CONTENT = join(import.meta.dirname, '../../content')
const RENDERER = dirname(createRequire(import.meta.url).resolve('@blackdash/renderer/styles.css'))

/** Only the token-only half ships with a generated site; the preview app's own chrome does not. */
const SITE_CSS = readFileSync(join(RENDERER, 'styles.css'), 'utf8')
  .split('/* ---------- generated site: token-only from here down ---------- */')[1] ?? ''

const RESOURCE_URI = 'ui://blackdash/site-preview.html'

/** Which browser origins may talk to this endpoint — an allowlist, never a reflection of
 *  whatever Origin arrived. Reflecting it lets any page the operator has open read the whole
 *  fleet off 127.0.0.1, which is the DNS-rebind hole mcp/src/http.ts already refuses to leave
 *  open. Default covers the ext-apps basic-host only. */
const ORIGINS = new Set((process.env.POC_ORIGINS ?? 'http://localhost:8080,http://127.0.0.1:8080')
  .split(',').map((o) => o.trim()).filter(Boolean))

/** Shared key, the shape Claude's `static_headers` sends: the connector stores `Bearer <token>`
 *  and puts it on every request. Unset means open, which is fine on loopback and never behind a
 *  tunnel — hence the warning at boot rather than a silent default. */
const TOKEN = process.env.POC_TOKEN

/** Constant-time: `!==` leaks the shared prefix length through timing, and a correct
 *  comparison costs one function. */
function same(got: string | undefined, expected: string): boolean {
  const a = Buffer.from(got ?? ''), b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Accepts the key on `authorization` (as `Bearer <token>`) or on `x-api-key` / `x-auth-token`
 *  (bare). The alternatives are not decoration: when a Claude connector is configured for OAuth
 *  it owns the Authorization header and refuses to let you set one, so a shared-key server has
 *  to answer on a name OAuth does not claim. Both are pre-approved connector header names. */
function tokenOk(req: IncomingMessage): boolean {
  if (!TOKEN) return true
  const h = req.headers
  const bare = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v
  return same(bare(h.authorization), `Bearer ${TOKEN}`)
    || same(bare(h['x-api-key']), TOKEN)
    || same(bare(h['x-auth-token']), TOKEN)
}

function renderPage(page: Page, site: Site, theme: Theme, pageKey: string): string {
  const section = (b: Page['blocks'][number], key: number) => {
    const entry = catalog[b.type]
    const style = theme.sectionStyles[b.variant]
    if (!entry || !style) return null
    const parsed = entry.schema.safeParse(b.props)
    if (!parsed.success) return null
    const props = { ...(parsed.data as object), currentPage: pageKey }
    return createElement('div', { key, className: 'section', 'data-tone': style.tone, style: style.vars },
      createElement(entry.Component as never, { props, layout: style.layout }))
  }
  return renderToStaticMarkup(
    createElement('div', { className: 'site', style: theme.tokens as never }, [
      site.chrome?.header ? section(site.chrome.header, -1) : null,
      ...page.blocks.map(section),
      site.chrome?.footer ? section(site.chrome.footer, -2) : null,
    ]))
}

function readBundle(client: string) {
  /* `client` arrives from a tool call, so it is attacker-controlled the moment this is
     tunnelled. join(CONTENT, '../../somewhere') escapes the fleet directory happily, and
     any directory holding a site.json would then be readable. Match against what the
     fleet actually contains rather than trying to sanitise the string. */
  if (!readdirSync(CONTENT, { withFileTypes: true }).some((e) => e.isDirectory() && e.name === client)) {
    throw new Error(`no such client "${client}"`)
  }
  const dir = join(CONTENT, client)
  const read = (f: string) => JSON.parse(readFileSync(join(dir, f), 'utf8'))
  return {
    site: read('site.json'),
    theme: read('theme.json'),
    org: existsSync(join(dir, 'org.json')) ? read('org.json') : undefined,
  }
}

const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data) }] })

export function createServer() {
  const server = new McpServer({ name: 'blackdash-preview-poc', version: CATALOG_VERSION })

  /* What the creator's `npm run validate` did, without the install. Same module the build
     farm imports — the point of the whole exercise is that there is only ever one. */
  server.registerTool('bundle_validate', {
    title: 'Validate a bundle',
    description: 'Run the authoritative validator over a site.json / theme.json pair.',
    inputSchema: { site: z.unknown(), theme: z.unknown(), org: z.unknown().optional() },
  }, async ({ site, theme, org }) => {
    const { ok, issues, density, unverified } = validateBundle(site, theme, org)
    return json({ catalogVersion: CATALOG_VERSION, ok, issues, unverified, density: density.length })
  })

  registerAppTool(server, 'site_preview', {
    title: 'Preview a site',
    description: 'Render a bundle from the fleet in-conversation, with its validation status.',
    inputSchema: { client: z.string(), page: z.string().optional() },
    _meta: { ui: { resourceUri: RESOURCE_URI } },
  }, async ({ client, page }) => {
    const { site, theme, org } = readBundle(client)
    const v = validateBundle(site, theme, org)
    const pages = Object.keys((site as Site).pages)
    const key = page && pages.includes(page) ? page : pages[0]
    /* Render the validator's migrated copy, never the raw input — rendering the original is
       what published a footerless page once already. */
    const html = v.ok && v.site && v.theme ? renderPage(v.site.pages[key], v.site, v.theme, key) : ''
    return json({
      client, catalogVersion: CATALOG_VERSION, ok: v.ok, issues: v.issues,
      pages, page: key, html, css: SITE_CSS,
    })
  })

  registerAppResource(server, 'site-preview', RESOURCE_URI, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
    contents: [{
      uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE,
      text: readFileSync(join(import.meta.dirname, 'dist', 'app.html'), 'utf8'),
    }],
  }))

  return server
}

if (process.argv[1]?.endsWith('server.ts')) {
  createHttp(async (req, res) => {
    /* Hosts that connect from the browser (the ext-apps basic-host, and any web client)
       preflight and then send the session header. mcp/src/http.ts allows no origins by
       default, deliberately — so a web host talking to it needs CATALOG_ORIGINS set. */
    const origin = req.headers.origin
    if (origin && ORIGINS.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Access-Control-Allow-Headers', 'content-type, mcp-session-id, mcp-protocol-version, authorization, x-api-key, x-auth-token, accept')
      res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id')
    }
    if (req.method === 'OPTIONS') { res.writeHead(204).end(); return }
    if (req.method !== 'POST') { res.writeHead(405).end(); return }
    /* The moment this is behind a tunnel it is on the public internet, and it serves the whole
       fleet. Same constant-time check as mcp/src/http.ts: `!==` leaks the shared prefix length
       through timing, and a correct comparison costs one function. */
    if (!tokenOk(req)) { res.writeHead(401).end(); return }
    /* Bounded, the way mcp/src/http.ts already bounds it. An unbounded `for await` over a
       request body is a one-line memory exhaustion for anyone who can reach the port, and
       the README tells people to put this behind a tunnel. Destroy the socket rather than
       leaving the sender streaming into a request nobody is reading. */
    let raw = ''
    for await (const c of req) {
      raw += c
      if (raw.length > 4_000_000) { req.destroy(); res.writeHead(413).end(); return }
    }
    /* Stateless per request, exactly as mcp/src/http.ts already is — which is why this
       transport shape needs no change to become the real thing. */
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
    res.on('close', () => transport.close())
    await createServer().connect(transport)
    await transport.handleRequest(req, res, JSON.parse(raw))
  }).listen(PORT, () => {
    console.log(`POC MCP App server on http://127.0.0.1:${PORT}/mcp`)
    console.log(TOKEN ? 'auth: POC_TOKEN required' : 'auth: NONE — do not expose this to a tunnel')
  })
}
