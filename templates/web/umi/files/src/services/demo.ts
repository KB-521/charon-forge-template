export interface DemoRecord {
  id: number
  name: string
  status: 'active' | 'paused'
  createdAt: string
}
export interface RecordQuery {
  pageIndex?: number
  pageSize?: number
  name?: string
  status?: string
  sortField?: string
  sortOrder?: string
  createdAtStart?: string
  createdAtEnd?: string
}
export interface Profile {
  name: string
  email: string
  permissions: string[]
}
export const demoProfile: Profile = {
  name: '演示用户',
  email: 'demo@example.com',
  permissions: ['records:read', 'profile:read'],
}
export const demoRecords: DemoRecord[] = Array.from({ length: 48 }, (_, i) => ({
  id: i + 1,
  name: `示例项目 ${String(i + 1).padStart(2, '0')}`,
  status: i % 3 === 0 ? 'paused' : 'active',
  createdAt: `2026-01-${String((i % 28) + 1).padStart(2, '0')} 10:00:00`,
}))
function positive(value: unknown, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}
export function queryDemoRecords(query: RecordQuery = {}) {
  let list = demoRecords.filter(
    row =>
      (!query.name || row.name.includes(query.name))
      && (!query.status || row.status === query.status)
      && (!query.createdAtStart || row.createdAt >= query.createdAtStart)
      && (!query.createdAtEnd || row.createdAt <= query.createdAtEnd),
  )
  if (
    query.sortField
    && ['id', 'name', 'createdAt'].includes(query.sortField)
  ) {
    const field = query.sortField as 'id' | 'name' | 'createdAt'
    list = [...list].sort((a, b) => {
      const result
        = typeof a[field] === 'number'
          ? Number(a[field]) - Number(b[field])
          : String(a[field]).localeCompare(String(b[field]))
      return query.sortOrder === 'desc' ? -result : result
    })
  }
  const pageSize = Math.min(positive(query.pageSize, 20), 200)
  const start = (positive(query.pageIndex, 1) - 1) * pageSize
  return {
    success: true,
    data: { total: list.length, list: list.slice(start, start + pageSize) },
  }
}
export function csvCell(value: unknown) {
  let text = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(text))
    text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}
export function exportDemoRecords(idList: (string | number)[] = []) {
  const rows = idList.length
    ? demoRecords.filter(row =>
        idList.some(id => String(id) === String(row.id)),
      )
    : demoRecords
  return `\uFEFF${[['编号', '名称', '状态', '创建时间'], ...rows.map(r => [r.id, r.name, r.status, r.createdAt])].map(r => r.map(csvCell).join(',')).join('\r\n')}`
}
