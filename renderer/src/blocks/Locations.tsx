import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  items: z.array(z.object({
    name: z.string(), address: z.string(), note: z.string().optional(),
  })).min(1).max(4),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
})
type P = z.infer<typeof Props>
const layouts = ['cards', 'split-panel'] as const

function Locations({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block locations" data-layout={layout}>
      <div className="locations__inner">
        <div className="locations__copy">
          <header className="locations__head">
            {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
            <h2 className="heading">{props.title}</h2>
          </header>
          <div className="locations__items">
            {props.items.map((l) => (
              <div className="loc" key={l.name}>
                <h3 className="loc__name">{l.name}</h3>
                <p className="loc__address">{l.address}</p>
                {l.note && <p className="loc__note">{l.note}</p>}
              </div>
            ))}
          </div>
        </div>
        {props.image && <div className="locations__media"><img src={props.image} alt={props.imageAlt ?? ''} /></div>}
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Locations }
