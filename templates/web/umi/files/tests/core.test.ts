import assert from 'node:assert/strict'
import test from 'node:test'
import {
  csvCell,
  exportDemoRecords,
  queryDemoRecords,
} from '../src/services/demo.ts'
import { parseJSON } from '../src/utils/json_parse.ts'
import { getUrlAllQuery, getUrlQuery } from '../src/utils/string.ts'
import { validateFile } from '../src/utils/upload.ts'

test('table pagination and page boundaries use a consistent total', () => {
  assert.equal(queryDemoRecords().data.total, 48)
  assert.equal(queryDemoRecords().data.list.length, 20)
  assert.equal(queryDemoRecords({ pageIndex: 2 }).data.list[0].id, 21)
  assert.equal(
    queryDemoRecords({ pageIndex: -1, pageSize: -1 }).data.list[0].id,
    1,
  )
  assert.equal(queryDemoRecords({ pageSize: 10000 }).data.list.length, 48)
})
test('table filters compose and sorting handles known fields only', () => {
  const list = queryDemoRecords({
    name: '项目 0',
    status: 'paused',
    sortField: 'id',
    sortOrder: 'desc',
  }).data.list
  assert.deepEqual(
    list.map(item => item.id),
    [7, 4, 1],
  )
  assert.equal(
    queryDemoRecords({ sortField: 'not-a-field' }).data.list[0].id,
    1,
  )
  assert.equal(
    queryDemoRecords({ sortField: 'id', sortOrder: 'desc' }).data.list[0].id,
    48,
  )
})
test('date ranges filter correctly without a backend', () => {
  const list = queryDemoRecords({
    createdAtStart: '2026-01-27 00:00:00',
    createdAtEnd: '2026-01-28 23:59:59',
  }).data.list
  assert.deepEqual(
    list.map(item => item.id),
    [27, 28],
  )
})
test('CSV export accepts numeric or string IDs and quotes values', () => {
  const csv = exportDemoRecords(['1', 2])
  assert.ok(csv.startsWith('\uFEFF'))
  assert.equal(csv.split('\r\n').length, 3)
  assert.ok(csv.includes('示例项目 01'))
  assert.ok(!csv.includes('示例项目 03'))
  assert.equal(csvCell('a"b'), '"a""b"')
})
test('CSV formula prefixes are escaped', () => {
  for (const value of [
    '=1+1',
    '+1',
    '-2',
    '@SUM(A1)',
    '\tformula',
    '\rformula',
  ])
    assert.ok(csvCell(value).startsWith('"\''))
})
test('file validation rejects oversized and disallowed extensions', () => {
  assert.equal(
    validateFile(
      { name: 'PHOTO.PNG', size: 1024, type: 'image/png' },
      ['.png'],
      4,
    ),
    undefined,
  )
  assert.match(
    validateFile({ name: 'file.exe', size: 1024, type: '' }, ['.pdf'], 4)!,
    /支持格式/,
  )
  assert.match(
    validateFile(
      { name: 'file.pdf', size: 5 * 1024 * 1024, type: '' },
      ['.pdf'],
      4,
    )!,
    /不能超过/,
  )
})
test('query utilities decode values and handle query in hash routes', () => {
  assert.equal(
    getUrlQuery('name', 'https://example.com/?name=%E4%B8%AD%E6%96%87'),
    '中文',
  )
  assert.deepEqual(
    getUrlAllQuery('https://example.com/?id=1#/path?id=2&id=1'),
    { id: ['1', '2'] },
  )
})
test('JSON parsing uses a fallback for malformed input', () => {
  assert.deepEqual(parseJSON('{"ok":true}', {}), { ok: true })
  assert.equal(parseJSON('invalid', null), null)
})

test('query parsing treats prototype-like names as ordinary own keys', () => {
  const result = getUrlAllQuery(
    'https://example.com/?__proto__=safe&constructor=value',
  )
  assert.equal(Object.getPrototypeOf(result), Object.prototype)
  assert.equal(
    Object.getOwnPropertyDescriptor(result, '__proto__')?.value,
    'safe',
  )
})
