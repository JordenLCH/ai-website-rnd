import { z } from 'zod'
import type { CatalogEntry } from './shared'

/** A regulated-industry notice: "this is not legal advice", "no solicitor-client relationship
 *  is created", a safety warning, a pricing caveat.
 *
 *  This is its own block type rather than a RichText variant for one reason: block type is what
 *  the schema generator reads. Put a disclaimer in RichText and it becomes indistinguishable
 *  from marketing prose, so it lands in the page description and the llms.txt summary as though
 *  the firm were claiming it. A distinct type is a thing the generator can deliberately skip. */
const Props = z.object({
  kind: z.enum(['legal', 'regulatory', 'safety', 'pricing']),
  title: z.string().optional(),
  body: z.string().min(1),
  /** Effective date, licence number, governing body — the line under a notice. */
  meta: z.string().optional(),
})
type P = z.infer<typeof Props>
const layouts = ['inline-rule', 'boxed-aside', 'footnote'] as const

function Notice({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block notice" data-layout={layout} data-kind={props.kind} role="note">
      <div className="notice__inner">
        {props.title && <h2 className="notice__title">{props.title}</h2>}
        <p className="notice__body">{props.body}</p>
        {props.meta && <p className="notice__meta">{props.meta}</p>}
      </div>
    </section>
  )
}

export const entry: CatalogEntry<P> = {
  schema: Props, layouts, Component: Notice,
  check(props) {
    const out: string[] = []
    // A notice set as a page's loudest element is a notice nobody reads past.
    if (props.title && props.title.length > 80)
      out.push('notice title over 80 characters — a notice is a footnote, not a section headline')
    return out
  },
}
