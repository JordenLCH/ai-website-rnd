import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  title: z.string().optional(),
  /** A logo wall with no logos in it is a list of words, which is what this block rendered: the
   *  schema had no way to carry an image at all, so the name promised something it could not
   *  express. `image` is optional because a client often has permission to name a partner and no
   *  asset for them — the label then stands in, as it always did. */
  items: z.array(z.object({
    label: z.string(), note: z.string().optional(),
    image: z.string().optional(), imageAlt: z.string().optional(),
  })).min(3).max(10),
})
type P = z.infer<typeof Props>
const layouts = ['hairline-row', 'muted-grid'] as const

function LogoWall({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block logos" data-layout={layout}>
      <div className="logos__inner">
        {props.title && <p className="eyebrow logos__title">{props.title}</p>}
        <ul className="logos__items" data-count={props.items.length}>
          {props.items.map((i) => (
            <li key={i.label}>
              {/* alt="" when the label is right there: the mark and the words are one thing, and
                  announcing both reads the name twice. */}
              {i.image && <img className="logos__img" src={i.image} alt={i.imageAlt ?? ''} />}
              <span className="logos__label">{i.label}</span>
              {i.note && <span className="logos__note">{i.note}</span>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: LogoWall }
