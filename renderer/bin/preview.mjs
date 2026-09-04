#!/usr/bin/env node
/** blackdash-preview [content-dir] — runs the renderer's dev server against a creator's content. */
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const pkg = dirname(dirname(fileURLToPath(import.meta.url)))
const content = resolve(process.cwd(), process.argv[2] ?? 'content')
spawn('npx', ['vite', '--config', resolve(pkg, 'vite.config.ts')],
  { cwd: pkg, stdio: 'inherit', env: { ...process.env, CONTENT_DIR: content } })
