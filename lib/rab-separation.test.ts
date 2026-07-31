import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = path.resolve(import.meta.dirname, '..')

const retiredImplementationPaths = [
  'app/api/master',
  'app/api/proyek/[id]/rab',
  'app/api/proyek/[id]/workflow',
  'app/proyek/[id]/rab',
  'app/proyek/rab',
  'components/database/ahsp-import-preview-panel.tsx',
  'components/database/master-reference-page.tsx',
  'components/database/reference-database-client.tsx',
  'components/database/reference-database-tables.tsx',
  'components/proyek/audit-timeline.tsx',
  'components/proyek/rab-access-denied-dialog.tsx',
  'components/proyek/rab-ahsp-picker.tsx',
  'components/proyek/rab-maker-client.tsx',
  'components/proyek/rab-project-list-client.tsx',
  'components/proyek/rab-status-actions.tsx',
  'components/proyek/workflow-transition-action.tsx',
  'lib/actions/ahsp.ts',
  'lib/actions/rab.ts',
  'lib/ahsp-import.ts',
  'lib/project-workflow.ts',
  'lib/rab-export.ts',
  'lib/rab-lock.ts',
  'lib/rab-maker.ts',
  'lib/rab-pdf.ts',
  'lib/simple-xlsx.ts',
  'lib/types/ahsp.ts',
  'lib/validations/ahsp.ts',
] as const

function containsImplementationFile(relativePath: string): boolean {
  const absolutePath = path.join(projectRoot, relativePath)
  if (!existsSync(absolutePath)) return false
  if (!statSync(absolutePath).isDirectory()) return true

  return readdirSync(absolutePath).some((entry) =>
    containsImplementationFile(path.join(relativePath, entry))
  )
}

describe('RAB implementation separation', () => {
  it.each(retiredImplementationPaths)('keeps %s out of the monitoring application', (relativePath) => {
    expect(containsImplementationFile(relativePath)).toBe(false)
  })
})
