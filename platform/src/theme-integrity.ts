/** Every colour the page shows has to arrive from the theme.
 *
 *  A bundle cannot cause this fault — `site.json` carries no colours, and the validator that reads
 *  it therefore cannot see one. The risk lives entirely in the components: a single `color:#7BB241`
 *  written into a block looks perfectly correct in the theme it was authored against, passes
 *  review, and then stays that colour in every other theme. Swapping `theme.json` re-dresses most
 *  of the page and quietly leaves that part behind, which is the failure the whole variant-slug
 *  indirection exists to prevent.
 *
 *  So this reads the rendered markup instead. Ported from the earlier round of this work, where the
 *  same check ran against Tailwind utilities; the stack differs, the principle does not — check
 *  what the page shows, not what the JSON says.
 *
 *  The distinction that makes it usable: a colour assigned to a **custom property** is theme
 *  plumbing — it came from `theme.json`'s tokens or a section's `vars`, which is exactly how a
 *  colour is supposed to reach the page. A colour assigned to a **real CSS property** is a
 *  component deciding for itself. Only the second is reported. */

export type Issue = { where: string; message: string; severity: 'error' | 'warning' | 'info' }

const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(|\bcolor-mix\(/
/** Properties that paint. `box-shadow` and `outline` are included because a hardcoded shadow
 *  colour survives a theme swap just as visibly as a hardcoded background. */
const PAINTS = /(^|;)\s*(-?color|background|background-color|border(-[a-z]+)?-color|outline-color|fill|stroke|box-shadow|text-shadow|caret-color|accent-color)\s*:/i

/** One declaration block, split on `;` but keeping custom properties intact. */
function declarations(style: string): string[] {
  return style.split(';').map((d) => d.trim()).filter(Boolean)
}

export function themeIntegrityIssues(html: string, where: string): Issue[] {
  const out: Issue[] = []
  const seen = new Set<string>()
  for (const m of html.matchAll(/style="([^"]*)"/g)) {
    const style = m[1].replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    for (const decl of declarations(style)) {
      // `--anything: #hex` is the theme arriving, which is the point.
      if (decl.startsWith('--')) continue
      if (!COLOUR.test(decl) || !PAINTS.test(`;${decl}`)) continue
      if (seen.has(decl)) continue
      seen.add(decl)
      out.push({
        where,
        message: `a component writes a colour literally: ${decl.slice(0, 80)} — this stays the same colour in every theme. ` +
          `Reach the theme through var(--color-…) or currentColor instead`,
        severity: 'error',
      })
    }
  }
  return out
}
