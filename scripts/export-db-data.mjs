#!/usr/bin/env node

import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const DEFAULT_TABLES = [
  'public.perusahaan',
  'public.proyek',
  'public.override_log',
  'public.dinas_skpd',
]

function readArg(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

const databaseUrl = process.env.DATABASE_URL
const output = resolve(readArg('--out') ?? `tmp/db-exports/konsultan-data-${timestamp()}.sql`)
const tables = (process.env.TABLES?.split(',').map((table) => table.trim()).filter(Boolean) ?? DEFAULT_TABLES)

if (!databaseUrl) {
  console.error('Missing DATABASE_URL.')
  console.error('Usage:')
  console.error("  DATABASE_URL='postgresql://...' npm run db:export:data")
  console.error('')
  console.error('Optional:')
  console.error("  npm run db:export:data -- --out tmp/db-exports/prod-data.sql")
  console.error("  TABLES='public.perusahaan,public.proyek' DATABASE_URL='postgresql://...' npm run db:export:data")
  process.exit(1)
}

mkdirSync(dirname(output), { recursive: true })

const args = [
  databaseUrl,
  '--data-only',
  '--no-owner',
  '--no-privileges',
  '--file',
  output,
]

for (const table of tables) {
  args.push('--table', table)
}

const result = spawnSync('pg_dump', args, {
  stdio: 'inherit',
  env: process.env,
})

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log(`Exported ${tables.length} table(s) to ${output}`)
