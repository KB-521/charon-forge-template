import { message } from 'antd'
import { useCallback, useState } from 'react'
import { downloadFile } from '@/utils/download'

export function useExport<T>(
  params: T,
  exporter: (params: T) => Promise<Blob | string>,
  filename = 'export.csv',
) {
  const [loading, setLoading] = useState(false)
  const handleExport = useCallback(
    async (override?: T) => {
      setLoading(true)
      try {
        downloadFile(await exporter(override ?? params), filename)
      }
      catch (error) {
        message.error(error instanceof Error ? error.message : '导出失败')
      }
      finally {
        setLoading(false)
      }
    },
    [params, exporter, filename],
  )
  return { handleExport, loading }
}
