import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { CATALOG_VERSION, listBlocks, getBlocks, readThemes } from './source.ts'
import { siblings, divergence } from './fleet.ts'
import { REQUIRED_TOKENS, OPTIONAL_TOKENS, DERIVED_TOKENS } from '../../renderer/src/tokens.ts'

const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] })

export function createServer() {
  /** Read-only catalog service.
   *
   *  What belongs here: anything that changes on the platform's schedule and must stay in
   *  sync with what the build farm will actually render — the block catalog, the token
   *  contract, and the fleet a new site has to differ from. A creator's machine cannot
   *  know any of those.
   *
   *  What deliberately does not: validation (the boilerplate repo has the renderer, so it
   *  runs `npm run validate` against the same module the farm imports) and publishing
   *  (a plain authenticated HTTP upload — MCP is a poor transport for files, and keeping
   *  the write path out means this server needs no auth at all). */
  const server = new McpServer({ name: 'blackdash-catalog', version: CATALOG_VERSION })

  server.registerTool('catalog_list', {
  title: 'List blocks',
  description:
    'Every block available right now, with its variants — this is the source of truth, ' +
    'newer than any catalog bundled in a skill. Returns names and one-line summaries only; ' +
    'call catalog_get for the blocks you actually intend to use.',
  inputSchema: {},
  }, async () => json({ catalogVersion: CATALOG_VERSION, blocks: listBlocks() }))

  server.registerTool('catalog_get', {
  title: 'Get block schemas',
  description:
    'Full prop schemas for named blocks. Request only the blocks you are composing with — ' +
    'fetching all of them wastes the context you are trying to protect.',
  inputSchema: { types: z.array(z.string()).min(1).max(12) },
  }, async ({ types }) => json({ catalogVersion: CATALOG_VERSION, blocks: getBlocks(types) }))

  server.registerTool('theme_contract', {
  title: 'Theme contract',
  description:
    'The design-token contract a theme.json must satisfy, plus the themes already in the fleet ' +
    'to read as reference. Colour carries the least identity; the layout map and tone rhythm carry the most.',
  inputSchema: { includeExamples: z.boolean().optional() },
  }, async ({ includeExamples }) => {
  const themes = readThemes()
  /* Declared, not sampled. This used to read `Object.keys(Object.values(themes)[0].tokens)` — the
     key list of whichever theme the filesystem listed first — so editing one client's theme
     silently changed the contract every creator generates against. */
  return json({
    catalogVersion: CATALOG_VERSION,
    tokens: {
      required: REQUIRED_TOKENS,
      optional: OPTIONAL_TOKENS,
      derived: DERIVED_TOKENS,
      note: 'required: set all of them, the stylesheet has no fallback. optional: a considered ' +
        'default exists. derived: recomputed per section by the tone system — never set these in ' +
        'theme.tokens, use sectionStyles[slug].vars for a one-section override.',
    },
    tones: {
      default: 'page background',
      surface: 'raised/card colour, a quiet change of register',
      inverse: 'dark on light themes, light on dark ones',
      accent: 'brand colour as the field; text flips to --color-on-accent',
    },
    slugs: [...new Set(Object.values(themes).flatMap((t) => Object.keys((t as any)?.sectionStyles ?? {})))].sort(),
    perSectionOverride: 'sectionStyles[slug].vars overrides tokens for that section only',
    examples: includeExamples ? themes : Object.keys(themes),
  })
  })

  server.registerTool('fleet_siblings', {
  title: 'Fleet divergence check',
  description:
    'Compare a candidate theme against sites already in the fleet. Layout-map overlap is scored, ' +
    'not colour distance, because two themes resolving slugs to the same layouts read as the same ' +
    'template however different their palettes are. Call this before writing content.',
  inputSchema: { candidateTheme: z.record(z.any()).optional() },
  }, async ({ candidateTheme }) =>
  json(candidateTheme
    ? { comparedAgainst: siblings().map((s) => s.name), results: divergence(candidateTheme) }
    : { fleet: siblings() }))

  server.registerResource('catalog-version', 'catalog://version', {
  title: 'Catalog version', description: 'Pin this in the bundle manifest at generation time.',
  }, async (uri) => ({ contents: [{ uri: uri.href, text: CATALOG_VERSION }] }))


  return server
}
