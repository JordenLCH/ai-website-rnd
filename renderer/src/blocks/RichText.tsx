import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  paragraphs: z.array(z.string()).min(1),
  aside: z.string().optional(),
})
type P = z.infer<typeof Props>
const layouts = ['prose-narrow', 'two-col-prose', 'lead-aside'] as const

function RichText({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block rich" data-layout={layout}>
      <div className="rich__inner">
        <div className="rich__head">
          {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
          {props.title && <h2 className="heading">{props.title}</h2>}
        </div>
        <div className="rich__body">
          {props.paragraphs.map((p, i) => <p className="prose" key={i}>{p}</p>)}
        </div>
        {props.aside && <aside className="rich__aside">{props.aside}</aside>}
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: RichText }
