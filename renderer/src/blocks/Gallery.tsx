import { z } from 'zod'
import type { CatalogEntry, Deprecation } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  items: z.array(z.object({
    image: z.string(), imageAlt: z.string(), caption: z.string().optional(),
    /** What the photograph *is*, not how this placement uses it — the same enum every
     *  other block declares. Gallery was the one block that opted out by omission, so
     *  the rule against cut-outs on a dark ground could not see gallery images at all. */
    kind: z.enum(['environment', 'cutout', 'detail']),
    /** Focal point, author-declared. Every platform surveyed (Sanity hotspot, Storyblok
     *  focus, Contentful, Cloudinary gravity) treats this as set by a person, with
     *  detection only as a fallback — a crop that removes the subject is not a bug the
     *  renderer can reason its way out of. */
    focus: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
  })).min(3).max(9),
})
type P = z.infer<typeof Props>
const layouts = ['mosaic', 'uniform-grid', 'filmstrip'] as const

function Gallery({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block gallery" data-layout={layout}>
      {(props.title || props.eyebrow) && (
        <header className="gallery__head">
          {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
          {props.title && <h2 className="heading">{props.title}</h2>}
        </header>
      )}
      <div className="gallery__items" data-count={props.items.length}>
        {props.items.map((it, i) => (
          <figure className="gallery__item" key={i} data-i={i} data-kind={it.kind}>
            <img src={it.image} alt={it.imageAlt}
              style={it.focus ? { objectPosition: `${it.focus.x * 100}% ${it.focus.y * 100}%` } : undefined} />
            {it.caption && <figcaption>{it.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  )
}
/** No check on cut-outs in `mosaic`: the renderer now gives a cut-out item a plate and
 *  `object-fit: contain`, so it is no longer clipped. A rule telling authors to route
 *  around a layout defect is a worse fix than repairing the layout. */
/** 2026-09-07: `kind` became required on gallery items. Bundles written before that date have
 *  items with no kind at all, and there are live sites in that shape.
 *
 *  The migration defaults to `environment` because that is the reading under which the renderer
 *  behaves as it always did — full-bleed cover crop, no plate. A wrong guess of `cutout` would
 *  visibly change an existing page; a wrong guess of `environment` preserves it exactly. When a
 *  migration has to guess, guess in the direction that leaves the rendered page unchanged. */
const kindBecameRequired: Deprecation<P> = {
  note: '2026-09-07: gallery items gained a required `kind`; pre-dated items default to environment',
  schema: z.object({
    eyebrow: z.string().optional(),
    title: z.string().optional(),
    items: z.array(z.object({
      image: z.string(), imageAlt: z.string(), caption: z.string().optional(),
    })).min(3).max(9),
  }),
  migrate: (old) => ({
    ...old,
    items: old.items.map((it: any) => ({ ...it, kind: 'environment' as const })),
  }),
}

export const entry: CatalogEntry<P> = {
  schema: Props, layouts, Component: Gallery,
  deprecated: [kindBecameRequired],
}
