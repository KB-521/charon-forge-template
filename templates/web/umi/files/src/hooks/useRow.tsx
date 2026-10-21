import { Alert } from 'antd'
import { useCallback, useMemo, useState } from 'react'

export function useRowSelection() {
  const [showRowSelection, setShowRowSelection] = useState(true)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRows, setSelectedRows] = useState<any[]>([])

  const onSelectChange = (
    newSelectedRowKeys: React.Key[],
    newSelectedRows: any[],
  ) => {
    setSelectedRowKeys(newSelectedRowKeys)
    setSelectedRows(newSelectedRows)
  }

  const rowSelection = useMemo(() => {
    if (showRowSelection) {
      return {
        selectedRowKeys,
        onChange: onSelectChange,
        fixed: true,
      }
    }

    return undefined
  }, [selectedRowKeys, showRowSelection])

  const hasSelected = useMemo(() => {
    return selectedRowKeys.length > 0
  }, [selectedRowKeys.length])

  const renderSelectAlert = useMemo(() => {
    if (hasSelected) {
      return (
        <Alert
          message={`已选${selectedRowKeys.length}条数据`}
          type="info"
          showIcon
        />
      )
    }

    return null
  }, [hasSelected, selectedRowKeys.length])

  const switchShowRowSelection = useCallback(() => {
    setShowRowSelection(prev => !prev)
  }, [])

  const clearRowSelection = useCallback(() => {
    setSelectedRowKeys([])
    setSelectedRows([])
  }, [])

  return {
    rowSelection,
    hasSelected,
    showRowSelection,
    switchShowRowSelection,
    selectedRowKeys,
    selectedRows,
    clearRowSelection,
    renderSelectAlert,
  }
}
