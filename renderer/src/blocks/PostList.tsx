import { z } from 'zod'
import type { CatalogEntry } from './shared'

const Props = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  items: z.array(z.object({
    title: z.string(), excerpt: z.string().optional(), meta: z.string(),
    image: z.string().optional(), imageAlt: z.string().optional(),
  })).min(2).max(6),
})
type P = z.infer<typeof Props>
const layouts = ['cards-three', 'list-rows'] as const

function PostList({ props, layout }: { props: P; layout: string }) {
  return (
    <section className="block posts" data-layout={layout}>
      <header className="posts__head">
        {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
        <h2 className="heading">{props.title}</h2>
      </header>
      <div className="posts__items" data-count={props.items.length}>
        {props.items.map((p) => (
          <article className="post" key={p.title}>
            {p.image && <div className="post__media"><img src={p.image} alt={p.imageAlt ?? ''} /></div>}
            <div className="post__copy">
              <p className="post__meta">{p.meta}</p>
              <h3 className="post__title">{p.title}</h3>
              {p.excerpt && <p className="post__excerpt">{p.excerpt}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
export const entry: CatalogEntry<P> = { schema: Props, layouts, Component: PostList }
