import { useMemo, useState } from 'react'
import { PageView, validate } from './render'

/** Every <client>/site.json + theme.json under the content directory, discovered at build
 *  time. Adding a client is adding a folder — no import to register, nothing to edit here. */
const siteFiles = import.meta.glob('@content/*/site.json', { eager: true }) as Record<string, { default: unknown }>
const themeFiles = import.meta.glob('@content/*/theme.json', { eager: true }) as Record<string, { default: unknown }>

const keyOf = (p: string) => p.split('/').slice(-2)[0]
const sites: Record<string, unknown> = Object.fromEntries(
  Object.entries(siteFiles).map(([p, m]) => [keyOf(p), m.default]))
/* Keyed by folder, not by `theme.name`. Two clients are free to call their theme "Editorial"
   and the second one silently replaced the first in this map — the dropdown lost an entry and
   whichever site depended on it was previewed against someone else's tokens. The name is a label;
   the folder is the identity. */
const themes: Record<string, unknown> = Object.fromEntries(
  Object.entries(themeFiles).map(([p, m]) => [keyOf(p), m.default]))
const themeLabel = (k: string) => {
  const n = (themes[k] as { name?: string } | undefined)?.name
  return n && n !== k ? `${k} — ${n}` : k
}

export default function App() {
  const keys = Object.keys(sites)
  /* An empty content directory is a legitimate state — a fresh checkout, or a creator who has
     not made their first client yet. `keys[0]!` threw on it, so the preview met them with a
     blank screen and a stack trace instead of a message. */
  const [siteKey, setSiteKey] = useState(keys[0] ?? '')
  const [themeKey, setThemeKey] = useState(keys[0] ?? '')
  const [pageKey, setPageKey] = useState('home')
  /** Provenance and density are review affordances, on by default: the point of marking
   *  invented content is that a human sees it before it ships, and a toggle that defaults
   *  to off is a toggle nobody ever turns on. */
  const [flag, setFlag] = useState(true)

  /* A creator's repo holds one client, so the site and theme pickers are a fleet affordance with
     nothing to pick between — two dropdowns of one option each, taking the eye first on every
     load. Collapse to the client's name when there is only one, and keep the pickers for a repo
     that does have a fleet. */
  const single = keys.length <= 1

  const result = useMemo(() => validate(sites[siteKey], themes[themeKey]), [siteKey, themeKey])
  const errors = result.issues.filter((i) => i.severity === 'error').length
  const warnings = result.issues.filter((i) => i.severity === 'warning').length
  const pages = result.site ? Object.keys(result.site.pages) : []
  const active = pages.includes(pageKey) ? pageKey : pages[0]

  return (
    <div className="app">
      <div className="app__bar">
        <strong>preview</strong>
        {single ? (
          <span className="ctl"><b>{siteKey || 'no content'}</b>{
            /* The theme's own name still earns its place: it is the one label that says which art
               direction is on screen, and it changes under you when the theme is re-written. */
            siteKey && themes[siteKey] ? <span style={{ opacity: .6 }}>&nbsp;· {themeLabel(siteKey).replace(`${siteKey} — `, '')}</span> : null
          }</span>
        ) : (<>
          <span className="ctl">site
            <select value={siteKey} onChange={(e) => {
              const k = e.target.value
              setSiteKey(k); setPageKey('home')
              // A site's own theme shares its folder key, so switching site follows it.
              if (themes[k]) setThemeKey(k)
            }}>
              {keys.map((k) => <option key={k}>{k}</option>)}
            </select>
          </span>
          <span className="ctl">theme
            <select value={themeKey} onChange={(e) => setThemeKey(e.target.value)}>
              {Object.keys(themes).map((k) => <option key={k} value={k}>{themeLabel(k)}</option>)}
            </select>
          </span>
        </>)}
        <span className="tabs">
          {pages.map((p) => (
            <button key={p} className="tab" aria-selected={p === active} onClick={() => setPageKey(p)}>
              {result.site!.pages[p].title}
            </button>
          ))}
        </span>
        <span className="ctl">
          <label><input type="checkbox" checked={flag} onChange={(e) => setFlag(e.target.checked)} /> review marks</label>
        </span>
        <span style={{ color: errors ? '#ff9b9b' : warnings ? '#ffd08a' : '#6fbf73' }}>
          {errors ? `${errors} error(s)` : warnings ? `${warnings} warning(s)` : '✓ valid'}
          {result.unverified.length > 0 && <b style={{ color: '#e884c4' }}> · {result.unverified.length} unverified</b>}
        </span>
      </div>
      <div className="stage" data-flag={flag ? 'on' : 'off'}>
        {flag && result.issues.length > 0 && (
          <div className="issues">
            {result.issues.map((i, n) => (
              <div key={n} className={`issue--${i.severity}`}>
                {i.severity === 'error' ? '✗' : i.severity === 'warning' ? '!' : 'i'} {i.where} — {i.message}
              </div>
            ))}
          </div>
        )}
        {flag && active && (
          <div className="issues">
            {result.density.filter((d) => d.where.startsWith(`pages.${active}.`)).map((d, n) => (
              <div key={n} className={d.sparseOk ? 'issue--info' : d.words < 20 ? 'issue--warning' : 'issue--info'}>
                {d.where.split('.').slice(2).join('.')} — {d.words}w / {d.leaves} nodes / {d.images} img
                {d.sparseOk ? ' (sparse by role)' : ''}
              </div>
            ))}
          </div>
        )}
        {result.site && result.theme && active && (
          <PageView page={result.site.pages[active]} pageKey={active} chrome={result.site.chrome} theme={result.theme}
            onNavigate={(p) => setPageKey(p)} />
        )}
      </div>
    </div>
  )
}
