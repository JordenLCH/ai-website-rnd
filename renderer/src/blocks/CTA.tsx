import { z } from 'zod'
import { hrefFor, type CatalogEntry } from './shared'

const Props = z.object({
  title: z.string(),
  body: z.string().optional(),
  action: z.object({ label: z.string(), page: z.string().optional() }),
  note: z.string().optional(),
})
type P = z.infer<typeof Props>
const layouts = ['hard-panel', 'soft-band', 'centered-poster'] as const

function CTA({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block cta" data-layout={layout}>
      <div className="cta__copy">
        <h2 className="heading">{props.title}</h2>
        {props.body && <p className="lede">{props.body}</p>}
      </div>
      <div className="cta__action">
        {props.action.page
          ? <a className="btn btn--primary" href={hrefFor(props.action.page)}>{props.action.label}</a>
          : <span className="btn btn--primary">{props.action.label}</span>}
        {props.note && <p className="cta__note">{props.note}</p>}
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: CTA }
