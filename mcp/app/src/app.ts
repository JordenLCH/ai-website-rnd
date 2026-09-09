/** The in-chat preview.
 *
 *  The loop a creator with no install needs: the real catalog renders inside the conversation and
 *  the real validator answers from the same server, without this page ever making an HTTP request
 *  of its own. Every round trip goes host-side through `callServerTool`, which is why the deny-by-
 *  default iframe CSP costs nothing here — there is no origin to allow.
 *
 *  The page is drawn from HTML the server rendered with the build farm's own `renderPage`. It is
 *  not a second renderer, and must never become one: the moment this file knows what a Hero looks
 *  like, "it looked right in the preview" and "it published wrong" become possible at once. */
import { App } from '@modelcontextprotocol/ext-apps'

type Preview = {
  client: string
  /** the migrated bundle, kept here so a page switch needs no server-side session —
   *  this server is stateless per request by design, and a preview must not change that */
  bundle?: { site: unknown; theme: unknown }
  ok: boolean
  issues: { where: string; message: string; severity: string }[]
  pages: string[]
  page: string
  html: string
  css: string
  catalogVersion: string
}

const bar = document.getElementById('bar')!
const tabs = document.getElementById('tabs')!
const stage = document.getElementById('stage')!

/* The rendered site brings the renderer's own stylesheet, which is written for a whole
   document. A shadow root is what stops it repainting the host chrome around it. */
const shadow = stage.attachShadow({ mode: 'open' })

/* Boot marker + a visible error surface. An MCP App that throws shows an empty 40px
   iframe and nothing else — no console reaches the host — so the app has to report
   its own failures or debugging is blind. */
bar.textContent = 'booting…'
addEventListener('error', (e) => { bar.textContent = `app error: ${e.message}` })
addEventListener('unhandledrejection', (e) => { bar.textContent = `app rejected: ${e.reason}` })

const app = new App({ name: 'Blackdash site preview', version: '0.0.0' })

function render(p: Preview) {
  const errs = p.issues.filter((i) => i.severity === 'error')
  bar.textContent = errs.length
    ? `${p.client} — ${errs.length} error(s): ${errs.slice(0, 2).map((i) => `${i.where} ${i.message}`).join(' · ')}`
    : `${p.client} — valid · catalog ${p.catalogVersion}`
  bar.setAttribute('data-state', errs.length ? 'error' : 'ok')

  tabs.replaceChildren(...p.pages.map((key) => {
    const b = document.createElement('button')
    b.textContent = key
    b.disabled = key === p.page
    /* A page switch is a fresh tool call, not local state — this is the round trip
       that proves the UI can drive the server rather than only display one result. */
    b.onclick = async () => {
      b.textContent = '…'
      const r = await app.callServerTool({
        name: 'site_preview',
        arguments: { site: p.bundle?.site, theme: p.bundle?.theme, page: key },
      })
      show(r as Parameters<typeof show>[0])
    }
    return b
  }))

  shadow.innerHTML = `<style>${p.css}</style>${p.html}`
}

/* The notification params ARE the CallToolResult — there is no `.result` wrapper. Reading
   one renders an empty app with no error anywhere, which is the failure mode to watch for:
   an MCP App's console does not reach the host, so a silent app has to be instrumented. */
/** The render arrives in `_meta`, not in the text content: the text content is billed into the
 *  conversation, and a page of markup per page switch is exactly the cost this preview exists to
 *  avoid. The content fallback stays for a host that does not forward `_meta`. */
const show = (params: { content?: { type: string }[]; _meta?: Record<string, unknown> }) => {
  const meta = params._meta?.blackdash as Preview | undefined
  if (meta) return render(meta)
  const text = params.content?.find((c) => c.type === 'text')
  if (text && 'text' in text) {
    const parsed = JSON.parse((text as unknown as { text: string }).text)
    if (parsed.html !== undefined) render(parsed)
    else bar.textContent = `${(parsed.errors ?? []).length} error(s) — nothing to draw`
  }
}
app.addEventListener('toolresult', show)

app.connect().then(() => { if (bar.textContent === 'booting…') bar.textContent = 'connected, waiting for tool result…' })
