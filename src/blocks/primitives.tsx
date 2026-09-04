import { z } from 'zod'

/** ~14 primitives. Every visual value is a token name, never a raw value. */
export const EL = [
  'Stack', 'Row', 'Grid', 'Card',
  'Heading', 'Text', 'Eyebrow', 'Quote',
  'Button', 'Image', 'Stat', 'List', 'Divider', 'Spacer', 'Field',
] as const

const Scale = z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl'])
const Motion = z.object({
  type: z.enum(['fade-up', 'fade', 'reveal-clip', 'scale-in', 'slide-left', 'slide-right']),
  delay: z.number().min(0).max(1200).optional(),
})

const Base = {
  area: z.string().optional(),          // grid-area shorthand "r/c/r/c"
  span: z.number().int().min(1).max(12).optional(),
  gap: Scale.optional(),
  pad: Scale.optional(),
  align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  justify: z.enum(['start', 'center', 'end', 'between']).optional(),
  maxw: z.enum(['prose', 'narrow', 'full']).optional(),
  tone: z.enum(['ink', 'muted', 'accent']).optional(),
  motion: Motion.optional(),
  parallax: z.number().min(-1).max(1).optional(),
}

export type Node = { el: string; children?: Node[]; [k: string]: unknown }

export const NodeSchema: z.ZodType<Node> = z.lazy(() =>
  z.discriminatedUnion('el', [
    z.object({ el: z.literal('Stack'), ...Base, children: z.array(NodeSchema).min(1) }),
    z.object({ el: z.literal('Row'), ...Base, wrap: z.boolean().optional(), children: z.array(NodeSchema).min(1) }),
    z.object({ el: z.literal('Grid'), ...Base, cols: z.number().int().min(2).max(12), children: z.array(NodeSchema).min(1) }),
    z.object({ el: z.literal('Card'), ...Base, border: z.boolean().optional(), children: z.array(NodeSchema).min(1) }),
    z.object({ el: z.literal('Heading'), ...Base, level: z.number().int().min(1).max(6),
      size: z.enum(['display', 'heading', 'title', 'body']), text: z.string() }),
    z.object({ el: z.literal('Text'), ...Base, size: z.enum(['lede', 'body', 'small']).optional(), text: z.string(), page: z.string().optional() }),
    z.object({ el: z.literal('Eyebrow'), ...Base, text: z.string() }),
    z.object({ el: z.literal('Quote'), ...Base, text: z.string(), author: z.string().optional(), role: z.string().optional(),
      size: z.enum(['display', 'heading', 'body']).optional() }),
    z.object({ el: z.literal('Button'), ...Base, label: z.string(), kind: z.enum(['primary', 'ghost']), page: z.string().optional() }),
    z.object({ el: z.literal('Image'), ...Base, src: z.string(), alt: z.string(),
      kind: z.enum(['environment', 'cutout', 'detail']), ratio: z.enum(['square', 'portrait', 'landscape', 'wide', 'fill']).optional() }),
    z.object({ el: z.literal('Stat'), ...Base, value: z.string(), label: z.string(),
      size: z.enum(['display', 'heading']).optional() }),
    z.object({ el: z.literal('List'), ...Base, items: z.array(z.string()).min(1),
      style: z.enum(['plain', 'dashed', 'rows']).optional() }),
    z.object({ el: z.literal('Divider'), ...Base }),
    z.object({ el: z.literal('Spacer'), ...Base, size: Scale }),
    z.object({ el: z.literal('Field'), ...Base, label: z.string(),
      type: z.enum(['text', 'email', 'tel', 'textarea', 'select']),
      options: z.array(z.string()).optional(), required: z.boolean().optional() }),
  ]),
)

const cls = (...xs: (string | false | undefined)[]) => xs.filter(Boolean).join(' ')

function boxProps(n: any) {
  const style: Record<string, string> = {}
  if (n.area) style.gridArea = n.area
  if (n.span) style.gridColumn = `span ${n.span}`
  if (n.motion?.delay) style['--motion-delay'] = `${n.motion.delay}ms`
  const data: Record<string, string> = {}
  if (n.motion) data['data-motion'] = n.motion.type
  if (n.parallax) data['data-parallax'] = String(n.parallax)
  if (n.page) data['data-page'] = n.page
  return {
    style,
    ...data,
    'data-pgap': n.gap, 'data-ppad': n.pad, 'data-palign': n.align,
    'data-pjustify': n.justify, 'data-pmaxw': n.maxw, 'data-ptone': n.tone,
  }
}

export function Render({ node }: { node: Node }): React.ReactElement | null {
  const n = node as any
  const b = boxProps(n)
  const kids = (n.children as Node[] | undefined)?.map((c, i) => <Render node={c} key={i} />)

  switch (n.el) {
    case 'Stack': return <div className="p-stack" {...b}>{kids}</div>
    case 'Row': return <div className={cls('p-row', n.wrap && 'p-row--wrap')} {...b}>{kids}</div>
    case 'Grid': return <div className="p-grid" {...b} style={{ ...b.style, ['--cols' as any]: n.cols }}>{kids}</div>
    case 'Card': return <div className={cls('p-card', n.border === false && 'p-card--plain')} {...b}>{kids}</div>
    case 'Heading': {
      const H = `h${n.level}` as any
      return <H className={`p-h p-h--${n.size}`} {...b}>{n.text}</H>
    }
    case 'Text': return <p className={cls('p-text', `p-text--${n.size ?? 'body'}`, n.page && 'p-link')} {...b}>{n.text}</p>
    case 'Eyebrow': return <p className="p-eyebrow" {...b}>{n.text}</p>
    case 'Quote': return (
      <figure className={`p-quote p-quote--${n.size ?? 'heading'}`} {...b}>
        <blockquote>{n.text}</blockquote>
        {(n.author || n.role) && <figcaption>{n.author}{n.role && <span>{n.role}</span>}</figcaption>}
      </figure>
    )
    case 'Button': return <span className={`btn btn--${n.kind}`} {...b}>{n.label}</span>
    case 'Image': return (
      <div className={`p-img p-img--${n.ratio ?? 'landscape'}`} {...b}>
        <img src={n.src} alt={n.alt} />
      </div>
    )
    case 'Stat': return (
      <div className={`p-stat p-stat--${n.size ?? 'heading'}`} {...b}>
        <div className="p-stat__v">{n.value}</div><div className="p-stat__l">{n.label}</div>
      </div>
    )
    case 'List': return (
      <ul className={`p-list p-list--${n.style ?? 'plain'}`} {...b}>
        {n.items.map((it: string) => <li key={it}>{it}</li>)}
      </ul>
    )
    case 'Field': return (
      <label className={`p-field p-field--${n.type}`} {...b}>
        <span className="p-field__label">{n.label}{n.required && <i aria-hidden="true">*</i>}</span>
        {n.type === 'textarea'
          ? <textarea rows={4} />
          : n.type === 'select'
            ? <select>{(n.options ?? []).map((o: string) => <option key={o}>{o}</option>)}</select>
            : <input type={n.type} />}
      </label>
    )
    case 'Divider': return <hr className="p-divider" {...b} />
    case 'Spacer': return <div className="p-spacer" {...b} data-size={n.size} />
    default: return null
  }
}

export function depth(n: Node, d = 1): number {
  const kids = (n as any).children as Node[] | undefined
  if (!kids?.length) return d
  return Math.max(...kids.map((k) => depth(k, d + 1)))
}

export function walk(n: Node, fn: (n: Node) => void) {
  fn(n)
  const kids = (n as any).children as Node[] | undefined
  kids?.forEach((k) => walk(k, fn))
}
