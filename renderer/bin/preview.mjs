#!/usr/bin/env node
/** blackdash-preview [content-dir] — runs the renderer's dev server against a creator's content. */
import { spawn } from 'node:child_process'
import { dirname, resolve, join } from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const pkg = dirname(dirname(fileURLToPath(import.meta.url)))
const content = resolve(process.cwd(), process.argv[2] ?? 'content')
/** Images sit beside the content, in the creator's own repo — `assets/<client>/<file>`,
 *  served at `/img/<client>/<file>`. Without this the preview only ever finds the
 *  renderer package's own demo images and a creator's bundle renders blank. */
const assets = process.env.ASSETS_DIR ?? join(dirname(content), 'assets')
const env = { ...process.env, CONTENT_DIR: content }
if (existsSync(assets)) env.ASSETS_DIR = assets
else console.warn(`[preview] no assets dir at ${assets} — images will 404`)
spawn('npx', ['vite', '--config', resolve(pkg, 'vite.config.ts')],
  { cwd: pkg, stdio: 'inherit', env })
