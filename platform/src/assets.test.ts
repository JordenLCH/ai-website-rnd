import { test } from 'node:test'
import assert from 'node:assert/strict'
import { referencedAssets, assetFileName, missingAssets } from './assets'

const site = {
  client: 'acme',
  chrome: { header: { type: 'Nav', props: { logo: '/img/acme/logo.webp' } } },
  pages: {
    home: { blocks: [
      { type: 'Hero', props: { src: '/img/acme/hero.webp', alt: 'A workshop' } },
      { type: 'Gallery', props: { items: [{ src: '/img/acme/a.webp' }, { src: '/img/acme/sub/b.webp' }] } },
    ] },
  },
}

test('every image is found wherever it sits, chrome and nested arrays included', () => {
  assert.deepEqual(referencedAssets(site), [
    '/img/acme/logo.webp', '/img/acme/hero.webp', '/img/acme/a.webp', '/img/acme/sub/b.webp',
  ])
})

test('a repeated image is listed once', () => {
  const twice = { a: '/img/acme/x.webp', b: { c: '/img/acme/x.webp' } }
  assert.deepEqual(referencedAssets(twice), ['/img/acme/x.webp'])
})

test('strings that are not asset paths are ignored', () => {
  const noise = { a: 'https://cdn.example.com/img/acme/x.webp', b: 'see /img/acme/x.webp', c: '/images/x.webp', d: 'hello' }
  assert.deepEqual(referencedAssets(noise), [])
})

test('the file name drops the /img/<client>/ prefix the build adds', () => {
  assert.equal(assetFileName('/img/acme/hero.webp'), 'hero.webp')
  assert.equal(assetFileName('/img/acme/sub/b.webp'), 'sub/b.webp')
})

test('a traversing or absolute name is refused, not cleaned', () => {
  for (const p of ['/img/acme/../../etc/passwd', '/img/acme/..', '/img/acme//etc/passwd', '/img/acme/a\\b.webp']) {
    assert.equal(assetFileName(p), null, p)
  }
})

test('missing is what is referenced and not yet uploaded', () => {
  assert.deepEqual(missingAssets(site, ['logo.webp', 'a.webp']), ['/img/acme/hero.webp', '/img/acme/sub/b.webp'])
  assert.deepEqual(missingAssets(site, ['logo.webp', 'hero.webp', 'a.webp', 'sub/b.webp']), [])
})
