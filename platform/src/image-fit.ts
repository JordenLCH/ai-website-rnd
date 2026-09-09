/** Does the photograph survive the frame it was put in?
 *
 *  `ratio: "portrait"` is one word in a bundle, and nothing in the bundle says the photograph
 *  behind it is a 21:9 panorama. The frames crop with `object-fit: cover`, so the mismatch is
 *  silent: the page renders, validates, and shows a third of the picture.
 *
 *  Ported from the earlier round of this work, where seven of seventeen corrections made to four
 *  generated pages were picture shape — the one judgement the model reliably got wrong, because
 *  nothing ever showed it the consequence. It is the only check here that opens a file, which is
 *  why it lives in the build farm rather than in the pure validator the preview also runs.
 *
 *  Header parsing only: no decode, no dependency. An image whose header cannot be read is skipped
 *  rather than reported — an unreadable file is a different problem, and guessing produces noise. */
import { readFileSync } from 'node:fs'

export type Dims = { w: number; h: number }

/** The frames the image primitive offers, as they are declared in styles.css.
 *  `fill` stretches to its container and has no fixed shape, so it cannot be judged. */
export const FRAME_RATIOS: Record<string, number> = {
  square: 1,
  portrait: 3 / 4,
  landscape: 4 / 3,
  wide: 16 / 9,
}

/** Width and height from the file header. PNG, JPEG (any SOFn), WebP (VP8/VP8L/VP8X), GIF. */
export function imageSize(file: string): Dims | null {
  let b: Buffer
  try { b = readFileSync(file) } catch { return null }
  if (b.length < 24) return null

  // PNG: IHDR is always the first chunk, width and height big-endian at 16.
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }

  // GIF: logical screen descriptor, little-endian at 6.
  if (b.toString('ascii', 0, 3) === 'GIF') return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) }

  // WebP: RIFF container, three encodings with three different header shapes.
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const fmt = b.toString('ascii', 12, 16)
    if (fmt === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff }
    if (fmt === 'VP8L') {
      const n = b.readUInt32LE(21)
      return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 }
    }
    if (fmt === 'VP8X') {
      const rd24 = (o: number) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)
      return { w: rd24(24) + 1, h: rd24(27) + 1 }
    }
    return null
  }

  // JPEG: walk the segments to the first start-of-frame. Sizes live only there, and which SOFn
  // it is depends on the encoding, so the whole SOF range is accepted except the two markers in
  // it that are not frames (DHT at C4, DAC at CC).
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue }
      const marker = b[i + 1]
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }
      }
      i += 2 + b.readUInt16BE(i + 2)
    }
  }
  return null
}

/** Fraction of the photograph still visible once the frame crops it with `object-fit: cover`.
 *  1 means the shapes match; 0.33 means two thirds of the picture is outside the frame. */
export function visibleFraction(image: Dims, frameRatio: number): number {
  const imageRatio = image.w / image.h
  return Math.min(imageRatio / frameRatio, frameRatio / imageRatio)
}

const ratioWords: Array<[number, string]> = [
  [1 / 1, '1:1'], [3 / 4, '3:4'], [4 / 3, '4:3'], [16 / 9, '16:9'],
]
const nearestWord = (r: number) =>
  ratioWords.reduce((best, [v, w]) => (Math.abs(v - r) < Math.abs(best[0] - r) ? [v, w] : best), [Infinity, ''] as [number, string])[1]

/** The message a person can act on: what the picture is, what the frame is, and the two ways out. */
export function cropMessage(where: string, file: string, image: Dims, frame: string): string | null {
  const frameRatio = FRAME_RATIOS[frame]
  if (!frameRatio) return null
  const visible = visibleFraction(image, frameRatio)
  if (visible >= 0.5) return null
  const name = file.split('/').pop()
  return `${where} shows only ${Math.round(visible * 100)}% of ${name} — the picture is ` +
    `${(image.w / image.h).toFixed(2)}:1 and the frame is ${(frameRatio).toFixed(2)}:1 (${frame}). ` +
    `Choose a ratio nearer the photograph (${nearestWord(image.w / image.h)}) or crop the file to the frame`
}

/** Walk a bundle for image nodes that declare a frame, and report the ones the frame eats.
 *
 *  Only nodes carrying an explicit `ratio` can be judged: everywhere else the shape comes from
 *  the layout and the stylesheet, which do not exist until the page is rendered at a width.
 *  `resolve` turns a bundle's `/img/<client>/x.webp` into a path on disk, and returns null when
 *  the file is not there — a missing asset is the upload page's problem, not this check's. */
export function imageFitIssues(
  node: unknown,
  resolve: (src: string) => string | null,
  where = 'site',
): Array<{ where: string; message: string; severity: 'error' | 'warning' | 'info' }> {
  const out: Array<{ where: string; message: string; severity: 'error' | 'warning' | 'info' }> = []
  const walk = (n: unknown, path: string) => {
    if (Array.isArray(n)) return n.forEach((c, i) => walk(c, `${path}[${i}]`))
    if (!n || typeof n !== 'object') return
    const o = n as Record<string, unknown>
    if (o.el === 'Image' && typeof o.src === 'string' && typeof o.ratio === 'string') {
      const file = resolve(o.src)
      const dims = file && imageSize(file)
      if (dims) {
        const msg = cropMessage(path, o.src, dims, o.ratio)
        if (msg) out.push({ where: path, message: msg, severity: 'warning' })
      }
    }
    for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`)
  }
  walk(node, where)
  return out
}
