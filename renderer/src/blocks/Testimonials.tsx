import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  items: z.array(z.object({ quote: z.string(), author: z.string(), role: z.string().optional() })).min(1).max(6),
})
type P = z.infer<typeof Props>
const layouts = ['single-large', 'two-col', 'quote-row'] as const

function Testimonials({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block quotes" data-layout={layout}>
      {(props.title || props.eyebrow) && (
        <header className="quotes__head">
          {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
          {props.title && <h2 className="heading">{props.title}</h2>}
        </header>
      )}
      <div className="quotes__items">
        {props.items.map((q, i) => (
          <figure className="quote" key={i}>
            <blockquote>{q.quote}</blockquote>
            <figcaption>{q.author}{q.role && <span className="quote__role">{q.role}</span>}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Testimonials }
