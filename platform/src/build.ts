/** The build farm, in miniature: bundle in, deployable static site out.
 *
 *  Runs after upload, on the platform — creators never do this. It renders the same React
 *  catalog the preview uses, so what a creator saw is what ships, and derives every SEO /
 *  AEO / GEO artifact from the content tree rather than from markup. */
import { mkdirSync, writeFileSync, readFileSync, cpSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { catalog } from '../../renderer/src/blocks/index'
import { validateBundle } from '../../renderer/src/validate-bundle'
import type { Site, Theme, Page } from '../../renderer/src/schema'
import { jsonLd, metaFor, sitemap, robots, llmsTxt, type Org } from './seo'

const here = dirname(fileURLToPath(import.meta.url))
const RENDERER = join(here, '..', '..', 'renderer', 'src')

const FONTS =
  'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700;800&family=Barlow+Condensed:wght@400;500;600;700' +
  '&family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500' +
  '&family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,700&family=Inter:wght@400;500;600&display=swap'

/** Reveal + parallax, inlined. Same contract as the preview: data attributes drive it,
 *  and reduced-motion users simply get the finished state. */
const MOTION_JS = `
(()=>{const R=matchMedia('(prefers-reduced-motion: reduce)').matches;
const els=[...document.querySelectorAll('[data-motion]')];
if(R){els.forEach(e=>e.dataset.inview='true')}else{
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.dataset.inview='true';io.unobserve(e.target)}}),{rootMargin:'0px 0px -12% 0px',threshold:.08});
els.forEach(e=>io.observe(e));
const p=[...document.querySelectorAll('[data-parallax]')];let f=0;
const on=()=>{if(f)return;f=requestAnimationFrame(()=>{f=0;const h=innerHeight;
for(const e of p){const r=e.getBoundingClientRect();const g=(r.top+r.height/2)/h-.5;
e.style.setProperty('--parallax-y',(-g*parseFloat(e.dataset.parallax)*100).toFixed(2)+'px')}})};
addEventListener('scroll',on,{passive:true});addEventListener('resize',on,{passive:true});on()}})();`

function renderPage(page: Page, site: Site, theme: Theme) {
  const section = (b: Page['blocks'][number], key: number) => {
    const entry = catalog[b.type]
    const style = theme.sectionStyles[b.variant]
    if (!entry || !style) return null
    const parsed = entry.schema.safeParse(b.props)
    if (!parsed.success) return null
    return createElement('div', { key, className: 'section', 'data-tone': style.tone, style: style.vars },
      createElement(entry.Component as never, { props: parsed.data, layout: style.layout }))
  }
  const children = [
    site.chrome?.header ? section(site.chrome.header, -1) : null,
    ...page.blocks.map(section),
    site.chrome?.footer ? section(site.chrome.footer, -2) : null,
  ]
  return renderToStaticMarkup(
    createElement('div', { className: 'site', style: theme.tokens as never }, children))
}

export function buildSite(site: Site, theme: Theme, org: Org, outDir: string,
  opts: { allowUnverified?: boolean } = {}) {
  const { ok, issues, unverified } = validateBundle(site, theme)
  if (!ok) return { ok: false as const, issues, written: [] as string[] }

  /** The generator is allowed to compose plausible copy so a page arrives whole rather than
   *  as a skeleton — but the human review pass is what makes that safe, and a gate nobody
   *  can skip by forgetting is the only kind that holds. Override is deliberate and named. */
  if (unverified.length && !opts.allowUnverified) {
    return {
      ok: false as const,
      issues: [...issues, {
        where: 'site',
        message: `${unverified.length} unverified section(s) — ${unverified.slice(0, 5).join(', ')}${unverified.length > 5 ? ', …' : ''}. Confirm or correct them, or rebuild with --allow-unverified`,
        severity: 'error' as const,
      }],
      written: [] as string[],
    }
  }

  const css = readFileSync(join(RENDERER, 'styles.css'), 'utf8')
    // the preview's own chrome never ships
    .split('/* ---------- generated site: token-only from here down ---------- */')[1] ?? ''

  const written: string[] = []
  mkdirSync(outDir, { recursive: true })

  for (const [key, page] of Object.entries(site.pages)) {
    const meta = metaFor(site, key, org)
    const ld = jsonLd(site, key, org)
    const body = renderPage(page, site, theme)
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.title}</title>
<meta name="description" content="${meta.description.replace(/"/g, '&quot;')}">
<link rel="canonical" href="${meta.canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.description.replace(/"/g, '&quot;')}">
${meta.ogImage ? `<meta property="og:image" content="${meta.ogImage}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>*{box-sizing:border-box}body{margin:0}${css}</style>
<script type="application/ld+json">${JSON.stringify(ld[0])}</script>
</head>
<body>${body}<script>${MOTION_JS}</script></body>
</html>`
    const path = key === 'home' ? join(outDir, 'index.html') : join(outDir, key, 'index.html')
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, html)
    written.push(path)
  }

  for (const [name, content] of [
    ['sitemap.xml', sitemap(site, org)],
    ['robots.txt', robots(org)],
    ['llms.txt', llmsTxt(site, org)],
  ] as const) {
    writeFileSync(join(outDir, name), content)
    written.push(join(outDir, name))
  }

  const assets = join(RENDERER, '..', 'public', 'img')
  if (existsSync(assets)) cpSync(assets, join(outDir, 'img'), { recursive: true })

  return { ok: true as const, issues, written }
}
