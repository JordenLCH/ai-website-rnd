import { useMemo, useState } from 'react'
import { PageView, validate } from './render'

/** Every <client>/site.json + theme.json under the content directory, discovered at build
 *  time. Adding a client is adding a folder — no import to register, nothing to edit here. */
const siteFiles = import.meta.glob('@content/*/site.json', { eager: true }) as Record<string, { default: unknown }>
const themeFiles = import.meta.glob('@content/*/theme.json', { eager: true }) as Record<string, { default: unknown }>

const keyOf = (p: string) => p.split('/').slice(-2)[0]
const sites: Record<string, unknown> = Object.fromEntries(
  Object.entries(siteFiles).map(([p, m]) => [keyOf(p), m.default]))
const themes: Record<string, unknown> = Object.fromEntries(
  Object.entries(themeFiles).map(([p, m]) => [(m.default as { name?: string }).name ?? keyOf(p), m.default]))

export default function App() {
  const keys = Object.keys(sites)
  const [siteKey, setSiteKey] = useState(keys[0])
  const [themeKey, setThemeKey] = useState(
    (themeFiles[`${Object.keys(siteFiles).find((p) => keyOf(p) === keys[0])!.replace('site.json', 'theme.json')}`]
      ?.default as { name?: string })?.name ?? Object.keys(themes)[0])
  const [pageKey, setPageKey] = useState('home')
  /** Provenance and density are review affordances, on by default: the point of marking
   *  invented content is that a human sees it before it ships, and a toggle that defaults
   *  to off is a toggle nobody ever turns on. */
  const [flag, setFlag] = useState(true)

  const result = useMemo(() => validate(sites[siteKey], themes[themeKey]), [siteKey, themeKey])
  const errors = result.issues.filter((i) => i.severity === 'error').length
  const warnings = result.issues.filter((i) => i.severity === 'warning').length
  const pages = result.site ? Object.keys(result.site.pages) : []
  const active = pages.includes(pageKey) ? pageKey : pages[0]

  return (
    <div className="app">
      <div className="app__bar">
        <strong>preview</strong>
        <span className="ctl">site
          <select value={siteKey} onChange={(e) => {
            const k = e.target.value
            setSiteKey(k); setPageKey('home')
            const t = (themeFiles[Object.keys(siteFiles).find((p) => keyOf(p) === k)!.replace('site.json', 'theme.json')]
              ?.default as { name?: string })?.name
            if (t && themes[t]) setThemeKey(t)
          }}>
            {keys.map((k) => <option key={k}>{k}</option>)}
          </select>
        </span>
        <span className="ctl">theme
          <select value={themeKey} onChange={(e) => setThemeKey(e.target.value)}>
            {Object.keys(themes).map((k) => <option key={k}>{k}</option>)}
          </select>
        </span>
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
          <PageView page={result.site.pages[active]} chrome={result.site.chrome} theme={result.theme}
            onNavigate={(p) => setPageKey(p)} />
        )}
      </div>
    </div>
  )
}
