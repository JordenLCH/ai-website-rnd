import { test } from 'node:test'
import assert from 'node:assert/strict'
import { themeIntegrityIssues } from './theme-integrity'

test('the theme arriving as custom properties is not a leak', () => {
  const html = '<div class="site" style="--color-bg:#E7E4DB;--color-accent:#7BB241;--overlay:linear-gradient(90deg, rgba(21,22,15,0.92) 0%, rgba(21,22,15,0.15) 100%)">x</div>'
  assert.deepEqual(themeIntegrityIssues(html, 'pages.home'), [])
})

test('a section carrying theme vars is not a leak either', () => {
  const html = '<div class="section" style="--color-bg:#111;--pad-y:80px">x</div>'
  assert.deepEqual(themeIntegrityIssues(html, 'pages.home'), [])
})

test('a hardcoded colour on a painting property is an error', () => {
  const html = '<p style="color:#7BB241">x</p>'
  const issues = themeIntegrityIssues(html, 'pages.home')
  assert.equal(issues.length, 1)
  assert.equal(issues[0].severity, 'error')
  assert.match(issues[0].message, /color:#7BB241/)
  assert.match(issues[0].message, /every theme/)
})

test('rgb, hsl, oklch and a shadow colour are all caught', () => {
  for (const decl of [
    'background:rgb(12,12,12)',
    'border-color:hsl(210 40% 40%)',
    'fill:oklch(0.7 0.1 200)',
    'box-shadow:0 1px 2px rgba(0,0,0,0.4)',
  ]) {
    assert.equal(themeIntegrityIssues(`<i style="${decl}">x</i>`, 'p').length, 1, decl)
  }
})

test('non-colour inline styles are left alone', () => {
  const html = '<div style="grid-area:1/1/2/9"></div><div style="--cols:12;--min-h:76cqi"></div><div style="width:50%">x</div>'
  assert.deepEqual(themeIntegrityIssues(html, 'pages.home'), [])
})

test('var() and currentColor are how a colour is supposed to be reached', () => {
  const html = '<p style="color:var(--color-accent)">a</p><p style="fill:currentColor">b</p>'
  assert.deepEqual(themeIntegrityIssues(html, 'pages.home'), [])
})

test('the same leak repeated across a page is reported once', () => {
  const html = '<p style="color:#fff">a</p><p style="color:#fff">b</p><p style="color:#fff">c</p>'
  assert.equal(themeIntegrityIssues(html, 'pages.home').length, 1)
})
