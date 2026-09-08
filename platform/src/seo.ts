/** SEO / AEO / GEO artifacts, derived from the validated content tree.
 *
 *  Nothing here reads markup, because there is none — it reads block types and props.
 *  That is the payoff for keeping content structured: an FAQ block *is* an FAQPage, a
 *  Locations block *is* a LocalBusiness, and a fleet-wide schema improvement is a change
 *  to this file rather than an edit to forty sites. */
import type { Site, Page } from '@blackdash/renderer/schema'
/* schema.org types, so a malformed node is a compile error rather than markup a crawler
 * quietly discards. The graph is assembled as Thing[] and returned as a single Graph, which
 * already carries its own @context. */
import type {
  Thing, Graph, OrganizationLeaf, PostalAddress, WebPage, FAQPage, Question,
  Product, PropertyValue, Review, HowTo, HowToStep, BreadcrumbList, ListItem,
  EducationalOccupationalCredential, Person, QuantitativeValue,
} from 'schema-dts'

/** Organisation facts, collected at intake — not inferable from marketing copy.
 *  These carry the E-E-A-T signals: who this is, since when, verifiable elsewhere,
 *  accountable to a real address, and credentialled by someone other than themselves. */
export type Org = {
  name: string
  url: string
  /** BCP-47 tag for the document's `lang`. Defaults to "en"; a Malaysian client publishing in
   *  Malay is "ms-MY", and a wrong `lang` mis-pronounces the page in every screen reader and
   *  mis-files it for every crawler. It belongs to the client, not to the pipeline. */
  lang?: string
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
  /** A schema.org LocalBusiness subtype — LegalService, Dentist, AutoRepair, Accounting…
   *  A law firm typed as a bare LocalBusiness is indexed as a shop with an address; the
   *  subtype is what puts it in the right professional-services surfaces. Set at intake:
   *  it is a fact about the business, not something to infer from marketing copy. */
  businessType?: string
  people?: Array<{ name: string; role: string; credential?: string; sameAs?: string
    /** A schema.org Person subtype — Attorney, Physician, Dentist. Omit if none applies. */
    personType?: string }>
  numberOfEmployees?: string
  foundingLocation?: string
}

/** True if a block, or anything nested in its props, carries the provenance mark. */
function unverified(block: Page['blocks'][number]): boolean {
  if (block.unverified === true) return true
  const scan = (v: unknown): boolean => {
    if (Array.isArray(v)) return v.some(scan)
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      return o.unverified === true || Object.values(o).some(scan)
    }
    return false
  }
  return scan(block.props)
}

/** Structured data is a claim made to a search engine in the client's name. Marketing copy
 *  a human will proofread can be a draft; a Review or a Product spec asserted in JSON-LD
 *  cannot. Every derivation below reads this filtered view, so an unverified section is
 *  visible on the page and absent from the graph — never the reverse. */
function verified(site: Site): Site {
  return {
    ...site,
    pages: Object.fromEntries(Object.entries(site.pages).map(([k, p]) =>
      [k, { ...p, blocks: p.blocks.filter((b) => !unverified(b)) }])),
  }
}

const text = (v: unknown) => (typeof v === 'string' ? v : '')
const blocks = (page: Page) => page.blocks
const first = (page: Page, type: string) => page.blocks.find((b) => b.type === type)

/** Every block that carries a section heading, so headings can be summarised without markup. */
const NON_CLAIM_TYPES = new Set(['Notice'])

