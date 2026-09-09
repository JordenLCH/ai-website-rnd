/** POC MCP App UI — throwaway.
 *
 *  Proves the loop a creator with no install needs: the real catalog renders inside the
 *  conversation, and the real validator answers from the same server, without the page
 *  ever making an HTTP request of its own. Every round trip goes host-side through
 *  callServerTool, which is why no CSP origin and no CORS entry are needed here. */
import { App } from '@modelcontextprotocol/ext-apps'

type Preview = {
  client: string
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
      const r = await app.callServerTool({ name: 'site_preview', arguments: { client: p.client, page: key } })
      const text = r.content?.find((c) => c.type === 'text')
      if (text && 'text' in text) render(JSON.parse(text.text as string))
    }
    return b
  }))

  shadow.innerHTML = `<style>${p.css}</style>${p.html}`
}

/* The notification params ARE the CallToolResult — there is no `.result` wrapper. Reading
   one renders an empty app with no error anywhere, which is the failure mode to watch for:
   an MCP App's console does not reach the host, so a silent app has to be instrumented. */
const show = (params: { content?: { type: string }[] }) => {
  const text = params.content?.find((c) => c.type === 'text')
  if (text && 'text' in text) render(JSON.parse((text as unknown as { text: string }).text))
}
app.addEventListener('toolresult', show)

app.connect().then(() => { if (bar.textContent === 'booting…') bar.textContent = 'connected, waiting for tool result…' })
