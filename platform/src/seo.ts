/** SEO / AEO / GEO artifacts, derived from the validated content tree.
 *
 *  Nothing here reads markup, because there is none — it reads block types and props.
 *  That is the payoff for keeping content structured: an FAQ block *is* an FAQPage, a
 *  Locations block *is* a LocalBusiness, and a fleet-wide schema improvement is a change
 *  to this file rather than an edit to forty sites. */
import type { Site, Page } from '../../renderer/src/schema'

/** Organisation facts, collected at intake — not inferable from marketing copy.
 *  These carry the E-E-A-T signals: who this is, since when, verifiable elsewhere,
 *  accountable to a real address, and credentialled by someone other than themselves. */
export type Org = {
  name: string
  url: string
  legalName?: string          // registered entity, often differs from the trading name
  logo?: string
  description?: string
  foundingDate?: string       // ISO date or year — longevity is an experience signal
  registration?: string       // company / business registration number
  vatId?: string
  phone?: string
  email?: string
  address?: { street: string; locality: string; region?: string; postalCode?: string; country: string }
  sameAs?: string[]           // LinkedIn, Google Business, industry directories — third-party corroboration
  certifications?: string[]   // ISO 9001, BIFMA, CAAM — authority granted by someone else
  awards?: string[]
  areaServed?: string[]       // GEO: markets and regions actually served
  people?: Array<{ name: string; role: string; credential?: string; sameAs?: string }>
  numberOfEmployees?: string
  foundingLocation?: string
}

const text = (v: unknown) => (typeof v === 'string' ? v : '')
const blocks = (page: Page) => page.blocks
const first = (page: Page, type: string) => page.blocks.find((b) => b.type === type)

/** Every block that carries a section heading, so headings can be summarised without markup. */
function outline(page: Page): string[] {
  const out: string[] = []
  for (const b of blocks(page)) {
    const p = b.props as Record<string, unknown>
    if (typeof p.title === 'string') out.push(p.title)
    if (b.type === 'FreeSection') {
      const walk = (n: any) => {
        if (n?.el === 'Heading' && n.level <= 3 && typeof n.text === 'string') out.push(n.text)
        ;(n?.children ?? []).forEach(walk)
      }
      ;(p.children as any[] ?? []).forEach(walk)
    }
  }
  return out
}

function heroOf(page: Page) {
  const hero = first(page, 'Hero')
  if (hero) {
    const p = hero.props as Record<string, unknown>
    return { title: text(p.title), body: text(p.body), image: text(p.image) }
  }
  const free = page.blocks.find((b) => b.type === 'FreeSection' && (b.props as any).role === 'hero')
  if (!free) return { title: page.title, body: '', image: '' }
  let title = '', body = '', image = text((free.props as any).bg?.image)
  const walk = (n: any) => {
    if (n?.el === 'Heading' && n.level === 1 && !title) title = n.text
    if (n?.el === 'Text' && n.size === 'lede' && !body) body = n.text
    if (n?.el === 'Image' && !image) image = n.src
    ;(n?.children ?? []).forEach(walk)
  }
  ;((free.props as any).children ?? []).forEach(walk)
  return { title: title || page.title, body, image }
}

export function metaFor(site: Site, pageKey: string, org: Org) {
  const page = site.pages[pageKey]
  const hero = heroOf(page)
  const path = pageKey === 'home' ? '/' : `/${pageKey}/`
  const description = (hero.body || outline(page).slice(1, 3).join('. ')).slice(0, 155)
  return {
    title: pageKey === 'home' ? `${org.name} — ${hero.title}` : `${page.title} · ${org.name}`,
    description,
    canonical: new URL(path, org.url).href,
    ogImage: hero.image ? new URL(hero.image, org.url).href : undefined,
  }
}

/** JSON-LD graph. Block type is the signal — this is why choosing the semantically
 *  correct block matters more at generation time than any copy tweak. */
