import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  title: z.string().optional(),
  items: z.array(z.object({ value: z.string(), label: z.string() })).min(2).max(4),
})
type P = z.infer<typeof Props>
const layouts = ['inline-bar', 'airy-columns', 'boxed-grid'] as const

function Stats({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block stats" data-layout={layout}>
      <div className="stats__inner">
        {props.title && <h2 className="heading stats__title">{props.title}</h2>}
        <div className="stats__items" data-count={props.items.length}>
          {props.items.map((s) => (
            <div className="stat" key={s.label}>
              <div className="stat__value">{s.value}</div>
              <div className="stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Stats }
