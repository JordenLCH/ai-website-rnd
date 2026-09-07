import { z } from 'zod'
import { hrefFor, type CatalogEntry } from './shared'

const Props = z.object({
  items: z.array(z.object({ label: z.string(), page: z.string().optional() })).min(2).max(5),
})
type P = z.infer<typeof Props>
const layouts = ['inline', 'boxed'] as const

function Breadcrumb({ props, layout }: { props: P; layout: string }) {
  return (
    <nav className="block crumbs" data-layout={layout}>
      <ol className="crumbs__items">
        {props.items.map((c, i) => (
          <li key={c.label}>
            {c.page ? <a href={hrefFor(c.page)} data-page={c.page}>{c.label}</a> : <span>{c.label}</span>}
            {i < props.items.length - 1 && <i aria-hidden="true">/</i>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Breadcrumb }
