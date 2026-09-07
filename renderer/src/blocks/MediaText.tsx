import { z } from 'zod'
import { hrefFor, type CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  body: z.array(z.string()).min(1),
  image: z.string(),
  imageAlt: z.string(),
  action: z.object({ label: z.string(), page: z.string().optional() }).optional(),
})
type P = z.infer<typeof Props>
const layouts = ['image-right', 'image-left', 'overlap-offset'] as const

function MediaText({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block mediatext" data-layout={layout}>
      <div className="mediatext__inner">
        <div className="mediatext__media"><img src={props.image} alt={props.imageAlt} /></div>
        <div className="mediatext__copy">
          {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
          <h2 className="heading">{props.title}</h2>
          {props.body.map((p, i) => <p className="prose" key={i}>{p}</p>)}
          {props.action && <div className="actions">{props.action.page
            ? <a className="btn btn--primary" href={hrefFor(props.action.page)}>{props.action.label}</a>
            : <span className="btn btn--primary">{props.action.label}</span>}</div>}
        </div>
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: MediaText }
