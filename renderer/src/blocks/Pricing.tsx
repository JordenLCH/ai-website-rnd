import { z } from 'zod'
import { hrefFor, type CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  tiers: z.array(z.object({
    name: z.string(), price: z.string(), unit: z.string().optional(),
    body: z.string().optional(), features: z.array(z.string()).min(1),
    action: z.object({ label: z.string(), page: z.string().optional() }), featured: z.boolean().optional(),
  })).min(2).max(4),
})
type P = z.infer<typeof Props>
const layouts = ['cards-tiers', 'table-compare'] as const

/** A comparison table needs a shared axis, and the schema has none — `features` is a free-text
 *  list per tier. So the axis is derived: the union of every tier's features, in the order they
 *  first appear, with a mark per tier for the ones it carries.
 *
 *  This is why "table-compare" previously rendered the same three stacked tier columns as
 *  cards-tiers with borders on them: there was nothing to compare *across*, only three lists side
 *  by side, which is what a reader has to do the comparing in their own head. Deriving the axis
 *  means tiers that share wording compare correctly with no bundle change, and a feature unique to
 *  one tier still earns a row — which is itself the useful signal. */
function CompareTable({ tiers }: { tiers: P['tiers'] }) {
  const rows: string[] = []
  for (const t of tiers) for (const f of t.features) if (!rows.includes(f)) rows.push(f)
  return (
    <table className="pricing__table">
      <thead>
        <tr>
          <th scope="col"><span className="u-hidden">Feature</span></th>
          {tiers.map((t) => (
            <th scope="col" key={t.name} data-featured={t.featured ? 'true' : 'false'}>
              <span className="tier__name">{t.name}</span>
              <span className="tier__price">{t.price}{t.unit && <em>{t.unit}</em>}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((f) => (
          <tr key={f}>
            <th scope="row">{f}</th>
            {tiers.map((t) => (
              <td key={t.name} data-tier={t.name} data-has={t.features.includes(f) ? 'true' : 'false'}>
                <span aria-hidden="true">{t.features.includes(f) ? '\u2713' : '\u2013'}</span>
                <span className="u-hidden">{t.features.includes(f) ? 'included' : 'not included'}</span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td />
          {tiers.map((t) => (
            <td key={t.name}>
              {t.action.page
                ? <a className="btn btn--primary" href={hrefFor(t.action.page)}>{t.action.label}</a>
                : <span className="btn btn--primary">{t.action.label}</span>}
            </td>
          ))}
        </tr>
      </tfoot>
    </table>
  )
}

function Pricing({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block pricing" data-layout={layout}>
      <header className="pricing__head">
        {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
        <h2 className="heading">{props.title}</h2>
      </header>
      {layout === 'table-compare' ? <CompareTable tiers={props.tiers} /> : (
      <div className="pricing__tiers" data-count={props.tiers.length}>
        {props.tiers.map((t) => (
          <div className="tier" key={t.name} data-featured={t.featured ? 'true' : 'false'}>
            <h3 className="tier__name">{t.name}</h3>
            <p className="tier__price"><span>{t.price}</span>{t.unit && <em>{t.unit}</em>}</p>
            {t.body && <p className="tier__body">{t.body}</p>}
            <ul className="tier__features">{t.features.map((f) => <li key={f}>{f}</li>)}</ul>
            {t.action.page
              ? <a className="btn btn--primary tier__cta" href={hrefFor(t.action.page)}>{t.action.label}</a>
              : <span className="btn btn--primary tier__cta">{t.action.label}</span>}
          </div>
        ))}
      </div>
      )}
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Pricing }
