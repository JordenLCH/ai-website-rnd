import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  items: z.array(z.object({
    name: z.string(), body: z.string().optional(),
    /** Sub-items under one entry — practice sub-services, product variants, included scope.
     *  Without this a list had to be flattened into `meta` as slash-separated prose. */
    points: z.array(z.string()).min(2).max(8).optional(),
    meta: z.string().optional(), tag: z.string().optional(),
    image: z.string(), imageAlt: z.string(),
  })).min(2).max(8),
})
type P = z.infer<typeof Props>
const layouts = ['cards-grid', 'hairline-catalog', 'wide-list'] as const

function CatalogGrid({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block catalog" data-layout={layout}>
      <header className="catalog__head">
        {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
        <h2 className="heading">{props.title}</h2>
      </header>
      <div className="catalog__items" data-count={props.items.length}>
        {props.items.map((it) => (
          <article className="cat" key={it.name}>
            <div className="cat__media">
              <img src={it.image} alt={it.imageAlt} />
              {it.tag && <span className="cat__tag">{it.tag}</span>}
            </div>
            <div className="cat__copy">
              <h3 className="cat__name">{it.name}</h3>
              {it.body && <p className="cat__body">{it.body}</p>}
              {it.points && (
                <ul className="cat__points">
                  {it.points.map((pt) => <li key={pt}>{pt}</li>)}
                </ul>
              )}
              {it.meta && <p className="cat__meta">{it.meta}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: CatalogGrid }
