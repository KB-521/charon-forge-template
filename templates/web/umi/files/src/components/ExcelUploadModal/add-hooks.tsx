import { useCallback, useState } from 'react'

export default function useExcelModal(saveCallback: () => void) {
  const [excelVisible, setExcelVisible] = useState(false)
  const [excelModalTitle, setExcelModalTitle] = useState('')

  const handleExcelAdd = useCallback(() => {
    setExcelModalTitle('excel导入')
    setExcelVisible(true)
  }, [])

  const handleExcelSave = useCallback(() => {
    setExcelVisible(false)
    saveCallback?.()
  }, [saveCallback])

  const handleExcelCancel = useCallback(() => {
    setExcelVisible(false)
  }, [])

  return {
    handleExcelAdd,
    handleExcelCancel,
    handleExcelSave,
    excelVisible,
    excelModalTitle,
  }
}
