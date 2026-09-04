import { z } from 'zod'

export const ToneSchema = z.enum(['default', 'inverse', 'accent', 'surface'])

export const SectionStyleSchema = z.object({
  layout: z.string(),
  tone: ToneSchema.default('default'),
  vars: z.record(z.string()).optional(),
})

export const ThemeSchema = z.object({
  name: z.string(),
  tokens: z.record(z.string()),
  sectionStyles: z.record(SectionStyleSchema),
})

export const BlockSchema = z.object({
  type: z.string(),
  variant: z.string(),
  props: z.record(z.unknown()),
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
