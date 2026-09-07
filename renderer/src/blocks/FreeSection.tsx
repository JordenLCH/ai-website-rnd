import { useEffect, useRef } from 'react'
import { z } from 'zod'
import type { CatalogEntry } from './shared'
import { NodeSchema, Render, depth, walk, type Node } from './primitives'
import { armMotion } from '../motion'

const Props = z.object({
  /** Semantic role survives free composition — JSON-LD and house rules depend on it. */
  role: z.enum(['hero', 'proof', 'range', 'story', 'spec', 'quote', 'process', 'contact', 'cta', 'nav', 'footer', 'media']),
  grid: z.object({
    cols: z.number().int().min(1).max(12).default(12),
    gap: z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl']).default('md'),
    align: z.enum(['start', 'center', 'end', 'stretch']).default('start'),
    minH: z.string().optional(),
    pad: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
    bleed: z.boolean().optional(),
  }),
  bg: z.object({
    image: z.string(), alt: z.string().default(''),
    kind: z.enum(['environment', 'cutout', 'detail']),
    overlay: z.boolean().default(true),
    parallax: z.number().min(0).max(1).default(0),
  }).optional(),
  children: z.array(NodeSchema).min(1),
})
type P = z.infer<typeof Props>
const layouts = ['free'] as const

const MAX_DEPTH = 5

function FreeSection({ props }: { props: P; layout: string }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!ref.current) return
    return armMotion(ref.current, ref.current.closest('.stage') as HTMLElement | null)
  }, [props])

  const { grid, bg, children } = props
  return (
    <section
      ref={ref}
      className="block free"
      data-role={props.role}
      data-gap={grid.gap} data-pad={grid.pad} data-align={grid.align}
      data-bleed={grid.bleed ? 'true' : 'false'}
      style={{ ['--cols' as any]: grid.cols, ['--min-h' as any]: grid.minH ?? 'auto' }}
    >
      {bg && (
        <div className="free__bg" data-overlay={bg.overlay ? 'true' : 'false'}
          {...(bg.parallax ? { 'data-parallax': String(bg.parallax) } : {})}>
          <img src={bg.image} alt={bg.alt} />
        </div>
      )}
      <div className="free__grid">
        {children.map((c: Node, i) => <Render node={c} key={i} />)}
      </div>
    </section>
  )
}

export const entry: CatalogEntry<P> = {
  schema: Props, layouts, Component: FreeSection,
  /** House rules — what stops free composition becoming slop. */
  check(props) {
    const out: string[] = []
    const nodes: Node[] = []
    props.children.forEach((c) => walk(c, (n) => nodes.push(n)))

    const d = Math.max(...props.children.map((c) => depth(c)))
    if (d > MAX_DEPTH) out.push(`nesting depth ${d} exceeds ${MAX_DEPTH} — flatten it`)

    const h1 = nodes.filter((n: any) => n.el === 'Heading' && n.level === 1).length
    if (props.role === 'hero' && h1 !== 1) out.push(`hero must contain exactly one level-1 Heading, found ${h1}`)
    if (props.role !== 'hero' && h1 > 0) out.push(`only the hero may use a level-1 Heading`)

    if (props.bg?.overlay && props.bg.kind !== 'environment')
      out.push(`background overlay needs an "environment" image, got "${props.bg.kind}"`)

    // Display size is a typographic claim: one per section, or the page has no hierarchy.
    // Stats are exempt — a row of large figures is one gesture, not four competing ones,
    // and capping them at one is what forced proof bands to render as body text.
    const displays = nodes.filter((n: any) => n.size === 'display' && n.el !== 'Stat').length
    if (displays > 1) out.push(`${displays} display-size headings in one section — at most 1 (Stat is exempt)`)

    const motions = nodes.filter((n: any) => n.motion).length
    if (motions > 8) out.push(`${motions} animated nodes in one section — cap is 8, it reads as noise`)

    // The message told authors to use role "story" for long-form copy, but the check never
    // exempted it — so the only escape it offered did not work.
    if (props.role !== 'story') {
      const bodyText = nodes.filter((n: any) => n.el === 'Text' && (n.size ?? 'body') !== 'small')
      if (bodyText.some((n: any) => (n.text as string).length > 420))
        out.push(`a Text node exceeds 420 characters — split it or use role "story"`)
    }

    return out
  },
}
