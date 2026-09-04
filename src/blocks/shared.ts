import type { ComponentType } from 'react'
import type { z } from 'zod'

export type BlockRenderProps<P> = { props: P; layout: string }

export type CatalogEntry<P = any> = {
  schema: z.ZodType<P>
  layouts: readonly string[]
  Component: ComponentType<BlockRenderProps<P>>
  /** Cross-check props against the layout the theme chose. Returns problems, not exceptions. */
  check?: (props: P, layout: string) => string[]
}

export const Img = z.object({ src: z.string(), alt: z.string() })
