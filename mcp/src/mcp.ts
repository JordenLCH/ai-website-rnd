import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { CATALOG_VERSION, listBlocks, getBlocks, readThemes } from './source.ts'
import { siblings, divergence } from './fleet.ts'
import { REQUIRED_TOKENS, OPTIONAL_TOKENS, DERIVED_TOKENS } from '@blackdash/renderer/tokens'
import { validateBundle } from '@blackdash/renderer/validate-bundle'
/* The build farm's own page renderer. Imported, never reimplemented: a preview that draws pages
   its own way is a second renderer, and a second renderer is how "it looked right in the preview"
   becomes "it published wrong". */
import { renderPage } from '@blackdash/platform/build'
import { referencedAssets, assetFileName } from '@blackdash/platform/assets'
import { target, putDraft, getDraft, deleteDraft } from './publish.ts'

/** The MCP Apps mime type. Declared here rather than pulled from `@modelcontextprotocol/ext-apps`
 *  because that package peers on zod 4 while this server and the renderer are on zod 3, and two
 *  zod majors in one install breaks schema identity in ways that surface as unrelated bugs. The
 *  server side of that package is a two-line wrapper; this is those two lines. */
const APP_MIME = 'text/html;profile=mcp-app'
const PREVIEW_URI = 'ui://blackdash/site-preview.html'

const HERE = dirname(new URL(import.meta.url).pathname)
const APP_HTML = join(HERE, '..', 'app', 'dist', 'app.html')

/** Only the half of the stylesheet a generated site ships with; the preview app's own chrome
 *  is not part of a client's page. */
function siteCss(): string {
  const cssPath = createRequire(import.meta.url).resolve('@blackdash/renderer/styles.css')
  return readFileSync(cssPath, 'utf8')
    .split('/* ---------- generated site: token-only from here down ---------- */')[1] ?? ''
}

const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] })

/** A bundle argument, however the host chose to send it.
 *
 *  Some clients — the web one notably — hand an object argument over as a JSON *string*. The
 *  bundle is fine; only the transport differs. Parsing here rather than rejecting keeps the
 *  validator's messages about the site, instead of `site.: Expected object, received string`,
 *  which reads as a defect in the creator's content and sends them editing the wrong thing.
 *
 *  This runs in the handlers, not as a zod `preprocess` on the input schema: the SDK hands the
 *  handler the request's raw arguments, so a schema-level transform is declared, published in the
 *  JSON Schema, and never applied to the value the tool actually sees. */
