/** Proof that the catalog server does what the no-install flow needs: validates a real bundle
 *  over MCP with the same validator the farm runs, and serves a preview app that renders through
 *  the farm's own renderPage. Headless — adding the connector is the one step only a person can do.
 *
 *  Run: `npm run http` in one shell, `npm run prove` in another. */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { FLEET } from './source.ts'

const URL_ = new URL(process.env.MCP_URL ?? 'http://127.0.0.1:8787/mcp')
const TOKEN = process.env.CATALOG_TOKEN ?? (existsSync('.catalog-token') ? readFileSync('.catalog-token', 'utf8').trim() : '')

let failures = 0
const check = (label: string, cond: unknown, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!cond) failures++
}
const textOf = (r: { content?: unknown[] }) => {
  const c = (r.content ?? []).find((x): x is { type: 'text'; text: string } =>
    !!x && typeof x === 'object' && (x as { type?: string }).type === 'text')
  return c ? c.text : ''
}

const client = new Client({ name: 'catalog-prove', version: '0.0.0' })
await client.connect(new StreamableHTTPClientTransport(URL_, {
  requestInit: TOKEN ? { headers: { authorization: `Bearer ${TOKEN}` } } : undefined,
}))

const { tools } = await client.listTools()
check('bundle_validate is exposed', tools.some((t) => t.name === 'bundle_validate'))
const preview = tools.find((t) => t.name === 'site_preview')
const uri = (preview?._meta as { ui?: { resourceUri?: string } } | undefined)?.ui?.resourceUri
check('site_preview declares its UI resource', !!uri, String(uri))

const res = await client.readResource({ uri: uri! })
const doc = res.contents[0] as { mimeType?: string; text?: string }
check('the UI resource carries the MCP Apps mime type', doc.mimeType === 'text/html;profile=mcp-app', String(doc.mimeType))
check('the UI is built and self-contained', !!doc.text && doc.text.length > 50_000 && !/<script[^>]+src=/.test(doc.text),
  `${((doc.text?.length ?? 0) / 1024).toFixed(0)} KB`)

const bundle = (f: string) => JSON.parse(readFileSync(join(FLEET, 'merryfair', f), 'utf8'))
const site = bundle('site.json'), theme = bundle('theme.json')
const org = existsSync(join(FLEET, 'merryfair', 'org.json')) ? bundle('org.json') : undefined

const good = JSON.parse(textOf(await client.callTool({ name: 'bundle_validate', arguments: { site, theme, org } })))
check('a real bundle validates clean over MCP', good.ok === true, `catalog ${good.catalogVersion}, ${good.warnings.length} warning(s)`)

const broken = structuredClone(site)
broken.pages[Object.keys(broken.pages)[0]].blocks[0].type = 'NoSuchBlock'
const bad = JSON.parse(textOf(await client.callTool({ name: 'bundle_validate', arguments: { site: broken, theme } })))
const named = bad.errors?.find((e: { message: string }) => e.message.includes('NoSuchBlock'))
check('a broken bundle is refused, with an error naming the break', bad.ok === false && !!named,
  named && `${named.where}: ${named.message}`)

type Payload = { html: string; css: string; pages: string[]; page: string; bundle?: unknown }
/** Either carrier is correct — the app reads `_meta` first and falls back to the content. */
const payloadOf = (r: { content?: unknown[]; _meta?: { blackdash?: Payload } }): Payload | undefined =>
  r._meta?.blackdash ?? (textOf(r) ? JSON.parse(textOf(r)) as Payload : undefined)

const shown = await client.callTool({ name: 'site_preview', arguments: { site, theme, org } })
const m = payloadOf(shown as Parameters<typeof payloadOf>[0])
check('site_preview renders through the build farm renderer', !!m?.html?.includes('class="site"'),
  `${((m?.html?.length ?? 0) / 1024).toFixed(0)} KB HTML, ${m?.pages?.length} pages`)
check('the app is handed the bundle, so a page switch needs no server session', !!m?.bundle)
check('the theme stylesheet travels with the render', (m?.css?.length ?? 0) > 1000)

