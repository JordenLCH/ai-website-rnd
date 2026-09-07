import { z } from 'zod'
import { hrefFor, type CatalogEntry } from './shared'

const Props = z.object({
  brand: z.string(),
  logo: z.string().optional(),
  items: z.array(z.object({ label: z.string(), page: z.string() })).min(2).max(7),
  action: z.object({ label: z.string(), page: z.string().optional() }).optional(),
})
type P = z.infer<typeof Props>
const layouts = ['inline-left', 'centered-stack', 'split-rail'] as const

function Nav({ props, layout }: { props: P; layout: string }) {
  return (
    <nav className="block nav" data-layout={layout}>
      <div className="nav__inner">
        <div className="nav__brand">
          {props.logo ? <img src={props.logo} alt={props.brand} /> : <span>{props.brand}</span>}
        </div>
        <ul className="nav__items">
          {props.items.map((i) => <li key={i.page}><a href={hrefFor(i.page)} data-page={i.page}>{i.label}</a></li>)}
        </ul>
        {props.action && (props.action.page
          ? <a className="btn btn--primary nav__cta" href={hrefFor(props.action.page)}>{props.action.label}</a>
          : <span className="btn btn--primary nav__cta">{props.action.label}</span>)}
      </div>
    </nav>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Nav }