function outline(page: Page): string[] {
  const out: string[] = []
  for (const b of blocks(page)) {
    // A disclaimer is the business disclaiming something. Harvested into a page description
    // or an llms.txt summary it reads as the business asserting it instead.
    if (NON_CLAIM_TYPES.has(b.type)) continue
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
export function jsonLd(rawSite: Site, pageKey: string, org: Org): [Graph] {
  const site = verified(rawSite)
  const page = site.pages[pageKey]
  const url = new URL(pageKey === 'home' ? '/' : `/${pageKey}/`, org.url).href
  const graph: Thing[] = []

  /* OrganizationLeaf, not Organization: the latter is a union of every organisation subtype, so
   * assigning a property to it does not typecheck. The leaf is the concrete interface. */
  const organization: OrganizationLeaf = {
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
    /* schema.org types this as QuantitativeValue, not Text. It was emitted as a bare string,
     * which a consumer reading the vocabulary discards — caught by the schema types, not by any
     * validator we had. */
    ...(org.numberOfEmployees
      ? { numberOfEmployees: { '@type': 'QuantitativeValue', value: org.numberOfEmployees } as QuantitativeValue }
      : {}),
    // sameAs is the strongest cheap trust signal: it lets a crawler corroborate the
    // entity somewhere it does not control.
    ...(org.sameAs?.length ? { sameAs: org.sameAs } : {}),
    ...(org.areaServed?.length ? { areaServed: org.areaServed } : {}),
    ...(org.certifications?.length
      ? { hasCredential: org.certifications.map((c): EducationalOccupationalCredential => ({ '@type': 'EducationalOccupationalCredential', name: c })) }
      : {}),
    ...(org.awards?.length ? { award: org.awards } : {}),
    ...(org.people?.length
      ? { employee: org.people.map((p): Person => ({
          // Attorney/Physician/etc. are Person subtypes; using one is what makes a
          // credentialled individual legible as a practitioner rather than as staff.
          // personType arrives from org.json, so the literal is only known at run time —
          // the cast is the one place that is true, and everything else here is checked.
          '@type': (p.personType ?? 'Person') as 'Person', name: p.name, jobTitle: p.role,
          ...(p.credential ? { hasCredential: { '@type': 'EducationalOccupationalCredential', name: p.credential } } : {}),
          ...(p.sameAs ? { sameAs: p.sameAs } : {}),
        })) }
      : {}),
  }

  let registeredAddress: PostalAddress | undefined
  if (org.address) {
    const postal: PostalAddress = {
      '@type': 'PostalAddress',
      streetAddress: org.address.street, addressLocality: org.address.locality,
      ...(org.address.region ? { addressRegion: org.address.region } : {}),
      ...(org.address.postalCode ? { postalCode: org.address.postalCode } : {}),
      addressCountry: org.address.country,
    }
    registeredAddress = postal
    organization.address = postal
  }

  const locations = first(page, 'Locations')
  if (locations) {
    const items = (locations.props as any).items as Array<{ name: string; address: string; note?: string }>
    // GEO: a physical address turns the Organization into a LocalBusiness, which is what
    // "near me" style queries and map surfaces actually read.
    /* A node may legitimately hold several types at once, and this one must: Organization for the
     * entity, LocalBusiness so a "near me" query and map surfaces resolve it, plus the client's own
     * businessType. schema.org models that fine; these generated types pin @type to one literal
     * and LocalBusiness is a union of ~480 leaves, so the array cannot be expressed in the type.
     * The cast is confined to this one assignment — every property above and below is still
     * checked against Organization. */
    ;(organization as { '@type': string | string[] })['@type'] = org.businessType
      ? ['Organization', 'LocalBusiness', org.businessType]
      : ['Organization', 'LocalBusiness']
    // Addresses on the page supplement the registered one from intake rather than replacing it.
    const fromPage = items.map((l): PostalAddress => ({
      '@type': 'PostalAddress', name: l.name, streetAddress: l.address.replace(/\n/g, ', '),
    }))
    organization.address = registeredAddress ? [registeredAddress, ...fromPage] : fromPage
  }
  graph.push(organization)

  const webPage: WebPage = { '@type': 'WebPage', '@id': url, url, name: page.title, isPartOf: { '@id': `${org.url}#org` } }
  graph.push(webPage)

  // FAQPage no longer earns a rich result — deprecated Search-wide 2026-05-07. Kept because the
  // markup is still correct, costs nothing, and non-Google consumers still read it. Do not promise
  // a SERP change from it.
  const faq = first(page, 'FAQ')
  if (faq) {
    const faqPage: FAQPage = {
      '@type': 'FAQPage',
      mainEntity: ((faq.props as any).items as Array<{ q: string; a: string }>).map((i): Question => ({
        '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a },
      })),
    }
    graph.push(faqPage)
  }

  const spec = first(page, 'SpecTable')
  const catalogGrid = first(page, 'CatalogGrid')
  if (spec || catalogGrid) {
    const name = text((spec?.props as any)?.eyebrow) || text((catalogGrid?.props as any)?.title) || page.title
    const props = spec
      ? ((spec.props as any).groups as Array<{ rows: Array<{ k: string; v: string }> }>)
          .flatMap((g) => g.rows).map((r): PropertyValue => ({ '@type': 'PropertyValue', name: r.k, value: r.v }))
      : []
    const product: Product = {
      '@type': 'Product', name, brand: { '@id': `${org.url}#org` },
      ...(props.length ? { additionalProperty: props } : {}),
    }
    graph.push(product)
  }

  // Self-serving Review markup has not produced stars since 2019, and Google's 2026-07-24 fake-review
  // policy makes an unverified one an actual liability — which is why verified() runs first.
  const quotes = first(page, 'Testimonials')
  if (quotes) {
    graph.push(...((quotes.props as any).items as Array<{ quote: string; author: string; role?: string }>)
      .map((q): Review => ({ '@type': 'Review', reviewBody: q.quote,
                             author: { '@type': 'Person', name: q.author } as Person,
                             itemReviewed: { '@id': `${org.url}#org` } })))
  }

  // HowTo rich results were retired in September 2023. Same reasoning as FAQPage above: emitted for
  // correctness and non-Google consumers, not for Search.
  const steps = first(page, 'Steps')
  if (steps) {
    const howTo: HowTo = {
      '@type': 'HowTo', name: text((steps.props as any).title),
      step: ((steps.props as any).items as Array<{ title: string; body: string }>).map((s, i): HowToStep => ({
        '@type': 'HowToStep', position: i + 1, name: s.title, text: s.body,
      })),
    }
    graph.push(howTo)
  }

  const crumbs = (first(page, 'Hero')?.props as any)?.breadcrumb as Array<{ label: string; page?: string }> | undefined
  if (crumbs?.length) {
    const trail: BreadcrumbList = {
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i): ListItem => ({
        '@type': 'ListItem', position: i + 1, name: c.label,
        ...(c.page ? { item: new URL(c.page === 'home' ? '/' : `/${c.page}/`, org.url).href } : {}),
      })),
    }
    graph.push(trail)
  }

  return [{ '@context': 'https://schema.org', '@graph': graph }]
}

