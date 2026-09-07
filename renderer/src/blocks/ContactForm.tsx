import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  body: z.string().optional(),
  fields: z.array(z.object({
    label: z.string(),
    type: z.enum(['text', 'email', 'tel', 'textarea', 'select']),
    options: z.array(z.string()).optional(),
  })).min(2).max(8),
  action: z.object({ label: z.string() }),
})
type P = z.infer<typeof Props>
const layouts = ['split-form', 'stacked-centered'] as const

function ContactForm({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block form" data-layout={layout}>
      <div className="form__inner">
        <div className="form__copy">
          {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
          <h2 className="heading">{props.title}</h2>
          {props.body && <p className="lede">{props.body}</p>}
        </div>
        <div className="form__fields">
          {props.fields.map((f) => (
            <label className="field" key={f.label} data-type={f.type}>
              <span className="field__label">{f.label}</span>
              {f.type === 'textarea'
                ? <textarea rows={4} />
                : f.type === 'select'
                  ? <select>{(f.options ?? []).map((o) => <option key={o}>{o}</option>)}</select>
                  : <input type={f.type} />}
            </label>
          ))}
          <button type="submit" className="btn btn--primary form__submit">{props.action.label}</button>
        </div>
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: ContactForm }
