/** The design-token contract, declared once.
 *
 *  It used to live nowhere: `ThemeSchema.tokens` is `z.record(z.string())`, so a misspelled token
 *  validated cleanly and silently did nothing, and the MCP server published the contract as
 *  `Object.keys(Object.values(themes)[0].tokens)` — the key list of whichever theme the filesystem
 *  happened to list first. Editing that one client's theme changed the contract every creator was
 *  generating against. A contract derived from a sample of itself is not a contract.
 *
 *  Three groups, because "unknown token" and "token a theme must not set" are different mistakes:
 *  a theme that omits a REQUIRED one renders with a browser default in place of a brand decision;
 *  one that sets a DERIVED one is fighting the tone system, which recomputes them per section. */

/** Every theme must set all of these. The stylesheet reads them with no fallback. */
export const REQUIRED_TOKENS = [
  // colour — the field values a tone resolves from
  '--color-bg', '--color-surface', '--color-ink', '--color-muted', '--color-line',
  '--color-accent', '--color-on-accent',
  '--color-inverse-bg', '--color-inverse-ink', '--color-inverse-muted', '--color-inverse-line',
  // type
  '--font-display', '--font-body', '--font-eyebrow', '--font-numeral',
  '--display-size', '--display-weight', '--display-tracking', '--display-leading',
  '--heading-size', '--lede-size', '--body-size', '--body-leading',
  '--eyebrow-size', '--eyebrow-tracking', '--eyebrow-transform',
  // form and rhythm
  '--maxw', '--gap', '--pad-y', '--hero-min',
  '--radius', '--radius-img', '--border', '--shadow',
  '--btn-pad', '--btn-radius', '--btn-weight',
  // image treatment
  '--img-filter', '--overlay',
] as const

/** A theme may set these; the stylesheet has a considered default for each. Several are the
 *  subject of validator warnings elsewhere (`--color-focus`, the surface ramp, the structural
 *  six), which is precisely why they must be recognised rather than reported as typos. */
export const OPTIONAL_TOKENS = [
  '--color-accent-ink', '--color-focus',
  '--color-surface-2', '--color-surface-3', '--color-inverse-surface-2',
  '--scale-ratio', '--density', '--grid-cols', '--breakout', '--radius-tight',
  '--motion-duration', '--motion-ease', '--motion-state', '--motion-distance',
  '--elev-1', '--elev-2', '--measure', '--measure-body',
  '--nav-logo-h', '--nav-logo-w', '--nav-pad', '--nav-utility-bg',
  '--foot-logo-h', '--foot-logo-w',
  '--sp-none', '--sp-xs', '--sp-sm', '--sp-md', '--sp-lg', '--sp-xl',
  '--badge-size', '--radius-badge', '--caption-size', '--small-size',
  '--subtitle-size', '--title-size', '--marker-size', '--focus-width',
  '--cols-max', '--cols-4', '--stat-cols', '--min-h', '--align-items',
] as const

/** Recomputed per section by the tone system, or set by a block at runtime. A theme that assigns
 *  one is overriding machinery, not expressing a design decision — every section then paints the
 *  same ground regardless of its tone. */
export const DERIVED_TOKENS = [
  '--bg', '--ink', '--muted', '--line', '--card', '--btn-bg', '--btn-fg', '--accent-fg',
  '--on-accent', '--surface-2', '--surface-3', '--plate', '--raised',
  '--cols', '--parallax-y', '--motion-delay', '--align', '--align-inline',
] as const

export const KNOWN_TOKENS: ReadonlySet<string> =
  new Set<string>([...REQUIRED_TOKENS, ...OPTIONAL_TOKENS])
export const DERIVED_SET: ReadonlySet<string> = new Set<string>(DERIVED_TOKENS)
