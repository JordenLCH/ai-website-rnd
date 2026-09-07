import { z } from 'zod'

export const ToneSchema = z.enum(['default', 'inverse', 'accent', 'surface'])

export const SectionStyleSchema = z.object({
  layout: z.string(),
  tone: ToneSchema.default('default'),
  vars: z.record(z.string()).optional(),
})

/** The art direction, in words, recorded before the values were set.
 *
 *  A studio names the direction first because every later decision gets tested against it — a
 *  radius, a motion duration or a photograph either supports the adjectives or contradicts them,
 *  and the contradiction is invisible unless the words exist. Kept in the theme rather than in a
 *  chat message so it survives the session: the next agent to touch this theme otherwise re-derives
 *  the intent from the values, which is exactly how a considered theme drifts back to the default. */
export const DirectionSchema = z.object({
  adjectives: z.array(z.string()).min(2).max(4),
  rejected: z.array(z.string()).optional(),
  why: z.string().optional(),
})

export const ThemeSchema = z.object({
  name: z.string(),
  tokens: z.record(z.string()),
  sectionStyles: z.record(SectionStyleSchema),
  direction: DirectionSchema.optional(),
})

export const BlockSchema = z.object({
  type: z.string(),
  variant: z.string(),
  props: z.record(z.unknown()),
  /** Content the generator composed rather than took from the brief — a plausible figure,
   *  a spec value, a quote. Marked, never silent: the preview lists it for the human pass,
   *  the build farm excludes it from JSON-LD, and publishing is refused while any remains.
   *  Fabricated copy is a draft; fabricated structured data is a manual action. */
  unverified: z.boolean().optional(),
})

export const PageSchema = z.object({
  title: z.string(),
  blocks: z.array(BlockSchema),
})

/** Header and footer belong to the site, not to every page. */
export const ChromeSchema = z.object({
  header: BlockSchema.optional(),
  footer: BlockSchema.optional(),
})

export const SiteSchema = z.object({
  client: z.string(),
  chrome: ChromeSchema.optional(),
  pages: z.record(PageSchema),
})

export type Theme = z.infer<typeof ThemeSchema>
export type Site = z.infer<typeof SiteSchema>
export type Page = z.infer<typeof PageSchema>
