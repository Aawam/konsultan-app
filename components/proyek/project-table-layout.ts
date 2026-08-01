export type ProjectTableColumnKey =
  | 'project'
  | 'company'
  | 'type'
  | 'year'
  | 'district'
  | 'progress'
  | 'contract'

export type ProjectTableColumn = {
  key: ProjectTableColumnKey
  width: number
}

const CORE_COLUMNS: readonly ProjectTableColumn[] = [
  { key: 'project', width: 350 },
  { key: 'company', width: 160 },
  { key: 'type', width: 120 },
  { key: 'year', width: 80 },
  { key: 'district', width: 130 },
  { key: 'progress', width: 160 },
]

const COMMERCIAL_COLUMN: ProjectTableColumn = { key: 'contract', width: 130 }

export function getProjectTableColumns(canViewCommercial: boolean): readonly ProjectTableColumn[] {
  return canViewCommercial ? [...CORE_COLUMNS, COMMERCIAL_COLUMN] : CORE_COLUMNS
}

export function getProjectTableMinWidth(canViewCommercial: boolean) {
  return getProjectTableColumns(canViewCommercial).reduce((total, column) => total + column.width, 0)
}
