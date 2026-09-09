/** Publish a built site to Cloudflare Pages.
 *
 *  Ported from the earlier round of this work rather than re-derived: it had already replaced a
 *  VPS-and-Caddy deploy with this, and the reasoning holds here — one Pages project per site,
 *  direct upload of the built directory, custom domain attached over the API.
 *  https://developers.cloudflare.com/pages/get-started/direct-upload/
 *
 *  Deliberately skips rather than fails when the credentials are absent, so `npm run build`
 *  stays a local operation for anyone checking a bundle. Deploying is the exception, not the
 *  default: a build that silently published every time it ran would be a trap. */
import { execFileSync } from 'node:child_process'

/** Cloudflare Pages project names are lowercase alphanumeric plus hyphen, 58 characters at most. */
export function projectName(domain: string): string {
  return domain.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 58)
}

/** The host a site's custom domain should CNAME to. */
export function pagesTarget(domain: string): string {
  return `${projectName(domain)}.pages.dev`
}

/** A hostname, and nothing that could be read as a shell argument or a path. The domain reaches
 *  here from `org.json`, which is model-generated and uploaded from a machine we do not control. */
export const DOMAIN_RE = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/

export type DeployResult =
  | { status: 'skipped'; reason: string }
  | { status: 'deployed'; project: string; domain?: { name: string; status: string } }

type Env = { CLOUDFLARE_API_TOKEN?: string; CLOUDFLARE_ACCOUNT_ID?: string }

/** Attach the site's own domain to its Pages project.
 *
 *  Idempotent — it lists first — and best-effort: a DNS or zone problem on one site logs and
 *  returns rather than aborting a fleet-wide rebuild. If the zone is not on this Cloudflare
 *  account, Cloudflare leaves the domain "pending" until the CNAME it reports is added wherever
 *  the domain is actually managed. */
export async function attachDomain(
  domain: string, project: string, env: Env = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<{ name: string; status: string } | null> {
  if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) return null
  if (!DOMAIN_RE.test(domain)) return null
  const base = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${project}/domains`
  const headers = { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' }
  try {
    const listRes = await fetchImpl(base, { headers })
    const listJson = await listRes.json() as { result?: Array<{ name: string; status: string }> }
    if (!listRes.ok) return null
    const existing = (listJson.result ?? []).find((d) => d.name === domain)
    if (existing) return { name: domain, status: existing.status }
    const addRes = await fetchImpl(base, { method: 'POST', headers, body: JSON.stringify({ name: domain }) })
    const addJson = await addRes.json() as { result?: { status?: string } }
    if (!addRes.ok) return null
    return { name: domain, status: addJson.result?.status ?? 'unknown' }
  } catch {
    return null
  }
}

/** Direct-upload `dir` to the Pages project for `domain`.
 *
 *  `wrangler pages deploy` no longer creates the project, so it is created first and an
 *  "already exists" is the expected answer on every run after the first. */
export async function deployToPages(
  domain: string, dir: string, env: Env = process.env,
): Promise<DeployResult> {
  if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) {
    return { status: 'skipped', reason: 'set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID to deploy' }
  }
  if (!DOMAIN_RE.test(domain)) {
    return { status: 'skipped', reason: `"${domain}" is not a hostname` }
  }
  const project = projectName(domain)
  try {
    execFileSync('npx', ['wrangler', 'pages', 'project', 'create', project, '--production-branch', 'main'],
      { stdio: 'pipe', env: process.env })
  } catch (err) {
    const e = err as { stdout?: Buffer; stderr?: Buffer }
    if (!/already exists/i.test(`${e.stdout ?? ''}${e.stderr ?? ''}`)) throw err
  }
  execFileSync('npx', ['wrangler', 'pages', 'deploy', dir, '--project-name', project, '--branch', 'main', '--commit-dirty=true'],
    { stdio: 'inherit', env: process.env })
  const attached = await attachDomain(domain, project, env)
  return { status: 'deployed', project, ...(attached ? { domain: attached } : {}) }
}
