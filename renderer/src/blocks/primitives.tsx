import { useEffect, useRef } from 'react'
import { z } from 'zod'
import { hrefFor } from './shared'

/** ~14 primitives. Every visual value is a token name, never a raw value. */
export const EL = [
  'Stack', 'Row', 'Grid', 'Card', 'Figure',
  'Heading', 'Text', 'Eyebrow', 'Quote', 'Caption',
  'Button', 'Image', 'Stat', 'List', 'Divider', 'Spacer', 'Field',
  'Badge', 'Marker', 'KeyValue', 'Carousel',
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
  /** See BlockSchema.unverified — the same provenance mark, at node granularity, so a
   *  single invented figure inside an otherwise sourced section can be flagged alone. */
  unverified: z.boolean().optional(),
}

export type Node = { el: string; children?: Node[]; [k: string]: unknown }

export const NodeSchema: z.ZodType<Node> = z.lazy(() =>
  z.discriminatedUnion('el', [
    z.object({ el: z.literal('Stack'), ...Base, children: z.array(NodeSchema).min(1) }),
    z.object({ el: z.literal('Row'), ...Base, wrap: z.boolean().optional(), children: z.array(NodeSchema).min(1) }),
    z.object({ el: z.literal('Grid'), ...Base, cols: z.number().int().min(2).max(12), children: z.array(NodeSchema).min(1) }),
    z.object({ el: z.literal('Card'), ...Base, border: z.boolean().optional(), children: z.array(NodeSchema).min(1) }),
    z.object({ el: z.literal('Heading'), ...Base, level: z.number().int().min(1).max(6),
      size: z.enum(['display', 'heading', 'title', 'body']), text: z.string(),
      /** A verbatim substring of `text` to set in the accent colour. Not markup — a
       *  substring, so the heading stays one string for outline and JSON-LD extraction. */
      accent: z.string().optional() }),
    z.object({ el: z.literal('Text'), ...Base, size: z.enum(['lede', 'body', 'small']).optional(), text: z.string(),
      accent: z.string().optional(), page: z.string().optional() }),
    z.object({ el: z.literal('Eyebrow'), ...Base, text: z.string() }),
    z.object({ el: z.literal('Quote'), ...Base, text: z.string(), author: z.string().optional(), role: z.string().optional(),
      size: z.enum(['display', 'heading', 'body']).optional() }),
    z.object({ el: z.literal('Button'), ...Base, label: z.string(), kind: z.enum(['primary', 'ghost']), page: z.string().optional() }),
    z.object({ el: z.literal('Image'), ...Base, src: z.string(), alt: z.string(),
      kind: z.enum(['environment', 'cutout', 'detail']), ratio: z.enum(['square', 'portrait', 'landscape', 'wide', 'fill']).optional() }),
    z.object({ el: z.literal('Stat'), ...Base, value: z.string(), label: z.string(),
      size: z.enum(['display', 'heading']).optional() }),
    /* A list item is a string, or a string with somewhere to go.
     *
     *  Footer link columns are lists, and until an item could carry a destination the only way to
     *  build one was a stack of Text nodes — so every generated footer listed its services as
     *  dead text and the site's internal linking came to whatever the nav happened to hold.
     *  The plain-string form stays valid, so no stored bundle changes shape. */
    z.object({ el: z.literal('List'), ...Base,
      items: z.array(z.union([
        z.string(),
        z.object({ text: z.string(), page: z.string().optional(), href: z.string().optional() }),
      ])).min(1),
      style: z.enum(['plain', 'dashed', 'rows']).optional() }),
    z.object({ el: z.literal('Figure'), ...Base, caption: z.string(), children: z.array(NodeSchema).min(1) }),
    z.object({ el: z.literal('Caption'), ...Base, text: z.string() }),
    z.object({ el: z.literal('Badge'), ...Base, text: z.string(), kind: z.enum(['accent', 'quiet', 'outline']).optional() }),
    z.object({ el: z.literal('Marker'), ...Base, text: z.string() }),
    z.object({ el: z.literal('KeyValue'), ...Base, rows: z.array(z.object({ k: z.string(), v: z.string() })).min(2) }),
    /** Swiper, as a web component rather than the React binding.
     *  The build farm emits `renderToStaticMarkup` with no client React (see ssr.ts), so
     *  `swiper/react` would animate in the preview and ship dead to the client's domain —
     *  the worst kind of difference between the two renderers. `swiper-element` is the same
     *  Swiper driving custom elements, so one markup tree works in both. */
    z.object({ el: z.literal('Carousel'), ...Base,
      perView: z.number().min(1).max(4).default(1),
      perViewMobile: z.number().min(1).max(2).optional(),
      effect: z.enum(['slide', 'fade', 'coverflow']).default('slide'),
      loop: z.boolean().default(true),
      /** Milliseconds between slides, or 0 for a carousel the visitor drives.
       *  Autoplay is off by default: motion nobody asked for competes with the copy. */
      autoplay: z.number().min(0).max(12000).default(0),
      controls: z.enum(['dots', 'arrows', 'both', 'none']).default('dots'),
      children: z.array(NodeSchema).min(2) }),
    z.object({ el: z.literal('Divider'), ...Base }),
    z.object({ el: z.literal('Spacer'), ...Base, size: Scale }),
    z.object({ el: z.literal('Field'), ...Base, label: z.string(),
      type: z.enum(['text', 'email', 'tel', 'textarea', 'select']),
      options: z.array(z.string()).optional(), required: z.boolean().optional() }),
  ]),
)

