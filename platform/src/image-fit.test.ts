/** The crop check reads real file headers, so the fixtures are real files — bytes written
 *  here rather than committed, because a check that parses headers is worth nothing if it is
 *  tested against a mock of a header. Run: `npm test`. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { imageSize, visibleFraction, cropMessage } from './image-fit'

const dir = mkdtempSync(join(tmpdir(), 'image-fit-'))

/** Minimal PNG: signature, then an IHDR whose width and height are all the check reads. */
function png(w: number, h: number): string {
  const b = Buffer.alloc(24)
  b.writeUInt32BE(0x89504e47, 0)
  b.writeUInt32BE(0x0d0a1a0a, 4)
  b.writeUInt32BE(13, 8)
  b.write('IHDR', 12)
  b.writeUInt32BE(w, 16)
  b.writeUInt32BE(h, 20)
  const file = join(dir, `${w}x${h}.png`)
  writeFileSync(file, b)
  return file
}

/** Minimal baseline JPEG: SOI, a segment to skip over, then the SOF0 that carries the size. */
function jpeg(w: number, h: number): string {
  const head = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00])
  const sof = Buffer.alloc(11)
  sof.writeUInt16BE(0xffc0, 0)
  sof.writeUInt16BE(8, 2)
  sof.writeUInt8(8, 4)
  sof.writeUInt16BE(h, 5)
  sof.writeUInt16BE(w, 7)
  // A real file carries a scan after the frame; without it this is a truncated JPEG, which the
  // reader is right to refuse.
  const scan = Buffer.concat([Buffer.from([0xff, 0xda, 0x00, 0x08]), Buffer.alloc(16)])
  const file = join(dir, `${w}x${h}.jpg`)
  writeFileSync(file, Buffer.concat([head, sof, scan]))
  return file
}

test('reads PNG dimensions from the header', () => {
  assert.deepEqual(imageSize(png(1600, 900)), { w: 1600, h: 900 })
})

test('reads JPEG dimensions by walking to the first start-of-frame', () => {
  assert.deepEqual(imageSize(jpeg(800, 1200)), { w: 800, h: 1200 })
})

test('an unreadable or missing file is skipped, not guessed at', () => {
  assert.equal(imageSize(join(dir, 'nope.png')), null)
  const junk = join(dir, 'junk.png')
  writeFileSync(junk, Buffer.alloc(40))
  assert.equal(imageSize(junk), null)
})

test('a matching shape is fully visible; a mismatched one is not', () => {
  assert.equal(visibleFraction({ w: 1000, h: 1000 }, 1), 1)
  // a 21:9 panorama in a 3:4 portrait frame keeps about a sixth of itself
  assert.ok(visibleFraction({ w: 2100, h: 900 }, 3 / 4) < 0.33)
})

test('a panorama in a portrait frame is reported, with both shapes and a way out', () => {
  const msg = cropMessage('pages.home.blocks[0]', png(2100, 900), { w: 2100, h: 900 }, 'portrait')
  assert.ok(msg, 'expected a crop message')
  assert.match(msg, /shows only \d+%/)
  assert.match(msg, /2100x900\.png/)
  assert.match(msg, /16:9/)
})

test('a photograph that fits its frame is silent', () => {
  assert.equal(cropMessage('pages.home.blocks[0]', png(1600, 900), { w: 1600, h: 900 }, 'wide'), null)
  assert.equal(cropMessage('pages.home.blocks[0]', png(1000, 1000), { w: 1000, h: 1000 }, 'square'), null)
})

test('a frame with no fixed shape cannot be judged', () => {
  assert.equal(cropMessage('pages.home.blocks[0]', png(2100, 900), { w: 2100, h: 900 }, 'fill'), null)
})
