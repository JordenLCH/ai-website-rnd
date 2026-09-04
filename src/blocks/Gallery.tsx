import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  items: z.array(z.object({ image: z.string(), imageAlt: z.string(), caption: z.string().optional() })).min(3).max(9),
})
type P = z.infer<typeof Props>
const layouts = ['mosaic', 'uniform-grid', 'filmstrip'] as const

function Gallery({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block gallery" data-layout={layout}>
      {(props.title || props.eyebrow) && (
        <header className="gallery__head">
          {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
          {props.title && <h2 className="heading">{props.title}</h2>}
        </header>
      )}
      <div className="gallery__items">
        {props.items.map((it, i) => (
          <figure className="gallery__item" key={i} data-i={i}>
            <img src={it.image} alt={it.imageAlt} />
            {it.caption && <figcaption>{it.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Gallery }
