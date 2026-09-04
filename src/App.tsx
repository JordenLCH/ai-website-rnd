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

  const result = useMemo(() => validate(sites[siteKey], themes[themeKey]), [siteKey, themeKey])
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
        <span style={{ color: result.issues.length ? '#ff9b9b' : '#6fbf73' }}>
          {result.issues.length ? `${result.issues.length} issue(s)` : '✓ valid'}
        </span>
      </div>
      <div className="stage">
        {result.issues.length > 0 && (
          <div className="issues">{result.issues.map((i, n) => <div key={n}>✗ {i.where} — {i.message}</div>)}</div>
        )}
        {result.site && result.theme && active && (
          <PageView page={result.site.pages[active]} chrome={result.site.chrome} theme={result.theme}
            onNavigate={(p) => setPageKey(p)} />
        )}
      </div>
    </div>
  )
}