/** The two custom elements Swiper registers. Declared here rather than in a .d.ts so the
 *  primitive and its type live in one file. */
declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      'swiper-container': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>
      'swiper-slide': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}

const cls = (...xs: (string | false | undefined)[]) => xs.filter(Boolean).join(' ')

/** Colour one verbatim substring without letting markup into content. An `accent` that
 *  does not occur in `text` renders the text unchanged rather than throwing — the
 *  validator is where a mismatch gets reported. */
function accented(text: string, accent?: string): React.ReactNode {
  if (!accent) return text
  const at = text.indexOf(accent)
  if (at < 0) return text
  return [text.slice(0, at), <em className="p-em" key="a">{accent}</em>, text.slice(at + accent.length)]
}

function boxProps(n: any) {
  const style: Record<string, string> = {}
  if (n.area) style.gridArea = n.area
  if (n.span) style.gridColumn = `span ${n.span}`
  if (n.motion?.delay) style['--motion-delay'] = `${n.motion.delay}ms`
  const data: Record<string, string> = {}
  if (n.motion) data['data-motion'] = n.motion.type
  if (n.parallax) data['data-parallax'] = String(n.parallax)
  if (n.page) data['data-page'] = n.page
  if (n.unverified) data['data-unverified'] = 'true'
  return {
    style,
    ...data,
    'data-pgap': n.gap, 'data-ppad': n.pad, 'data-palign': n.align,
    'data-pjustify': n.justify, 'data-pmaxw': n.maxw, 'data-ptone': n.tone,
  }
}

/** Swiper's parameters, as the element reads them. Written once and used twice: as JSX
 *  attributes, which is what `renderToStaticMarkup` puts in the published HTML, and again
 *  through `setAttribute` on the client.
 *
 *  The second pass is not belt-and-braces. React 19 hands a prop to a custom element as a
 *  *property* whenever the element defines one, and Swiper defines properties for every
 *  param — so `effect`, `loop`, `pagination` and `breakpoints` never reached the DOM as
 *  attributes at all, and the element read its (empty) attributes at connect time and gave
 *  up. The symptom was a carousel that rendered its slides as a static stack with no error
 *  anywhere: the markup was right, the element was upgraded, and only the behaviour was
 *  missing. */
function carouselParams(n: any): Record<string, string> {
  const dots = n.controls === 'dots' || n.controls === 'both'
  const arrows = n.controls === 'arrows' || n.controls === 'both'
  const p: Record<string, string> = {
    'slides-per-view': String(n.perViewMobile ?? 1),
    breakpoints: JSON.stringify({ 900: { slidesPerView: n.perView ?? 1 } }),
    'space-between': '24',
    effect: n.effect ?? 'slide',
  }
  if (n.effect === 'fade') p['fade-effect-cross-fade'] = 'true'
  if (n.loop !== false) p.loop = 'true'
  if (n.autoplay) { p['autoplay-delay'] = String(n.autoplay); p['autoplay-pause-on-mouse-enter'] = 'true' }
  // Same rule: `effect="fade"` names the effect, `fade-effect-*` configures it.
  /* A nested attribute implies its parent, and setting both is not merely redundant — Swiper
     resolves `pagination="true"` to the string "true" and then tries to write `.clickable` on
     it, which throws inside connectedCallback and takes the whole React tree down with it. */
  if (dots) p['pagination-clickable'] = 'true'
  if (arrows) p.navigation = 'true'
  return p
}

