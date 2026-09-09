/** The write half of the creator flow: handing a finished bundle to the hosting server.
 *
 *  This file is only the client. The bundle is stored, keyed and built by `site-hosting`, and
 *  deliberately not by this server: the catalog service is stateless and read-only by design —
 *  any number of creators can hit it through a tunnel because no request can affect another.
 *  Keeping the store on the other side preserves that.
 *
 *  Why the pictures do not travel with the JSON. An MCP tool call is JSON in a conversation, so
 *  images would have to be base64 in the transcript: billed to the creator's context, several
 *  times the size of the file, and re-sent on every subsequent turn. Instead this returns an
 *  upload URL. The chat carries paths; a browser carries bytes. That split is also what makes the
 *  flow work for someone with no development machine, which is the whole reason it exists. */

export type Target = { url: string; key: string }

/** Where to publish, from the environment. Absent configuration is not an error here — it is the
 *  normal state of a catalog server that is only ever read from — so the tool reports it as a
 *  message a creator can act on rather than throwing at start-up. */
export function target(env: NodeJS.ProcessEnv = process.env): Target | null {
  const url = env.SITE_HOSTING_URL?.replace(/\/+$/, '')
  const key = env.SITE_HOSTING_KEY
  return url && key ? { url, key } : null
}

export type Draft = {
  code: string
  domain: string
  client: string
  uploadUrl: string
  /** Every image the bundle references, by the name it must be uploaded under. */
  expected: string[]
  /** Those not yet uploaded. Empty means the site can be published. */
  missing: string[]
  status: 'draft' | 'published'
}

/** `expected` is the list of picture names the bundle's props reference, computed here from
 *  `@blackdash/platform/assets` — the module that reads the props the build will actually resolve.
 *  It is sent rather than recomputed on the far side so that "which pictures does this site need"
 *  has exactly one implementation; a second one in the hosting repo would eventually disagree, and
 *  the way it would disagree is a site going live with a hole in it and no warning. */
type Body = {
  domain: string
  site: unknown; theme: unknown; org: unknown
  expected: string[]
  catalogVersion: string
}

async function call(
  t: Target, path: string, init: RequestInit, fetchImpl: typeof fetch,
): Promise<Draft> {
  let res: Response
  try {
    res = await fetchImpl(`${t.url}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', 'x-bundle-key': t.key, ...(init.headers ?? {}) },
    })
  } catch (e) {
    /* A hosting server that is down must stop the flow, not degrade it. The creator's next step
       is uploading pictures against a code this call was supposed to mint; inventing one would
       send them to a page that cannot exist. */
    throw new Error(`the hosting server at ${t.url} did not answer (${(e as Error).message}). Nothing was published.`)
  }
  const text = await res.text()
  let body: unknown
  try { body = text ? JSON.parse(text) : {} } catch { body = { error: text.slice(0, 300) } }
  if (!res.ok) {
    const why = (body as { error?: string }).error ?? `HTTP ${res.status}`
    throw new Error(`the hosting server refused this bundle: ${why}`)
  }
  return body as Draft
}

/** Create or replace the draft for `domain`. Re-publishing the same domain overwrites the JSON
 *  and keeps the pictures already uploaded, because the common edit is a wording change after the
 *  photographs are in place, and making that re-upload everything would train people to batch
 *  their corrections. */
export function putDraft(t: Target, body: Body, fetchImpl: typeof fetch = fetch): Promise<Draft> {
  return call(t, '/api/bundle', { method: 'POST', body: JSON.stringify(body) }, fetchImpl)
}

/** What the server currently holds for a domain — chiefly which pictures are still missing. */
export function getDraft(t: Target, domain: string, fetchImpl: typeof fetch = fetch): Promise<Draft> {
  return call(t, `/api/bundle?domain=${encodeURIComponent(domain)}`, { method: 'GET' }, fetchImpl)
}

/** Discard a draft and everything uploaded against it. */
export function deleteDraft(t: Target, domain: string, fetchImpl: typeof fetch = fetch): Promise<Draft> {
  return call(t, `/api/bundle?domain=${encodeURIComponent(domain)}`, { method: 'DELETE' }, fetchImpl)
}
