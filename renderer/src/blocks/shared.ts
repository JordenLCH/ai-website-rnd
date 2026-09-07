import type { ComponentType } from 'react'
import type { z } from 'zod'

export type BlockRenderProps<P> = { props: P; layout: string }

/** A shape this block's props used to have, plus the pure function that brings them forward.
 *
 *  This is the whole answer to "the catalog changed and forty live sites are on the old shape."
 *  Bundles are stored as source and re-rendered on every deploy, so a block schema change would
 *  otherwise invalidate every site that used it — and a bulk rewrite of stored JSON is a migration
 *  you cannot roll back. Instead the old shape stays *readable*: the validator tries the current
 *  schema first, and on failure walks these in order, taking the first that parses. Nothing is
 *  written back until someone chooses to sweep.
 *
 *  Rules, learned from Gutenberg's block deprecations, which is the only system that has run this
 *  at scale:
 *  - `migrate` must be **pure** — old props in, current props out. No I/O, no clock, no randomness.
 *    It runs on every validation of every site, and it must give the same answer every time.
 *  - Never chain. Each entry migrates its own shape straight to *current*, not to the next-newest.
 *    Chained migrations mean a bug in a two-year-old step corrupts everything downstream of it.
 *  - Newest deprecation first — the array is tried in order and the first parse wins.
 *  - Add a fixture the day you add the deprecation. A migration nobody ever ran is not a migration.
 *  - Delete the entry only when a fleet sweep shows zero sites on that shape. Unlike a public CMS,
 *    the fleet here is enumerable, so this cleanup can actually finish. */
export type Deprecation<P = any> = {
  schema: z.ZodType<any>
  migrate: (old: any) => P
  /** Dated reason, for whoever has to decide later whether it is safe to drop. */
  note: string
}

export type CatalogEntry<P = any> = {
  schema: z.ZodType<P>
  layouts: readonly string[]
  Component: ComponentType<BlockRenderProps<P>>
  /** Cross-check props against the layout the theme chose. Returns problems, not exceptions. */
  check?: (props: P, layout: string) => string[]
  /** Newest first. See Deprecation. */
  deprecated?: readonly Deprecation<P>[]
}

export const Img = z.object({ src: z.string(), alt: z.string() })