export function jsonLd(site: Site, pageKey: string, org: Org): object[] {
  const page = site.pages[pageKey]
  const url = new URL(pageKey === 'home' ? '/' : `/${pageKey}/`, org.url).href
  const graph: object[] = []

  const organization: Record<string, unknown> = {
    '@type': 'Organization', '@id': `${org.url}#org`, name: org.name, url: org.url,
    ...(org.legalName ? { legalName: org.legalName } : {}),
    ...(org.description ? { description: org.description } : {}),
    ...(org.logo ? { logo: new URL(org.logo, org.url).href } : {}),
    ...(org.foundingDate ? { foundingDate: org.foundingDate } : {}),
    ...(org.foundingLocation ? { foundingLocation: org.foundingLocation } : {}),
    ...(org.registration ? { identifier: org.registration } : {}),
    ...(org.vatId ? { vatID: org.vatId } : {}),
    ...(org.phone ? { telephone: org.phone } : {}),
    ...(org.email ? { email: org.email } : {}),
    ...(org.numberOfEmployees ? { numberOfEmployees: org.numberOfEmployees } : {}),
    // sameAs is the strongest cheap trust signal: it lets a crawler corroborate the
    // entity somewhere it does not control.
    ...(org.sameAs?.length ? { sameAs: org.sameAs } : {}),
    ...(org.areaServed?.length ? { areaServed: org.areaServed } : {}),
    ...(org.certifications?.length
      ? { hasCredential: org.certifications.map((c) => ({ '@type': 'EducationalOccupationalCredential', name: c })) }
      : {}),
    ...(org.awards?.length ? { award: org.awards } : {}),
    ...(org.people?.length
      ? { employee: org.people.map((p) => ({
          '@type': 'Person', name: p.name, jobTitle: p.role,
          ...(p.credential ? { hasCredential: { '@type': 'EducationalOccupationalCredential', name: p.credential } } : {}),
          ...(p.sameAs ? { sameAs: p.sameAs } : {}),
        })) }
      : {}),
  }

  if (org.address) {
    organization.address = {
      '@type': 'PostalAddress',
      streetAddress: org.address.street, addressLocality: org.address.locality,
      ...(org.address.region ? { addressRegion: org.address.region } : {}),
      ...(org.address.postalCode ? { postalCode: org.address.postalCode } : {}),
      addressCountry: org.address.country,
    }
  }

  const locations = first(page, 'Locations')
  if (locations) {
    const items = (locations.props as any).items as Array<{ name: string; address: string; note?: string }>
    // GEO: a physical address turns the Organization into a LocalBusiness, which is what
    // "near me" style queries and map surfaces actually read.
    organization['@type'] = ['Organization', 'LocalBusiness']
    // Addresses on the page supplement the registered one from intake rather than replacing it.
    const fromPage = items.map((l) => ({
      '@type': 'PostalAddress', name: l.name, streetAddress: l.address.replace(/\n/g, ', '),
    }))
    organization.address = organization.address ? [organization.address, ...fromPage] : fromPage
  }
  graph.push(organization)

  graph.push({ '@type': 'WebPage', '@id': url, url, name: page.title, isPartOf: { '@id': `${org.url}#org` } })

  const faq = first(page, 'FAQ')
  if (faq) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: ((faq.props as any).items as Array<{ q: string; a: string }>).map((i) => ({
        '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a },
      })),
    })
  }

  const spec = first(page, 'SpecTable')
  const catalogGrid = first(page, 'CatalogGrid')
  if (spec || catalogGrid) {
    const name = text((spec?.props as any)?.eyebrow) || text((catalogGrid?.props as any)?.title) || page.title
    const props = spec
      ? ((spec.props as any).groups as Array<{ rows: Array<{ k: string; v: string }> }>)
          .flatMap((g) => g.rows).map((r) => ({ '@type': 'PropertyValue', name: r.k, value: r.v }))
      : []
    graph.push({
      '@type': 'Product', name, brand: { '@id': `${org.url}#org` },
      ...(props.length ? { additionalProperty: props } : {}),
    })
  }

  const quotes = first(page, 'Testimonials')
  if (quotes) {
    graph.push(...((quotes.props as any).items as Array<{ quote: string; author: string; role?: string }>)
      .map((q) => ({ '@type': 'Review', reviewBody: q.quote, author: { '@type': 'Person', name: q.author },
                     itemReviewed: { '@id': `${org.url}#org` } })))
  }

  const steps = first(page, 'Steps')
  if (steps) {
    graph.push({
      '@type': 'HowTo', name: text((steps.props as any).title),
      step: ((steps.props as any).items as Array<{ title: string; body: string }>).map((s, i) => ({
        '@type': 'HowToStep', position: i + 1, name: s.title, text: s.body,
      })),
    })
  }

  const crumbs = (first(page, 'Hero')?.props as any)?.breadcrumb as Array<{ label: string; page?: string }> | undefined
  if (crumbs?.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem', position: i + 1, name: c.label,
        ...(c.page ? { item: new URL(c.page === 'home' ? '/' : `/${c.page}/`, org.url).href } : {}),
      })),
    })
  }

  return [{ '@context': 'https://schema.org', '@graph': graph }]
}

export function sitemap(site: Site, org: Org): string {
  const today = new Date().toISOString().slice(0, 10)
  const urls = Object.keys(site.pages).map((k) => {
    const loc = new URL(k === 'home' ? '/' : `/${k}/`, org.url).href
    return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><priority>${k === 'home' ? '1.0' : '0.7'}</priority></url>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

export function robots(org: Org): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', org.url).href}\n`
}

/** AEO: a plain-language map of the site for answer engines, built from the same tree.
 *  Answer engines reward stating the facts plainly far more than keyword density. */
export function llmsTxt(site: Site, org: Org): string {
  const lines = [`# ${org.name}`, '']
  const home = site.pages.home
  if (home) lines.push(heroOf(home).body || '', '')
  lines.push('## Pages', '')
  for (const [key, page] of Object.entries(site.pages)) {
    const url = new URL(key === 'home' ? '/' : `/${key}/`, org.url).href
    const hero = heroOf(page)
    lines.push(`- [${page.title}](${url}): ${hero.body || hero.title}`)
  }
  const facts: string[] = []
  for (const page of Object.values(site.pages)) {
    const stats = first(page, 'Stats')
    if (stats) for (const s of (stats.props as any).items as Array<{ value: string; label: string }>) {
      facts.push(`- ${s.label}: ${s.value}`)
    }
  }
  if (facts.length) lines.push('', '## Key facts', '', ...[...new Set(facts)])

  const qa: string[] = []
  for (const page of Object.values(site.pages)) {
    const faq = first(page, 'FAQ')
    if (faq) for (const i of (faq.props as any).items as Array<{ q: string; a: string }>) {
      qa.push(`### ${i.q}`, i.a, '')
    }
  }
  if (qa.length) lines.push('', '## Questions', '', ...qa)
  return lines.join('\n')
}
