/** The webfonts the platform serves, in one place.
 *
 *  This file exists because the list was previously written out twice — once as a literal
 *  <link> in renderer/index.html and once as a string constant in platform/src/build.ts — and
 *  a theme naming any family outside those two copies rendered in system-ui with no error
 *  anywhere. The failure is invisible in exactly the way that matters: the page loads, the
 *  layout is right, and only the typeface is wrong, which is the layer carrying the most
 *  identity. A generated site silently reverting to the system stack is the templated look
 *  the whole pipeline exists to avoid.
 *
 *  Weights are per family and are not guessable. Google Fonts CSS2 rejects the *entire*
 *  request with a 400 if any requested weight does not exist for its family, so one wrong
 *  number here costs every font on the page, not one. DM Mono, for instance, stops at 500 —
 *  asking for 700 would take Familjen Grotesk and Karla down with it. That is the reason this
 *  is a hand-maintained map rather than a range applied to whatever the theme happens to name.
 */
export const SERVED: Record<string, string> = {
  'Archivo': 'wght@400;500;700;800',
  'Archivo Narrow': 'wght@400;500;600;700',
  'Barlow Condensed': 'wght@400;500;600;700',
  'Space Grotesk': 'wght@500;700',
  'IBM Plex Mono': 'wght@400;500',
  'IBM Plex Sans': 'wght@400;500',
  'Fraunces': 'opsz,wght@9..144,300;9..144,500;9..144,700',
  'Inter': 'wght@400;500;600',
  'Public Sans': 'wght@400;500;600;700',
  'Familjen Grotesk': 'wght@400;500;600;700',
  'Karla': 'wght@400;500;600;700',
  'DM Mono': 'wght@300;400;500',
  'JetBrains Mono': 'wght@400;500;700',
  'Chivo': 'wght@400;500;700',
}

/** Generic and system families never need loading, and must not be reported as missing. */
const GENERIC = new Set([
  'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace', 'ui-rounded',
  'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy',
  '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Helvetica Neue',
  'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Menlo', 'Consolas', 'emoji',
])

/** The first family in a CSS font stack — the one that will actually be used if it loads. */
export function primaryFamily(stack: string | undefined): string | null {
  if (!stack) return null
  const first = stack.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '')
  if (!first || GENERIC.has(first)) return null
  return first
}

const FONT_TOKENS = ['--font-display', '--font-body', '--font-eyebrow', '--font-numeral'] as const

/** Every non-generic family a theme asks for, deduplicated, in token order. */
export function familiesIn(tokens: Record<string, string>): string[] {
  const out: string[] = []
  for (const k of FONT_TOKENS) {
    const f = primaryFamily(tokens[k])
    if (f && !out.includes(f)) out.push(f)
  }
  return out
}

/** Families a theme names that the platform does not serve — these render as system-ui. */
export function unservedFamilies(tokens: Record<string, string>): string[] {
  return familiesIn(tokens).filter((f) => !(f in SERVED))
}

/** One stylesheet URL covering every served family. Requested as a single link rather than one
 *  per family so the browser opens one connection and the whole set arrives or fails together —
 *  a partial set is worse than none, because half the page silently changes typeface. */
export function fontsHref(): string {
  const families = Object.entries(SERVED)
    .map(([name, axis]) => `family=${name.replace(/ /g, '+')}:${axis}`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}