const second = payloadOf(await client.callTool({
  name: 'site_preview', arguments: { site, theme, org, page: m!.pages[1] },
}) as Parameters<typeof payloadOf>[0])
check('another page can be asked for', second?.page === m!.pages[1] && second?.html !== m!.html)

/* Publishing. Skipped rather than failed when no hosting server is configured: the catalog server
   is useful, and correct, with the write path switched off — that is why the store lives on the
   other side. When it *is* configured these run against the real endpoints, because the thing
   worth proving is the seam between the two repos, and a stub of the far side proves nothing
   about the seam. */
if (!process.env.SITE_HOSTING_URL || !process.env.SITE_HOSTING_KEY) {
  console.log('SKIP  publishing — set SITE_HOSTING_URL and SITE_HOSTING_KEY to prove the upload path')
} else {
  const HOST = process.env.SITE_HOSTING_URL.replace(/\/+$/, '')
  const DOMAIN = process.env.PROVE_DOMAIN ?? 'prove-publish.example'
  const call = async (name: string, args: Record<string, unknown>) =>
    JSON.parse(textOf(await client.callTool({ name, arguments: args })))

  /* Start clean: a leftover draft from an interrupted run would make every check below pass for
     the wrong reason. */
  await call('bundle_discard', { domain: DOMAIN })

  const noOrg = await call('bundle_publish', { domain: DOMAIN, site, theme })
  check('publishing without org.json is refused', noOrg.ok === false && /org\.json/.test(noOrg.error))

  const draft = await call('bundle_publish', { domain: DOMAIN, site, theme, org })
  check('a valid bundle reaches hosting and comes back with an upload link',
    draft.ok === true && /^[0-9a-f]{32}$/.test(draft.code ?? '') && String(draft.uploadUrl).endsWith(draft.code),
    `${draft.expected?.length} picture(s) expected`)
  check('the pictures it asks for are the ones the props name',
    draft.expected?.length > 0 && draft.missing?.length === draft.expected.length)

  const status = await call('bundle_status', { domain: DOMAIN })
  check('the draft can be read back by domain', status.ok === true && status.code === draft.code)

  const refused = await fetch(`${HOST}/api/bundle/${draft.code}/publish`, { method: 'POST' })
  check('publishing an incomplete site is refused, not built with a hole in it',
    refused.status === 409, `HTTP ${refused.status}`)

  const first = draft.expected[0] as string
  const form = new FormData()
  form.append('file', new File([new Uint8Array([1, 2, 3, 4])], first, { type: 'image/webp' }), first)
  form.append('name', first)
  const up = await fetch(`${HOST}/api/bundle/${draft.code}/assets`, { method: 'POST', body: form })
  const upJson = await up.json() as { uploaded?: string[]; missing?: string[]; error?: string }
  check('a picture uploads from the browser half and shortens the missing list',
    up.status === 201 && upJson.uploaded?.includes(first) && upJson.missing?.length === draft.expected.length - 1,
    upJson.error ?? `${upJson.missing?.length} left`)

  const wrongName = new FormData()
  wrongName.append('file', new File([new Uint8Array([1])], 'not-referenced.webp', { type: 'image/webp' }))
  wrongName.append('name', 'not-referenced.webp')
  const rejected = await fetch(`${HOST}/api/bundle/${draft.code}/assets`, { method: 'POST', body: wrongName })
  check('a picture the site never referenced is refused', rejected.status === 400, `HTTP ${rejected.status}`)

  const anon = await fetch(`${HOST}/api/bundle?domain=${DOMAIN}`)
  check('the machine door needs the key', anon.status === 401, `HTTP ${anon.status}`)

  const gone = await call('bundle_discard', { domain: DOMAIN })
  check('a draft can be withdrawn, pictures and all', gone.ok === true && gone.status === 'discarded')
  const after = await call('bundle_status', { domain: DOMAIN })
  check('and is then gone', after.ok === false)
}

await client.close()
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
