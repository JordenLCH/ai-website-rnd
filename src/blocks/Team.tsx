import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  items: z.array(z.object({
    name: z.string(), role: z.string(),
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
      <div className="team__items">
        {props.items.map((m) => (
          <div className="member" key={m.name}>
            {m.image && <div className="member__media"><img src={m.image} alt={m.imageAlt ?? ''} /></div>}
            <h3 className="member__name">{m.name}</h3>
            <p className="member__role">{m.role}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Team }
