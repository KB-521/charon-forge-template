import { useRequest } from 'ahooks'
import { useMemo } from 'react'
import { queryDictionary } from '@/services'

export function useDictList(key: string) {
  const { data = [], loading } = useRequest(() => queryDictionary(key), {
    refreshDeps: [key],
  })
  const dictMap = useMemo(
    () => Object.fromEntries(data.map(item => [item.value, item.label])),
    [data],
  )
  return {
    dictList: data,
    dictOptions: data,
    dictListLoading: loading,
    dictMap,
  }
}
