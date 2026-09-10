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
   *  this server is stateless per request by design, and a preview must not change that.
   *  Only used when there's no draftId: a draft-backed preview switches tabs by id instead,
   *  so the whole bundle isn't resent on every click. */
  bundle?: { site: unknown; theme: unknown }
  /** present when this preview came from a bundle_put draft — carried forward so a tab switch
   *  can ask for it by id instead of resending site+theme inline. */
  draftId?: string
  ok: boolean
  issues: { where: string; message: string; severity: string }[]
  pages: string[]
  page: string
  html: string
  css: string
  catalogVersion: string
}

/* Client-side only: a blob: URL needs no network request, so it doesn't touch the deny-by-default
 * CSP this app runs under, and nothing here is sent back to the server — the bundle's props still
 * say `/img/<client>/...`, unchanged. This is a proofing aid, not an upload path: the real images
 * still go through bundle_publish's browser upload step, which is the only place a file persists.
 * Told plainly, or someone drops thirty photos in here expecting them saved and loses all of it the
 * moment the tab closes — this server holds nothing past the request, same as everywhere else. */
const DROPZONE_CSS = `
img.bd-broken{cursor:pointer;outline:2px dashed currentColor;outline-offset:-2px;filter:opacity(.55)}
img.bd-broken.bd-drag{outline-color:#4a90e2;filter:opacity(.85)}
`

/* `error` fires asynchronously (even a same-origin 404 takes at least a task), so the count of
 * broken images isn't known at the moment `render` returns — the bar updates itself as each one
 * actually fails, rather than pretending to know up front. */
function wireImageFallback(root: ShadowRoot, onBroken: () => void) {
  root.querySelectorAll('img').forEach((el) => {
    const img = el as HTMLImageElement
    if (img.complete && img.naturalWidth > 0) return
    img.addEventListener('error', () => { armDropTarget(img); onBroken() }, { once: true })
  })
}

function armDropTarget(img: HTMLImageElement) {
  img.classList.add('bd-broken')
  img.title = 'preview only, not saved here — drop or click a local file to see it in this layout; ' +
    'the real image still has to be uploaded at publish'
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.style.display = 'none'
  img.insertAdjacentElement('afterend', input)
  const use = (file?: File | null) => {
    if (!file) return
    img.src = URL.createObjectURL(file)
    img.classList.remove('bd-broken', 'bd-drag')
    input.remove()
  }
  img.addEventListener('click', () => input.click())
  input.addEventListener('change', () => use(input.files?.[0]))
  img.addEventListener('dragover', (e) => { e.preventDefault(); img.classList.add('bd-drag') })
  img.addEventListener('dragleave', () => img.classList.remove('bd-drag'))
  img.addEventListener('drop', (e) => {
    e.preventDefault()
    use(e.dataTransfer?.files?.[0])
  })
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
  const summary = errs.length
    ? `${p.client} — ${errs.length} error(s): ${errs.slice(0, 2).map((i) => `${i.where} ${i.message}`).join(' · ')}`
    : `${p.client} — valid · catalog ${p.catalogVersion}`
  bar.textContent = summary
  bar.setAttribute('data-state', errs.length ? 'error' : 'ok')

  tabs.replaceChildren(...p.pages.map((key) => {
    const b = document.createElement('button')
    b.textContent = key
    b.disabled = key === p.page
    /* A page switch is a fresh tool call, not local state — this is the round trip
       that proves the UI can drive the server rather than only display one result.
       Reuse the draftId when there is one: the point of a draft is that switching
       tabs costs a page key, not the ~25 KB bundle it was already holding. */
    b.onclick = async () => {
      b.textContent = '…'
      const r = await app.callServerTool({
        name: 'site_preview',
        arguments: p.draftId
          ? { draftId: p.draftId, page: key }
          : { site: p.bundle?.site, theme: p.bundle?.theme, page: key },
      })
      show(r as Parameters<typeof show>[0])
    }
    return b
  }))

  shadow.innerHTML = `<style>${p.css}${DROPZONE_CSS}</style>${p.html}`
  let broken = 0
  wireImageFallback(shadow, () => {
    broken++
    bar.textContent = `${summary} · ${broken} image(s) not loaded here — click/drop a local file to ` +
      `preview it, upload for real at publish`
  })
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
