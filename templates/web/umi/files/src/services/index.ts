import type { Profile, RecordQuery } from './demo'
import { request } from '@umijs/max'
import { getRuntimeConfig } from '@/config/runtime'
import { demoProfile, exportDemoRecords, queryDemoRecords } from './demo'

export async function queryRecords(params: RecordQuery) {
  return getRuntimeConfig().MODE === 'demo'
    ? queryDemoRecords(params)
    : request<Http.PageRes<import('./demo').DemoRecord>>('/records', {
        params,
      })
}
export async function getProfile(): Promise<Profile> {
  return getRuntimeConfig().MODE === 'demo'
    ? { ...demoProfile, permissions: [...demoProfile.permissions] }
    : (await request<Http.Res<Profile>>('/users/me')).data
}
export async function saveProfile(
  values: Pick<Profile, 'name' | 'email'>,
): Promise<Profile> {
  if (getRuntimeConfig().MODE === 'demo') {
    Object.assign(demoProfile, values)
    return { ...demoProfile }
  }
  return (
    await request<Http.Res<Profile>>('/users/me', {
      method: 'PUT',
      data: values,
    })
  ).data
}
export async function queryDictionary(key: string) {
  if (getRuntimeConfig().MODE === 'demo') {
    return [
      { value: 'active', label: '启用' },
      { value: 'paused', label: '暂停' },
    ]
  }
  return (
    await request<Http.Res<{ value: string, label: string }[]>>(
      `/dictionaries/${encodeURIComponent(key)}`,
    )
  ).data
}
export async function exportRecords({
  idList,
}: {
  idList: (string | number)[]
}) {
  return getRuntimeConfig().MODE === 'demo'
    ? exportDemoRecords(idList)
    : request<Blob>('/records/export', {
        method: 'POST',
        data: { idList },
        responseType: 'blob',
      })
}
