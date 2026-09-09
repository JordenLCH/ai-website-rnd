/** Headless proof. Speaks real MCP over HTTP to the POC server and asserts the four things
 *  the design rests on. No browser, no tunnel, no connector — those are the steps only a
 *  human can do, and they are not what was in doubt. */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server'

const URL_ = new URL(process.env.MCP_URL ?? 'http://127.0.0.1:8788/mcp')
let failures = 0
const check = (label: string, cond: unknown, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!cond) failures++
}
const textOf = (r: { content?: unknown[] }) => {
  const c = (r.content ?? []).find((x): x is { type: 'text'; text: string } =>
    !!x && typeof x === 'object' && (x as { type?: string }).type === 'text')
  return c ? JSON.parse(c.text) : undefined
}

const client = new Client({ name: 'poc-prove', version: '0.0.0' })
await client.connect(new StreamableHTTPClientTransport(URL_))

// 1. The app tool advertises its UI resource, which is how a host knows to render at all.
const { tools } = await client.listTools()
const preview = tools.find((t) => t.name === 'site_preview')
const uri = (preview?._meta as { ui?: { resourceUri?: string } } | undefined)?.ui?.resourceUri
  ?? (preview?._meta as Record<string, string> | undefined)?.['ui/resourceUri']
check('site_preview declares _meta.ui.resourceUri', !!uri, String(uri))
check('bundle_validate is exposed', tools.some((t) => t.name === 'bundle_validate'))

// 2. The UI resource is served over the same stateless transport the catalog already uses.
const res = await client.readResource({ uri: uri! })
const doc = res.contents[0] as { mimeType?: string; text?: string }
check('ui:// resource carries the MCP Apps mime type', doc.mimeType === RESOURCE_MIME_TYPE, String(doc.mimeType))
check('ui:// resource is a self-contained document', !!doc.text?.includes('<!doctype html>') && doc.text.length > 5_000,
  `${((doc.text?.length ?? 0) / 1024).toFixed(0)} KB`)
check('ui:// resource inlines its script (deny-by-default CSP)', !/<script[^>]+src=/.test(doc.text ?? ''))

// 3. The real validator answers over MCP — this is what replaces `npm run validate`.
const { readFileSync } = await import('node:fs')
const bundle = (c: string, f: string) => JSON.parse(readFileSync(`../../content/${c}/${f}`, 'utf8'))
const good = textOf(await client.callTool({ name: 'bundle_validate',
  arguments: { site: bundle('merryfair', 'site.json'), theme: bundle('merryfair', 'theme.json') } }))
check('valid bundle validates clean over MCP', good?.ok === true, `catalog ${good?.catalogVersion}`)

const broken = structuredClone(bundle('merryfair', 'site.json'))
broken.pages[Object.keys(broken.pages)[0]].blocks[0].type = 'NoSuchBlock'
const bad = textOf(await client.callTool({ name: 'bundle_validate',
  arguments: { site: broken, theme: bundle('merryfair', 'theme.json') } }))
/* Assert the issue is ABOUT the break. The first run passed on a pre-existing deprecation
   warning from an unrelated block, which would have gone green whatever we broke. */
const named = bad?.issues?.find((i: { message: string }) => i.message.includes('NoSuchBlock'))
check('invalid bundle is rejected, with an issue naming the break', bad?.ok === false && !!named,
  named && `${named.where}: ${named.message}`)

// 4. The catalog actually renders server-side, which is what the app displays.
const shown = textOf(await client.callTool({ name: 'site_preview', arguments: { client: 'merryfair' } }))
check('site_preview returns rendered HTML from the real catalog',
  shown?.ok === true && shown.html.includes('class="site"') && shown.html.length > 10_000,
  `${shown?.page}, ${((shown?.html?.length ?? 0) / 1024).toFixed(0)} KB HTML, ${shown?.pages?.length} pages`)
check('every page in the bundle is reachable by a second tool call', (shown?.pages?.length ?? 0) > 1,
  shown?.pages?.join(', '))
const second = textOf(await client.callTool({ name: 'site_preview',
  arguments: { client: 'merryfair', page: shown.pages[1] } }))
check('page switch round-trips (UI drives the server)', second?.page === shown.pages[1] && second.html !== shown.html)

await client.close()
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
