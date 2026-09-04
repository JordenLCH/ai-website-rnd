import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  tiers: z.array(z.object({
    name: z.string(), price: z.string(), unit: z.string().optional(),
    body: z.string().optional(), features: z.array(z.string()).min(1),
    action: z.object({ label: z.string() }), featured: z.boolean().optional(),
  })).min(2).max(4),
})
type P = z.infer<typeof Props>
const layouts = ['cards-tiers', 'table-compare'] as const

function Pricing({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block pricing" data-layout={layout}>
      <header className="pricing__head">
        {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
        <h2 className="heading">{props.title}</h2>
      </header>
      <div className="pricing__tiers">
        {props.tiers.map((t) => (
          <div className="tier" key={t.name} data-featured={t.featured ? 'true' : 'false'}>
            <h3 className="tier__name">{t.name}</h3>
            <p className="tier__price"><span>{t.price}</span>{t.unit && <em>{t.unit}</em>}</p>
            {t.body && <p className="tier__body">{t.body}</p>}
            <ul className="tier__features">{t.features.map((f) => <li key={f}>{f}</li>)}</ul>
            <span className="btn btn--primary tier__cta">{t.action.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Pricing }
