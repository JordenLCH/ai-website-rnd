/** The build farm, in miniature: bundle in, deployable static site out.
 *
 *  Runs after upload, on the platform — creators never do this. It renders the same React
 *  catalog the preview uses, so what a creator saw is what ships, and derives every SEO /
 *  AEO / GEO artifact from the content tree rather than from markup. */
import { mkdirSync, writeFileSync, readFileSync, cpSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'
// Both come from the renderer's install, never platform's — see renderer/src/ssr.ts. Importing
// react-dom/server directly here silently gives the blocks a second React and breaks every hook.
//
// By package name, not by relative path. `../../renderer/src/…` meant the farm could not be
// deployed without the sibling checkout at exactly that path, and that it built against whatever
// catalog happened to be on disk — so rebuilding a two-year-old bundle silently used today's
// blocks. The dependency is declared in package.json and can therefore be pinned per build.
import { createElement, renderToStaticMarkup } from '@blackdash/renderer/ssr'
import { catalog } from '@blackdash/renderer/blocks'
import { validateBundle } from '@blackdash/renderer/validate-bundle'
import type { Site, Theme, Page } from '@blackdash/renderer/schema'
import { jsonLd, metaFor, sitemap, sitemapManifest, robots, llmsTxt, type Org } from './seo'
import { fontsHref } from '@blackdash/renderer/fonts'
import { imageFitIssues } from './image-fit'

/** Resolved through the package, so it follows the installed dependency rather than a guess about
 *  where the checkout sits. */
const RENDERER = dirname(createRequire(import.meta.url).resolve('@blackdash/renderer/styles.css'))

const FONTS = fontsHref()

/** Everything below the <body> goes through React, which escapes it. The document head does not:
 *  it is assembled by string interpolation, and every value in it — title, description, canonical,
 *  og:image — is derived from `site.json`, which is model-generated, human-edited, and uploaded
 *  from a machine the platform does not control. A hero title containing `"><script>` broke out of
 *  an attribute and ran on the client's own domain.
 *
 *  Escapes the full five rather than the three that "look" needed: an unescaped `'` is exploitable
 *  the moment an attribute is single-quoted, which is a one-character edit away in any future line. */
function escapeHtml(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** Every Carousel is emitted with `init="false"` so that the preview's React effect and this
 *  script are the only two things that ever start one — a Swiper that self-starts on connect
 *  reads its attributes before React has finished setting them. DOMContentLoaded fires after
 *  the deferred bundle has run, so the custom element is defined by the time this looks. */
const CAROUSEL_JS = `addEventListener('DOMContentLoaded',function(){document.querySelectorAll('swiper-container[init="false"]').forEach(function(e){e.initialize&&e.initialize()})})`

/** JSON-LD sits in a <script>, so it is not HTML-escaped — the browser reads it as JSON, and
 *  `&lt;` inside it would corrupt the data. The parser ends the block at the first literal
 *  `</script` regardless of JSON string quoting, so that sequence is what has to be broken, and
 *  `<!--` because it opens an HTML comment that swallows the rest of the block. Escaping the
 *  slash and the `!` keeps the JSON byte-identical once parsed. */
function escapeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/<\/(script)/gi, '<\\/$1')
    .replace(/<!--/g, '<\\u0021--')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}

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

/** Thrown when the farm is handed a block the validator accepted and the renderer cannot draw.
 *  Its own class so buildSite can turn it into a build failure and let every other error keep
 *  its stack. */
class UnrenderableBlock extends Error {}

