import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  groups: z.array(z.object({
    label: z.string(),
    rows: z.array(z.object({ k: z.string(), v: z.string() })).min(1),
  })).min(1).max(6),
})
type P = z.infer<typeof Props>
const layouts = ['stacked-rows', 'two-col-groups', 'compact-hairline'] as const

function SpecTable({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block spec" data-layout={layout}>
      <header className="spec__head">
        {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
        <h2 className="heading">{props.title}</h2>
      </header>
      <div className="spec__groups">
        {props.groups.map((g) => (
          <div className="spec__group" key={g.label}>
            <h3 className="spec__label">{g.label}</h3>
            <dl className="spec__rows">
              {g.rows.map((r) => (
                <div className="spec__row" key={r.k}>
                  <dt>{r.k}</dt><dd>{r.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: SpecTable }
