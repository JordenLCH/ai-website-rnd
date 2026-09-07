import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  items: z.array(z.object({ q: z.string(), a: z.string() })).min(2).max(10),
})
type P = z.infer<typeof Props>
const layouts = ['accordion-stack', 'two-col-list'] as const

function FAQ({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block faq" data-layout={layout}>
      <header className="faq__head">
        {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
        <h2 className="heading">{props.title}</h2>
      </header>
      <div className="faq__items" data-count={props.items.length}>
        {props.items.map((it) => (
          <details className="faq__item" key={it.q}>
            <summary>{it.q}</summary>
            <p>{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: FAQ }
