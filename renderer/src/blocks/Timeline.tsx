import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  items: z.array(z.object({ marker: z.string(), title: z.string(), body: z.string() })).min(2).max(8),
})
type P = z.infer<typeof Props>
const layouts = ['vertical-rail', 'horizontal-steps'] as const

function Timeline({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block timeline" data-layout={layout}>
      <header className="timeline__head">
        {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
        <h2 className="heading">{props.title}</h2>
      </header>
      <ol className="timeline__items" data-count={props.items.length}>
        {props.items.map((it) => (
          <li className="tl" key={it.marker}>
            <div className="tl__marker">{it.marker}</div>
            <div className="tl__copy">
              <h3 className="tl__title">{it.title}</h3>
              <p className="tl__body">{it.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Timeline }
