import { test } from 'node:test'
import assert from 'node:assert/strict'
import { projectName, pagesTarget, DOMAIN_RE, attachDomain, deployToPages } from './deploy'

test('a project name is lowercase, hyphenated and capped', () => {
  assert.equal(projectName('Merryfair.COM'), 'merryfair-com')
  assert.equal(projectName('guard-my-ride.com.my'), 'guard-my-ride-com-my')
  assert.equal(projectName(`${'a'.repeat(80)}.com`).length, 58)
  assert.equal(pagesTarget('merryfair.com'), 'merryfair-com.pages.dev')
})

test('only a hostname is accepted', () => {
  for (const ok of ['merryfair.com', 'a.co', 'guard-my-ride.com.my']) assert.ok(DOMAIN_RE.test(ok), ok)
  for (const bad of ['', 'no-dot', 'https://merryfair.com', '../etc', 'a b.com', 'merryfair.com/x', '-lead.com']) {
    assert.equal(DOMAIN_RE.test(bad), false, bad)
  }
})

test('deploying without credentials skips, and says how to enable it', async () => {
  const r = await deployToPages('merryfair.com', '/tmp/x', {})
  assert.equal(r.status, 'skipped')
  assert.match((r as { reason: string }).reason, /CLOUDFLARE_API_TOKEN/)
})

test('a domain that is not a hostname is refused before wrangler is invoked', async () => {
  const r = await deployToPages('; rm -rf /', '/tmp/x', { CLOUDFLARE_API_TOKEN: 't', CLOUDFLARE_ACCOUNT_ID: 'a' })
  assert.equal(r.status, 'skipped')
  assert.match((r as { reason: string }).reason, /not a hostname/)
})

const env = { CLOUDFLARE_API_TOKEN: 't', CLOUDFLARE_ACCOUNT_ID: 'acct' }
const ok = (body: unknown) => ({ ok: true, json: async () => body }) as unknown as Response

test('an already-attached domain is not attached twice', async () => {
  const calls: string[] = []
  const fake = (async (url: string, init?: RequestInit) => {
    calls.push(init?.method ?? 'GET')
    return ok({ result: [{ name: 'merryfair.com', status: 'active' }] })
  }) as unknown as typeof fetch
  const r = await attachDomain('merryfair.com', 'merryfair-com', env, fake)
  assert.deepEqual(r, { name: 'merryfair.com', status: 'active' })
  assert.deepEqual(calls, ['GET'], 'should not POST when the domain is already there')
})

test('a new domain is attached and its pending status reported', async () => {
  const fake = (async (_url: string, init?: RequestInit) =>
    init?.method === 'POST' ? ok({ result: { status: 'pending' } }) : ok({ result: [] })
  ) as unknown as typeof fetch
  assert.deepEqual(await attachDomain('merryfair.com', 'merryfair-com', env, fake), { name: 'merryfair.com', status: 'pending' })
})

test('one site failing to attach returns null rather than throwing', async () => {
  const boom = (async () => { throw new Error('DNS is on fire') }) as unknown as typeof fetch
  assert.equal(await attachDomain('merryfair.com', 'merryfair-com', env, boom), null)
})
