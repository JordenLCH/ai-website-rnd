import { z } from 'zod'
import { hrefFor, type CatalogEntry } from './shared'

const Props = z.object({
  brand: z.string(),
  logo: z.string().optional(),
  /** A thin row above the main bar: phone, email, a portal login, a language. This is the
   *  standard way a client's phone number reaches every page without stealing a slot from
   *  `items`, which is capped at 7 because a nav wider than that stops being scannable. */
  utility: z.array(z.object({ label: z.string(), page: z.string().optional() })).min(1).max(4).optional(),
  items: z.array(z.object({
    label: z.string(),
    page: z.string(),
    /** A submenu, so a twelve-page site can still show five top-level items. CSS-only:
     *  it opens on hover *and* on `:focus-within`, so it is reachable by keyboard. */
    children: z.array(z.object({ label: z.string(), page: z.string() })).min(2).max(8).optional(),
  })).min(2).max(7),
  action: z.object({ label: z.string(), page: z.string().optional() }).optional(),
  /** The page key this nav is rendered on, so the current item can be marked. The renderer
   *  passes it; a stored bundle never sets it. */
  currentPage: z.string().optional(),
})
type P = z.infer<typeof Props>
const layouts = ['inline-left', 'split-rail'] as const

function Nav({ props, layout }: { props: P; layout: string }) {
  const current = props.currentPage
  return (
    <nav className="block nav" data-layout={layout} aria-label="Main">
      {props.utility && (
        <div className="nav__utility">
          <ul>
            {props.utility.map((u) => (
              <li key={u.label}>
                {u.page ? <a href={hrefFor(u.page)}>{u.label}</a> : <span>{u.label}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="nav__inner">
        <div className="nav__brand">
          {props.logo ? <img src={props.logo} alt={props.brand} /> : <span>{props.brand}</span>}
        </div>

        {/* A menu that opens with no JavaScript, because the build farm ships static HTML and a
            script is one more thing that can fail to load on the page a visitor arrives on. The
            checkbox holds the state; the label is the button. Both are hidden above 900px. */}
        <input className="nav__toggle" type="checkbox" id="nav-toggle" hidden />
        <label className="nav__burger" htmlFor="nav-toggle" aria-hidden="true">
          <span /><span /><span />
        </label>

        <ul className="nav__items">
          {props.items.map((i) => (
            <li key={i.page + i.label} className={i.children ? 'nav__item nav__item--has-menu' : 'nav__item'}>
              <a
                href={hrefFor(i.page)}
                data-page={i.page}
                aria-current={current && current === i.page ? 'page' : undefined}
              >{i.label}</a>
              {i.children && (
                <ul className="nav__menu">
                  {i.children.map((c) => (
                    <li key={c.page + c.label}>
                      <a
                        href={hrefFor(c.page)}
                        data-page={c.page}
                        aria-current={current && current === c.page ? 'page' : undefined}
                      >{c.label}</a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {props.action && (props.action.page
          ? <a className="btn btn--primary nav__cta" href={hrefFor(props.action.page)}>{props.action.label}</a>
          : <span className="btn btn--primary nav__cta">{props.action.label}</span>)}
      </div>
    </nav>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Nav }