function renderPage(page: Page, site: Site, theme: Theme, pageKey: string) {
  const section = (b: Page['blocks'][number], key: number) => {
    const entry = catalog[b.type]
    const style = theme.sectionStyles[b.variant]
    /* The preview returns null here, which is right for a half-typed bundle on a creator's
     *  machine. The farm must not: validateBundle has already passed at this point, so anything
     *  unrenderable is a disagreement between the validator and the catalog. Dropping it ships a
     *  page with a section missing, under exit code 0 and a "✓ built" line — the client discovers
     *  it, not us. */
    if (!entry) throw new UnrenderableBlock(`unknown block type "${b.type}" reached the renderer after validation passed`)
    if (!style) throw new UnrenderableBlock(`variant "${b.variant}" has no sectionStyle, but validation passed`)
    const parsed = entry.schema.safeParse(b.props)
    if (!parsed.success) {
      throw new UnrenderableBlock(
        `${b.type} props were accepted by the validator and rejected by the catalog schema: ` +
        parsed.error.issues.slice(0, 3).map((i) => `${i.path.join('.')} ${i.message}`).join('; '))
    }
    // Which page this is cannot come from the bundle — chrome is declared once for the whole
    // site — so the renderer supplies it, and Nav marks the matching item `aria-current`.
    const props = { ...(parsed.data as object), currentPage: pageKey }
    return createElement('div', { key, className: 'section', 'data-tone': style.tone, style: style.vars },
      createElement(entry.Component as never, { props, layout: style.layout }))
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
  opts: { allowUnverified?: boolean; bundleDir?: string } = {}) {
  /* Render what the validator returns, not what the caller passed. Those differ whenever a
     stored bundle carries a deprecated prop shape: the migration is applied to the validator's
     parsed copy, and rendering the original instead is what published a footerless page. */
  const { ok, issues, unverified, site: migratedSite, theme: migratedTheme } = validateBundle(site, theme, org)
  if (!ok || !migratedSite || !migratedTheme) return { ok: false as const, issues, written: [] as string[] }
  site = migratedSite
  theme = migratedTheme

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

  /* The one check that opens the image files, so it can only run here — the validator the
     preview shares has no filesystem. A frame that eats more than half its photograph renders
     perfectly and is wrong, and nothing in the bundle says what shape the picture is. */
  const assetRoot = opts.bundleDir && existsSync(join(opts.bundleDir, 'assets'))
    ? join(opts.bundleDir, 'assets')
    : join(RENDERER, '..', 'public', 'img')
  issues.push(...imageFitIssues(site, (src) => {
    const rel = src.replace(/^\/img\//, '')
    const withoutClient = rel.startsWith(`${site.client}/`) ? rel.slice(site.client.length + 1) : rel
    for (const candidate of [join(assetRoot, withoutClient), join(assetRoot, rel)]) {
      if (existsSync(candidate)) return candidate
    }
    return null
  }))

  const css = readFileSync(join(RENDERER, 'styles.css'), 'utf8')
    // the preview's own chrome never ships
    .split('/* ---------- generated site: token-only from here down ---------- */')[1] ?? ''

  const written: string[] = []
  mkdirSync(outDir, { recursive: true })

  /* A renderer disagreement is a platform bug, not a content problem, so it stops the build and
     says so rather than producing a page with a hole in it. */
  const renderOrFail = (page: Page, key: string) => {
    try { return { html: renderPage(page, site, theme, key) } }
    catch (e) {
      if (!(e instanceof UnrenderableBlock)) throw e
      return { issue: { where: `pages.${key}`, message: `${e.message}. This is a validator/catalog mismatch — a platform bug, not a content problem`, severity: 'error' as const } }
    }
  }

  /* Swiper is loaded per page, and only where a Carousel actually appears — a law firm's
     contact page should not pay 180KB for a slider on the home page. Matching the serialised
     node rather than walking the tree keeps this indifferent to how deeply the primitive is
     nested; `"el":"Carousel"` cannot occur in copy, because `el` is a structural key. */
  const usesCarousel = (page: Page) => JSON.stringify(page).includes('"el":"Carousel"')
  let anyCarousel = false
  // Chrome is drawn on every page, so a Carousel in the header or footer makes every page need it.
  const chromeUsesCarousel = site.chrome
    ? JSON.stringify(site.chrome).includes('"el":"Carousel"')
    : false

  for (const [key, page] of Object.entries(site.pages)) {
    const meta = metaFor(site, key, org)
    const ld = jsonLd(site, key, org)
    const carousel = usesCarousel(page) || (chromeUsesCarousel ?? false)
    anyCarousel ||= carousel
    const rendered = renderOrFail(page, key)
    if (rendered.issue) return { ok: false as const, issues: [...issues, rendered.issue], written }
    const body = rendered.html
    const html = `<!doctype html>
<html lang="${escapeHtml(org.lang ?? 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(meta.title)}</title>
<meta name="description" content="${escapeHtml(meta.description)}">
<link rel="canonical" href="${escapeHtml(meta.canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(meta.title)}">
<meta property="og:description" content="${escapeHtml(meta.description)}">
${meta.ogImage ? `<meta property="og:image" content="${escapeHtml(meta.ogImage)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${escapeHtml(FONTS)}">
<style>*{box-sizing:border-box}body{margin:0}${css}</style>
${ld.map((node) => `<script type="application/ld+json">${escapeJsonLd(node)}</script>`).join('\n')}
</head>
<body>${body}<script>${MOTION_JS}</script>${carousel ? `\n<script src="/js/swiper.js" defer></script>\n<script>${CAROUSEL_JS}</script>` : ''}</body>
</html>`
    const path = key === 'home' ? join(outDir, 'index.html') : join(outDir, key, 'index.html')
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, html)
    written.push(path)
  }

  /* The previous build's manifest, so an unchanged page keeps the date it last actually changed
     rather than claiming it changed again today. Missing on a first build, which is correct. */
  const manifestPath = join(outDir, 'sitemap-lastmod.json')
  let previous: Record<string, string> | undefined
  try { previous = JSON.parse(readFileSync(manifestPath, 'utf8')) } catch { previous = undefined }

  for (const [name, content] of [
    ['sitemap.xml', sitemap(site, org, previous)],
    ['sitemap-lastmod.json', JSON.stringify(sitemapManifest(site, previous), null, 2)],
    ['robots.txt', robots(org)],
    ['llms.txt', llmsTxt(site, org)],
  ] as const) {
    writeFileSync(join(outDir, name), content)
    written.push(join(outDir, name))
  }

  /* The Swiper element bundle, copied out of the renderer's install rather than linked from a
     CDN. A published client site that depends on a third party staying up for its slider to
     work is a support ticket waiting to happen, and it leaks the visitor's IP to that CDN. */
  if (anyCarousel) {
    const swiper = join(RENDERER, '..', 'node_modules', 'swiper', 'swiper-element-bundle.min.js')
    if (existsSync(swiper)) {
      mkdirSync(join(outDir, 'js'), { recursive: true })
      cpSync(swiper, join(outDir, 'js', 'swiper.js'))
      written.push(join(outDir, 'js', 'swiper.js'))
    } else {
      issues.push({ where: 'build', message: 'a page uses a Carousel but swiper-element-bundle.min.js was not found in the renderer install — the slider will render as a static stack of slides', severity: 'warning' })
    }
  }

  // The creator's own assets, under /img/<client>/ — the path convention every bundle's props use.
  //
  // This used to copy the renderer's demo images and nothing else, which meant a published client
  // site had every image broken *and* shipped four unrelated demo clients' photo folders. It is the
  // build-farm twin of the preview bug where /img/ was served from the renderer package instead of
  // the creator's assets/, and it hid for the same reason: the repo's own sample bundles are the
  // ones whose images live in the renderer, so everything looked right from inside the repo.
  const bundleAssets = opts.bundleDir ? join(opts.bundleDir, 'assets') : null
  if (bundleAssets && existsSync(bundleAssets)) {
    cpSync(bundleAssets, join(outDir, 'img', site.client), { recursive: true })
  } else {
    // Sample content in this repo keeps its images in the renderer's public dir. Copy only the
    // folder this site actually references, never the whole demo set.
    const demo = join(RENDERER, '..', 'public', 'img', site.client)
    if (existsSync(demo)) cpSync(demo, join(outDir, 'img', site.client), { recursive: true })
  }

  return { ok: true as const, issues, written }
}