/** Five characters, because a `loc` is built from org.url and page keys — both content. */
function escapeXml(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

/** A page's content fingerprint. `lastmod` has to move when the page moves and stay put when it
 *  does not, so it is derived from the page's own tree rather than from the clock. */
function contentHash(value: unknown): string {
  const json = JSON.stringify(value) ?? ''
  let h1 = 0x811c9dc5, h2 = 0x01000193
  for (let i = 0; i < json.length; i++) {
    const c = json.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0
  }
  return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0'))
}

/** `lastmod` per page, from a content hash rather than the build clock.
 *
 *  Every URL previously carried the build date, so a weekly rebuild told every crawler the whole
 *  site changed weekly. That is not a neutral inaccuracy — it is a false freshness signal from a
 *  pipeline whose entire pitch is signal quality, and a crawler that learns the dates are noise
 *  stops using them.
 *
 *  `previous` is the last build's manifest (hash -> date). A page whose hash is unchanged keeps
 *  the date it last actually changed; a new or edited page takes today. With no manifest —
 *  a first build — every page is new, which is true. */
export function sitemap(site: Site, org: Org, previous?: Record<string, string>): string {
  const today = new Date().toISOString().slice(0, 10)
  const urls = Object.keys(site.pages).map((k) => {
    const loc = escapeXml(new URL(k === 'home' ? '/' : `/${k}/`, org.url).href)
    const lastmod = previous?.[`${k}:${contentHash(site.pages[k])}`] ?? today
    return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><priority>${k === 'home' ? '1.0' : '0.7'}</priority></url>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

/** What the next build needs in order to leave an unchanged page's `lastmod` alone. Written
 *  beside the sitemap; absent on a first build, which is handled. */
export function sitemapManifest(site: Site, previous?: Record<string, string>): Record<string, string> {
  const today = new Date().toISOString().slice(0, 10)
  const out: Record<string, string> = {}
  for (const k of Object.keys(site.pages)) {
    const key = `${k}:${contentHash(site.pages[k])}`
    out[key] = previous?.[key] ?? today
  }
  return out
}

export function robots(org: Org): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', org.url).href}\n`
}

/** A plain-language map of the site, built from the same tree.
 *  Google stated in June 2026 that llms.txt has no effect on Search or AI Overviews. It is emitted
 *  because it is nearly free and some non-Google readers consume it — not because it is an AEO
 *  feature. The thing that actually moves answer-engine grounding is Organization from org.json. */
export function llmsTxt(rawSite: Site, org: Org): string {
  // llms.txt is read by answer engines as fact, so it gets the same filter as JSON-LD.
  const site = verified(rawSite)
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