function Carousel({ node, box }: { node: any; box: Record<string, unknown> }) {
  const ref = useRef<HTMLElement>(null)
  const params = carouselParams(node)
  useEffect(() => {
    const el = ref.current as (HTMLElement & { initialize?: () => void; swiper?: unknown }) | null
    if (!el || el.swiper) return
    for (const [k, v] of Object.entries(params)) el.setAttribute(k, v)
    el.initialize?.()
  })
  return (
    <swiper-container ref={ref} className="p-carousel" {...box} init="false" {...params}>
      {(node.children as Node[]).map((c, i) => (
        <swiper-slide key={i}><Render node={c} /></swiper-slide>
      ))}
    </swiper-container>
  )
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
      return <H className={`p-h p-h--${n.size}`} {...b}>{accented(n.text, n.accent)}</H>
    }
    /* A Text carrying `page` is a link and has to be an anchor.
     *
     *  It used to render a <p data-page> and rely on the preview app's click delegate, which the
     *  build farm does not ship — so every nav item and footer link in a published site was inert
     *  and invisible to a crawler, while working perfectly in the preview. Button already resolved
     *  its href through hrefFor; this is the same call, and the discrepancy between the two is what
     *  hid the bug. Keyboard users got nothing either: a <p> is not focusable. */
    case 'Text': {
      const cn = cls('p-text', `p-text--${n.size ?? 'body'}`, n.page && 'p-link')
      const body = accented(n.text, n.accent)
      return n.page
        ? <a className={cn} href={hrefFor(n.page)} {...b}>{body}</a>
        : <p className={cn} {...b}>{body}</p>
    }
    case 'Eyebrow': return <p className="p-eyebrow" {...b}>{n.text}</p>
    case 'Quote': return (
      <figure className={`p-quote p-quote--${n.size ?? 'heading'}`} {...b}>
        <blockquote>{n.text}</blockquote>
        {(n.author || n.role) && <figcaption>{n.author}{n.role && <span>{n.role}</span>}</figcaption>}
      </figure>
    )
    case 'Button': return n.page
      ? <a className={`btn btn--${n.kind}`} href={hrefFor(n.page)} {...b}>{n.label}</a>
      : <span className={`btn btn--${n.kind}`} {...b}>{n.label}</span>
    case 'Image': return (
      <div className={`p-img p-img--${n.ratio ?? 'landscape'}`} data-kind={n.kind} {...b}>
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
        {(n.items as Array<string | { text: string; page?: string; href?: string }>).map((it) => {
          if (typeof it === 'string') return <li key={it}>{it}</li>
          const to = it.page ? hrefFor(it.page) : it.href
          return (
            <li key={it.text}>
              {to ? <a className="p-link" href={to} {...(it.page ? { 'data-page': it.page } : {})}>{it.text}</a> : it.text}
            </li>
          )
        })}
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
    case 'Figure': return (
      <figure className="p-figure" {...b}>
        {kids}
        <figcaption className="p-caption">{n.caption}</figcaption>
      </figure>
    )
    case 'Caption': return <p className="p-caption" {...b}>{n.text}</p>
    case 'Badge': return <span className={`p-badge p-badge--${n.kind ?? 'quiet'}`} {...b}>{n.text}</span>
    case 'Marker': return <span className="p-marker" {...b}>{n.text}</span>
    case 'KeyValue': return (
      <dl className="p-kv" {...b}>
        {n.rows.map((r: { k: string; v: string }) => (
          <div className="p-kv__row" key={r.k}>
            <dt>{r.k}</dt><dd>{r.v}</dd>
          </div>
        ))}
      </dl>
    )
    case 'Carousel': return <Carousel node={n} box={b} />
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
