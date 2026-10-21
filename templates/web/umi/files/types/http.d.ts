declare namespace Http {
  interface Res<T> { success: boolean, data: T, message?: string }
  type PageRes<T> = Res<{ total: number, list: T[] }>
  type PageReq<T = Record<string, unknown>> = { pageIndex: number, pageSize: number } & T
}
interface Window { CONFIG?: { APP_NAME?: string, MODE?: string, API_BASE_URL?: string } }
