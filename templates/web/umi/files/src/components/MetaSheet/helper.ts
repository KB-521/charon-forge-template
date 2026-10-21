import type { ButtonType } from 'antd/es/button'
import type { ColumnType } from 'antd/lib/table'
import type { CustomerOption } from './useDefaultRender'

export function checkCustomerOption(object: any): object is CustomerOption {
  if (object?.node)
    return true
  return false
}
export function checkButtonType(object: any): object is ButtonType {
  if (object?.label && object?.handler)
    return true
  return false
}
export function columnWidthCheck(
  columns: ColumnType<any>[],
): ColumnType<any>[] {
  return columns.map((col) => {
    if (col.width)
      return col
    if (typeof col.title === 'string') {
      return { ...col, width: String(col.title).length * 30 }
    }
    return col
  })
}
