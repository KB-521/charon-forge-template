import type { InitialState } from './app'

export default function access(state?: InitialState) {
  return {
    canAdmin: Boolean(state?.userInfo.permissions.includes('admin')),
    canReadRecords: Boolean(
      state?.userInfo.permissions.includes('records:read'),
    ),
  }
}
