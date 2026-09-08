import { z } from 'zod'
import { hrefFor, type CatalogEntry, type Deprecation } from './shared'

/** A footer link. `page` is optional because the shape this replaced was a bare string with no
 *  destination at all — making it required would invalidate every stored bundle. A label without
 *  one renders as plain text, exactly as it did before, and the validator warns about it. */
const Link = z.object({ label: z.string(), page: z.string().optional() })

const Props = z.object({
  brand: z.string(),
  logo: z.string().optional(),
  /** One line under the brand — what the company does, for a visitor who landed deep in the site. */
  tagline: z.string().optional(),
  columns: z.array(z.object({
    title: z.string(), links: z.array(Link).min(1),
  })).min(1).max(4),
  /** The element visitors most often come to a footer looking for. Phone and email become real
   *  `tel:` / `mailto:` links, which is the whole point of putting them here rather than in prose. */
  contact: z.object({
    label: z.string().optional(),
    address: z.array(z.string()).min(1).max(5).optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
  }).optional(),
  /** Profiles the client does not control, so a crawler can corroborate the entity elsewhere —
   *  the same `sameAs` signal `org.json` carries, made visible. Text labels, not icons: shipping
   *  an icon set would put a second, unthemed visual language in the catalog. */
  social: z.array(z.object({ label: z.string(), href: z.string() })).min(1).max(6).optional(),
  /** The statutory row, kept apart from `note` because it is not editorial. `line` carries the
   *  copyright and, in jurisdictions that require it, the registered name and registration
   *  number — Malaysia's s.30(2) Companies Act 2016 being the case the validator checks. */
  legal: z.object({
    line: z.string().optional(),
    links: z.array(Link).max(4).optional(),
  }).optional(),
  note: z.string().optional(),
})
type P = z.infer<typeof Props>
const layouts = ['columns', 'centered-minimal'] as const

/** An email address is one unbreakable token, so in a ~150px footer column it either overflows
 *  or breaks mid-word ("firstmetrology.exa / mple"). `<wbr>` offers the breaks a reader expects —
 *  after the @ and after each dot — and is inert wherever the line already fits. */
function Email({ address }: { address: string }) {
  const parts = address.split(/(?<=[@.])/)
  return (
    <a href={`mailto:${address}`}>
      {parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 && <wbr />}</span>)}
    </a>
  )
}

/** Social as its own column — the fallback shape, for a footer with no contact block. */
function SocialCol({ social }: { social: NonNullable<P['social']> }) {
  return (
    <div className="foot__col foot__social">
      <h3 className="foot__coltitle">Follow</h3>
      <ul>
        {social.map((s) => (
          <li key={s.href}><a href={s.href} rel="me noopener" target="_blank">{s.label}</a></li>
        ))}
      </ul>
    </div>
  )
}

/** Renders a link when it has somewhere to go, and the label alone when it does not. */
function FootLink({ link }: { link: z.infer<typeof Link> }) {
  if (!link.page) return <span>{link.label}</span>
  return <a href={hrefFor(link.page)} data-page={link.page}>{link.label}</a>
}

function Footer({ props, layout }: { props: P; layout: string }) {
  const { contact, social, legal } = props
  const hasBottom = Boolean(props.note || legal?.line || legal?.links?.length)
  return (
    <footer className="block foot" data-layout={layout}>
      <div className="foot__inner">
        <div className="foot__brand">
          {props.logo
            ? <img className="foot__logo" src={props.logo} alt={props.brand} />
            : <span className="foot__name">{props.brand}</span>}
          {props.tagline && <p className="foot__tagline">{props.tagline}</p>}
        </div>
        <div className="foot__cols">
          {props.columns.map((c) => (
            <nav className="foot__col" key={c.title} aria-label={c.title}>
              <h3 className="foot__coltitle">{c.title}</h3>
              <ul>{c.links.map((l) => <li key={l.label}><FootLink link={l} /></li>)}</ul>
            </nav>
          ))}
          {contact && (
            <div className="foot__col foot__contact">
              <h3 className="foot__coltitle">{contact.label ?? 'Contact'}</h3>
              <ul>
                {contact.address && (
                  <li><address>{contact.address.map((a) => <span key={a}>{a}</span>)}</address></li>
                )}
                {contact.phone && <li><a href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}>{contact.phone}</a></li>}
                {contact.email && <li><Email address={contact.email} /></li>}
                {social?.map((s) => (
                  <li key={s.href} className="foot__socialitem">
                    <a href={s.href} rel="me noopener" target="_blank">{s.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Social rides inside the contact column when there is one. As a column of its own it
              is two words wide and leaves a hole in the grid, and "how to reach us" is one idea,
              not two. It only stands alone when there is no contact block to sit under. */}
          {social && !contact && <SocialCol social={social} />}
        </div>
        {hasBottom && (
          <div className="foot__bottom">
            {props.note && <p className="foot__note">{props.note}</p>}
            {legal?.line && <p className="foot__legal">{legal.line}</p>}
            {legal?.links?.length ? (
              <ul className="foot__legallinks">
                {legal.links.map((l) => <li key={l.label}><FootLink link={l} /></li>)}
              </ul>
            ) : null}
          </div>
        )}
      </div>
    </footer>
  )
}

/** 2026-09-08: `columns[].links` was `string[]`, rendered as bare `<li>` text — every generated
 *  site had a footer full of words that looked like links and were not focusable, followable or
 *  announced as links. The label is all the old shape held, so this carries it forward and leaves
 *  `page` unset; the site renders exactly as it did until someone fills the destinations in. */
const linksWereStrings: Deprecation<P> = {
  schema: Props.omit({ columns: true }).extend({
    columns: z.array(z.object({
      title: z.string(), links: z.array(z.string()).min(1),
    })).min(1).max(4),
  }),
  migrate: (old) => ({
    ...old,
    columns: old.columns.map((c: { title: string; links: string[] }) => ({
      title: c.title,
      links: c.links.map((label) => ({ label })),
    })),
  }),
  note: '2026-09-08: footer links became {label, page?} so they are actual links',
}

export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Footer, deprecated: [linksWereStrings] }
