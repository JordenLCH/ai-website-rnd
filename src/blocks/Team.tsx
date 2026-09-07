import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  /** Some firms do not publish who works there. Naming them anyway is the one invention that
   *  is never acceptable, and omitting the section loses a real page, so an entry may carry a
   *  role and credential with no name. Only named entries become `Person` in JSON-LD. */
  items: z.array(z.object({
    name: z.string().optional(), role: z.string(),
    credential: z.string().optional(), bio: z.string().optional(),
    image: z.string().optional(), imageAlt: z.string().optional(),
  })).min(2).max(8),
})
type P = z.infer<typeof Props>
const layouts = ['photo-grid', 'minimal-list'] as const

function Team({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block team" data-layout={layout}>
      <header className="team__head">
        {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
        <h2 className="heading">{props.title}</h2>
      </header>
      <div className="team__items" data-count={props.items.length}>
        {props.items.map((m, i) => (
          <div className="member" key={m.name ?? `${m.role}-${i}`}>
            {m.image && <div className="member__media"><img src={m.image} alt={m.imageAlt ?? ''} /></div>}
            {/* Unnamed: the role carries the heading, so the section still has a structure. */}
            <h3 className="member__name">{m.name ?? m.role}</h3>
            {m.name && <p className="member__role">{m.role}</p>}
            {m.credential && <p className="member__credential">{m.credential}</p>}
            {m.bio && <p className="member__bio">{m.bio}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = {
  schema: Props, layouts, Component: Team,
  check(props, layout) {
    const out: string[] = []
    // photo-grid is a grid of faces; with no names it is a grid of stock photography.
    if (layout === 'photo-grid' && props.items.some((m) => !m.name))
      out.push('layout "photo-grid" needs a name on every member — use "minimal-list" for unnamed roles')
    return out
  },
}
