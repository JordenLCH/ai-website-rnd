import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  items: z.array(z.object({
    title: z.string(), body: z.string(),
    image: z.string().optional(), imageAlt: z.string().optional(),
  })).min(2).max(6),
})
type P = z.infer<typeof Props>
const layouts = ['grid-hairline', 'alternating-rows', 'cards-soft', 'text-columns'] as const

function Features({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block features" data-layout={layout}>
      <header className="features__head">
        {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
        <h2 className="heading">{props.title}</h2>
      </header>
      <div className="features__items" data-count={props.items.length}>
        {props.items.map((it, i) => (
          <article className="feature" key={it.title} data-index={i % 2}>
            {it.image && <div className="feature__media"><img src={it.image} alt={it.imageAlt ?? ''} /></div>}
            <div className="feature__copy">
              <h3 className="feature__title">{it.title}</h3>
              <p className="feature__body">{it.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Features }
