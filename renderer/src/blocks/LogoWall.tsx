import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  title: z.string().optional(),
  items: z.array(z.object({ label: z.string(), note: z.string().optional() })).min(3).max(10),
})
type P = z.infer<typeof Props>
const layouts = ['hairline-row', 'muted-grid'] as const

function LogoWall({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block logos" data-layout={layout}>
      <div className="logos__inner">
        {props.title && <p className="eyebrow logos__title">{props.title}</p>}
        <ul className="logos__items" data-count={props.items.length}>
          {props.items.map((i) => (
            <li key={i.label}><span className="logos__label">{i.label}</span>{i.note && <span className="logos__note">{i.note}</span>}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: LogoWall }
