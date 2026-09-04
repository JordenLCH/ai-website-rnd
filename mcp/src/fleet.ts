/** Divergence check. A creator's machine cannot know what the other 40 sites look
 *  like; the platform can. Two themes that resolve slugs to the same layouts read as
 *  the same template no matter how far apart their palettes are, so layout map
 *  similarity — not colour distance — is what we score. */
import { readThemes } from './source.ts'

const TYPE_KEYS = ['--font-display', '--font-body'] as const
const FORM_KEYS = ['--radius', '--pad-y', '--display-weight', '--shadow'] as const

export type Sibling = { name: string; layoutMap: Record<string, string>; fonts: string[]; form: Record<string, string> }

export function siblings(): Sibling[] {
  return Object.entries(readThemes()).map(([name, t]) => ({
    name,
    layoutMap: Object.fromEntries(Object.entries(t.sectionStyles).map(([k, v]: any) => [k, v.layout])),
    fonts: TYPE_KEYS.map((k) => t.tokens[k]).filter(Boolean),
    form: Object.fromEntries(FORM_KEYS.map((k) => [k, t.tokens[k]])),
  }))
}

/** Fraction of shared slugs resolving to the same layout, plus font/form overlap. */
export function divergence(candidate: any): Array<{ against: string; layoutOverlap: number; sharedFonts: number; verdict: string }> {
  const cand = Object.fromEntries(Object.entries(candidate.sectionStyles ?? {}).map(([k, v]: any) => [k, v.layout]))
  const candFonts = TYPE_KEYS.map((k) => candidate.tokens?.[k]).filter(Boolean)

  return siblings()
    .filter((s) => s.name !== candidate.name)
    .map((s) => {
      const shared = Object.keys(cand).filter((k) => k in s.layoutMap)
      const same = shared.filter((k) => cand[k] === s.layoutMap[k]).length
      const layoutOverlap = shared.length ? same / shared.length : 0
      const sharedFonts = candFonts.filter((f) => s.fonts.includes(f)).length
      const verdict =
        layoutOverlap > 0.7 ? 'too similar — change the layout map, not the palette'
        : layoutOverlap > 0.5 ? 'borderline — differentiate the tone rhythm as well'
        : 'distinct'
      return { against: s.name, layoutOverlap: Number(layoutOverlap.toFixed(2)), sharedFonts, verdict }
    })
    .sort((a, b) => b.layoutOverlap - a.layoutOverlap)
}
