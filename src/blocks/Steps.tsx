import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  items: z.array(z.object({ title: z.string(), body: z.string() })).min(2).max(6),
})
type P = z.infer<typeof Props>
const layouts = ['numbered-rail', 'cards-row', 'inline-flow'] as const

function Steps({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block steps" data-layout={layout}>
      <header className="steps__head">
        {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
        <h2 className="heading">{props.title}</h2>
      </header>
      <ol className="steps__items">
        {props.items.map((s, i) => (
          <li className="step" key={s.title}>
            <span className="step__n">{String(i + 1).padStart(2, '0')}</span>
            <div className="step__copy">
              <h3 className="step__title">{s.title}</h3>
              <p className="step__body">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: Steps }
