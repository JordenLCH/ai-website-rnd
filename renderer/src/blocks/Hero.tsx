import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  /** A trail belongs inside the hero, above the eyebrow. As its own section it pushes
   *  the headline down the page for the sake of two words of orientation. */
  breadcrumb: z.array(z.object({ label: z.string(), page: z.string().optional() })).min(2).max(5).optional(),
  eyebrow: z.string().optional(),
  title: z.string(),
  body: z.string().optional(),
  actions: z.array(z.object({ label: z.string(), kind: z.enum(['primary', 'ghost']) })).max(2).default([]),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  /** What the photo actually is. Overlay layouts need something you can put text on. */
  imageKind: z.enum(['environment', 'cutout', 'detail']).default('environment'),
})
type P = z.infer<typeof Props>
const layouts = ['overlay-fullbleed', 'split-editorial', 'centered-poster', 'stacked-title'] as const

function Hero({ props, layout }: { props: P; layout: string }) {
  const { breadcrumb, eyebrow, title, body, actions, image, imageAlt } = props
  return (
    <section className="block hero" data-layout={layout}>
      {image && (
        <div className="hero__media"><img src={image} alt={imageAlt ?? ''} /></div>
      )}
      <div className="hero__copy">
        {breadcrumb && (
          <nav className="hero__crumbs">
            {breadcrumb.map((c, i) => (
              <span key={c.label}>
                {c.page ? <a data-page={c.page}>{c.label}</a> : <em>{c.label}</em>}
                {i < breadcrumb.length - 1 && <i aria-hidden="true">/</i>}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="display">{title}</h1>
        {body && <p className="lede">{body}</p>}
        {actions.length > 0 && (
          <div className="actions">
            {actions.map((a) => <span key={a.label} className={`btn btn--${a.kind}`}>{a.label}</span>)}
          </div>
        )}
      </div>
    </section>
  )
}
const OVERLAY_LAYOUTS = ['overlay-fullbleed']

export const entry: CatalogEntry<P> = {
  schema: Props, layouts, Component: Hero,
  check(props, layout) {
    const out: string[] = []
    if (OVERLAY_LAYOUTS.includes(layout)) {
      if (!props.image) out.push(`layout "${layout}" needs an image`)
      else if (props.imageKind !== 'environment')
        out.push(`layout "${layout}" overlays text on the photo, but imageKind is "${props.imageKind}" — needs "environment"`)
    }
    return out
  },
}
