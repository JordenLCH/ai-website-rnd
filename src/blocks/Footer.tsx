import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  brand: z.string(),
  columns: z.array(z.object({
    title: z.string(), links: z.array(z.string()).min(1),
  })).min(1).max(4),
  note: z.string().optional(),
})
type P = z.infer<typeof Props>
const layouts = ['columns', 'centered-minimal'] as const

function Footer({ props, layout }: { props: P; layout: string }) {
  return (
    <footer className="block foot" data-layout={layout}>
      <div className="foot__inner">
        <div className="foot__brand">{props.brand}</div>
        <div className="foot__cols">
          {props.columns.map((c) => (
            <div className="foot__col" key={c.title}>
              <h3 className="foot__coltitle">{c.title}</h3>
              <ul>{c.links.map((l) => <li key={l}>{l}</li>)}</ul>
            </div>
          ))}
        </div>
        {props.note && <p className="foot__note">{props.note}</p>}
      </div>
    </footer>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Footer }
