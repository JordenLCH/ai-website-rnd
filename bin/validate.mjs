#!/usr/bin/env node
/** blackdash-validate <site.json> <theme.json> [org.json] */
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const pkg = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2).map((a) => resolve(process.cwd(), a))
spawn('node', ['--import', 'tsx', resolve(pkg, 'tools/validate.ts'), ...args],
  { cwd: pkg, stdio: 'inherit' })
