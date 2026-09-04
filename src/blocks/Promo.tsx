import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  kicker: z.string().optional(),
  title: z.string(),
  body: z.string().optional(),
  action: z.object({ label: z.string() }).optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
})
type P = z.infer<typeof Props>
const layouts = ['split-strip', 'centered-strip'] as const

function Promo({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block promo" data-layout={layout}>
      <div className="promo__inner">
        {props.image && <div className="promo__media"><img src={props.image} alt={props.imageAlt ?? ''} /></div>}
        <div className="promo__copy">
          {props.kicker && <p className="eyebrow">{props.kicker}</p>}
          <h2 className="heading promo__title">{props.title}</h2>
          {props.body && <p className="promo__body">{props.body}</p>}
        </div>
        {props.action && <div className="promo__action"><span className="btn btn--primary">{props.action.label}</span></div>}
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Promo }