function asJson(label: string, v: unknown): any {
  if (typeof v !== 'string') return v
  const text = v.trim()
  /* Only text that is meant to be a document is parsed; a genuinely stringy value is passed
     through untouched, so the validator still gets to say what is wrong with it. */
  if (!text.startsWith('{') && !text.startsWith('[')) return v
  try {
    return JSON.parse(text)
  } catch (e) {
    throw new Error(`${label} arrived as JSON text, but it does not parse: ${(e as Error).message}`)
  }
}

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
  inputSchema: { candidateTheme: z.any().optional() },
  }, async ({ candidateTheme: rawTheme }) => {
    const candidateTheme = asJson('candidateTheme', rawTheme)
    const fleet = siblings()
    /* An empty fleet scores every candidate as distinct, which is not a pass — it is the check
       not running. Say so, or a creator reads silence as approval and ships the first art
       direction the model proposed, which is the mode of its training data. */
    if (fleet.length === 0) return json({
      fleet: [],
      checked: false,
      note: 'No sites in the fleet to compare against, so divergence was not measured. This is ' +
        'not a clean result — treat the art direction as unchecked and lean harder on sampling ' +
        'several directions and discarding the likeliest.',
    })
    return json(candidateTheme
      ? { checked: true, comparedAgainst: fleet.map((s) => s.name), results: divergence(candidateTheme) }
      : { checked: true, fleet })
  })

  /* What `npm run validate` did, for someone who cannot run npm. The same module the build farm
     imports — the point of moving validation to the server is that there is still only one of it,
     not that there is now a friendlier second one. */
  server.registerTool('bundle_validate', {
  title: 'Validate a bundle',
  description:
    'Run the authoritative validator over a site.json / theme.json pair (org.json optional but ' +
    'required for jurisdiction checks). This is the same module the build farm runs on upload, ' +
    'so a bundle that passes here cannot fail there for schema reasons. Call it after every ' +
    'material edit, not once at the end.',
  inputSchema: { site: z.any(), theme: z.any(), org: z.any().optional() },
  }, async ({ site: rawSite, theme: rawTheme, org: rawOrg }) => {
    const [site, theme, org] = [asJson('site', rawSite), asJson('theme', rawTheme), asJson('org', rawOrg)]
    const { ok, issues, density, unverified } = validateBundle(site, theme, org)
    return json({
      catalogVersion: CATALOG_VERSION, ok,
      errors: issues.filter((i) => i.severity === 'error'),
      warnings: issues.filter((i) => i.severity === 'warning'),
      notes: issues.filter((i) => i.severity === 'info'),
      unverified,
      sectionsMeasured: density.length,
    })
  })

  /* An MCP App: `_meta.ui.resourceUri` is the whole of what makes a tool render a UI. The host
     fetches that resource and draws it in the conversation, and the app talks back over
     postMessage — so the creator sees the real catalog without installing anything. */
  server.registerTool('site_preview', {
  title: 'Preview a site in the conversation',
  description:
    'Render a bundle with the real catalog and show it inline, with its validation verdict and a ' +
    'tab per page. Pass the bundle you are working on. The markup, the stylesheet and the migrated ' +
    'bundle are handed to the app out of band; the text you get back is the verdict alone, so ' +
    'calling this after every edit costs a few hundred bytes rather than a page of HTML.',
  inputSchema: { site: z.any(), theme: z.any(), org: z.any().optional(), page: z.string().optional() },
  _meta: { ui: { resourceUri: PREVIEW_URI }, 'ui/resourceUri': PREVIEW_URI },
  }, async ({ site: rawSite, theme: rawTheme, org: rawOrg, page }) => {
    const [site, theme, org] = [asJson('site', rawSite), asJson('theme', rawTheme), asJson('org', rawOrg)]
    const v = validateBundle(site, theme, org)
    const errors = v.issues.filter((i) => i.severity === 'error')
    if (!v.ok || !v.site || !v.theme) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ ok: false, errors }, null, 2) }],
        _meta: { blackdash: { ok: false, issues: v.issues, pages: [], page: '', html: '', css: '' } },
      }
    }
    const pages = Object.keys(v.site.pages)
    const key = page && pages.includes(page) ? page : pages[0]
    /* Render the validator's migrated copy, never the caller's raw input — drawing the original
       is what once published a page with its footer missing. */
    const html = renderPage(v.site.pages[key], v.site, v.theme, key)

    const payload = {
      client: v.site.client, catalogVersion: CATALOG_VERSION,
      ok: true, issues: v.issues, pages, page: key,
      html, css: siteCss(),
      bundle: { site: v.site, theme: v.theme },
    }
    /* The render travels in `_meta`, and only a verdict goes into the text content.
       The text content is billed into the conversation and re-sent on every subsequent turn, so
       carrying the markup there cost ~157 KB per call — a page of HTML, the whole stylesheet, and
       the caller's own bundle echoed back — which is precisely the cost this preview exists to
       avoid. The app reads `_meta` first, so nothing about the picture changes. A host that
       forwards neither gets the verdict, which is the half a reader needs in the transcript. */
    /* Errors and warnings in full — they are the reason to read this at all. Info notes are
       migration receipts and density hints: worth one line each, not a paragraph each, on a call
       made after every edit. */
    const verdict = {
      ok: true, client: v.site.client, catalogVersion: CATALOG_VERSION,
      page: key, pages,
      errors: v.issues.filter((i) => i.severity === 'error'),
      warnings: v.issues.filter((i) => i.severity === 'warning'),
      notes: v.issues.filter((i) => i.severity === 'info').map((i) => `${i.where}: ${i.message}`),
      rendered: `${(html.length / 1024).toFixed(0)} KB of HTML for "${key}", drawn in the preview panel — not repeated here`,
    }
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(verdict) }],
      _meta: { blackdash: payload },
    }
  })

  /* Publishing. `package.sh` for someone who cannot run a shell — and the point at which the
     conversation stops being the record and the hosting server becomes it.

     The write path lives on the hosting side; these three tools are its remote control. They are
     a set on purpose: a create with no way to inspect or withdraw it leaves a creator who mistyped
     a domain with a draft they can neither see nor remove, and no admin login to fix it with. */
  const noTarget = () => json({
    ok: false,
    error: 'publishing is not configured on this catalog server — set SITE_HOSTING_URL and ' +
      'SITE_HOSTING_KEY. Until then the bundle is only in this conversation: nothing has been stored.',
  })

  server.registerTool('bundle_publish', {
  title: 'Publish a bundle to hosting',
  description:
    'Hand a finished bundle to the hosting server, which stores it and returns a link for uploading ' +
    'the photographs. Validation runs first and a bundle with errors is refused — this is the last ' +
    'step, not a way to check. Publishing the same domain again replaces the JSON and keeps the ' +
    'pictures already uploaded. The images themselves never travel through the conversation.',
  inputSchema: {
    domain: z.string().describe('the site\'s own domain, e.g. merryfair.com — this is its identity in hosting'),
    site: z.any(), theme: z.any(),
    org: z.any().describe('required to publish: the entity graph is derived from this file alone'),
  },
  }, async ({ domain, site: rawSite, theme: rawTheme, org: rawOrg }) => {
    const [site, theme, org] = [asJson('site', rawSite), asJson('theme', rawTheme), asJson('org', rawOrg)]
    const t = target()
    if (!t) return noTarget()
    if (!org) return json({
      ok: false,
      error: 'org.json is required to publish. It holds what marketing copy never states and a model ' +
        'must not invent — legal name, registration number, address, phone, sameAs profiles — and the ' +
        'Organization/LocalBusiness graph, the highest-value thing this pipeline emits, is built from it alone.',
    })
    const v = validateBundle(site, theme, org)
    const errors = v.issues.filter((i) => i.severity === 'error')
    if (!v.ok || !v.site || !v.theme) return json({ ok: false, error: 'the bundle is not valid', errors })
    try {
      /* The validator's migrated copy is what gets stored, so a bundle written against an older
         catalog is upgraded once here rather than re-migrated on every rebuild for years. */
      /* A referenced path outside the `/img/<client>/…` convention has no name to be uploaded
         under, so it is dropped here rather than sent as something the creator can never satisfy —
         the validator is what reports it as a broken reference. */
      const expected = referencedAssets(v.site).map(assetFileName).filter((n): n is string => n !== null)
      /* Stamp the catalog into the stored bundle itself, exactly as the shell packager does.
         The manifest records it too, but the manifest is this store's bookkeeping — the bundle has
         to be self-describing wherever it ends up, because the rebuild that matters is the one
         someone runs a year from now against a catalog that has moved. Backward drift is refused
         at build time, and it can only be detected if the bundle says what it was written against. */
      const stamped = { ...v.site, catalogVersion: CATALOG_VERSION }
      const draft = await putDraft(t, {
        domain, site: stamped, theme: v.theme, org, expected, catalogVersion: CATALOG_VERSION,
      })
      return json({
        ok: true, catalogVersion: CATALOG_VERSION, ...draft,
        warnings: v.issues.filter((i) => i.severity === 'warning'),
        next: draft.missing.length
          ? `open ${draft.uploadUrl} in a browser and add ${draft.missing.length} picture(s); the site builds once none are missing`
          : `open ${draft.uploadUrl} to publish — every picture it needs is already uploaded`,
      })
    } catch (e) {
      return json({ ok: false, error: (e as Error).message, referenced: referencedAssets(v.site) })
    }
  })

  server.registerTool('bundle_status', {
  title: 'Check a published bundle',
  description: 'What hosting currently holds for a domain: whether it is a draft or live, and which photographs it is still waiting for.',
  inputSchema: { domain: z.string() },
  }, async ({ domain }) => {
    const t = target()
    if (!t) return noTarget()
    try { return json({ ok: true, ...await getDraft(t, domain) }) }
    catch (e) { return json({ ok: false, error: (e as Error).message }) }
  })

  server.registerTool('bundle_discard', {
  title: 'Discard a draft',
  description:
    'Delete a draft and every picture uploaded against it. Use this for a domain typed wrong, ' +
    'not to take a live site down — a published site is removed in hosting, deliberately, because ' +
    'a chat message should not be able to unpublish someone\'s website.',
  inputSchema: { domain: z.string() },
  }, async ({ domain }) => {
    const t = target()
    if (!t) return noTarget()
    try { return json({ ok: true, ...await deleteDraft(t, domain) }) }
    catch (e) { return json({ ok: false, error: (e as Error).message }) }
  })

  server.registerResource('site-preview', PREVIEW_URI, {
  title: 'Site preview app', description: 'The in-conversation preview UI.', mimeType: APP_MIME,
  }, async (uri) => ({
    contents: [{
      uri: uri.href, mimeType: APP_MIME,
      text: existsSync(APP_HTML)
        ? readFileSync(APP_HTML, 'utf8')
        : '<!doctype html><p>Preview app not built — run <code>npm run build:app</code> in mcp/.</p>',
    }],
  }))

  server.registerResource('catalog-version', 'catalog://version', {
  title: 'Catalog version', description: 'Pin this in the bundle manifest at generation time.',
  }, async (uri) => ({ contents: [{ uri: uri.href, text: CATALOG_VERSION }] }))


  return server
}
