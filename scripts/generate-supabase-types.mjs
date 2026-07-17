import { spawnSync } from 'node:child_process'
import { renameSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const projectId = process.env.SUPABASE_PROJECT_ID || 'otivzjkfedxlwkgiewkm'
const cliPath = resolve(
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'supabase.cmd' : 'supabase'
)
const outputPath = resolve('lib/database.types.ts')
const temporaryPath = `${outputPath}.tmp`

const result = spawnSync(
  cliPath,
  ['gen', 'types', 'typescript', '--project-id', projectId],
  {
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 50 * 1024 * 1024,
  }
)

if (result.status !== 0) {
  rmSync(temporaryPath, { force: true })
  process.stderr.write(result.stderr || 'Supabase type generation failed.\n')
  process.exit(result.status || 1)
}

if (!result.stdout.startsWith('export type Json')) {
  rmSync(temporaryPath, { force: true })
  process.stderr.write('Supabase returned an unexpected type payload; existing types were preserved.\n')
  process.exit(1)
}

writeFileSync(temporaryPath, result.stdout, { encoding: 'utf8', mode: 0o600 })
renameSync(temporaryPath, outputPath)
process.stdout.write('Updated lib/database.types.ts atomically.\n')
