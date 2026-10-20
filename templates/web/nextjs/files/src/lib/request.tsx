import type { AxiosInstance, AxiosResponse, RawAxiosHeaders } from 'axios'
import type { CacheRequestConfig } from 'axios-cache-interceptor'
import axios, { AxiosHeaders } from 'axios'
import { buildKeyGenerator, buildMemoryStorage, setupCache } from 'axios-cache-interceptor'
import { getLocale, t } from './i18n/translator'

/** 通用后端响应协议，保留原工程 code/data/message 的处理方式。 */
export interface HttpResponse<T = unknown> {
  code: string | number
  data: T
  message?: string
}

export enum ERROR_TYPE {
  NOT_LOGIN = 5005,
  NOT_AUTH = 5006,
  NOT_APP_AUTH = 5007,
  DIFFERENT_USER_AUTH = 5009,
  NO_PERMISSION = 5017,
}

export type ErrorCallback = (error: unknown) => void
export type HyperRequestConfig = Omit<CacheRequestConfig<unknown, unknown>, 'cache'> & {
  /** 默认 true；false 时不触发登录过期回调，但仍拒绝失败响应。 */
  loginCheckNeed?: boolean
  /** 默认关闭；true 使用五分钟缓存，也可传入缓存库的配置对象。 */
  cache?: boolean | CacheRequestConfig<unknown, unknown>['cache']
  cacheResponseMatch?: (response: AxiosResponse<unknown>) => boolean
  /** 跳过 code/data 解包，返回完整 AxiosResponse。 */
  rawResponse?: boolean
}

export interface DownloadResponse {
  blob: Blob
  name?: string
}

export interface RequestOptions {
  /** 显式实例地址优先于 window.CONFIG；服务端调用应提供绝对地址。 */
  baseURL?: string
  successCode?: string | number
  getLocale?: () => string
  /** 登录与权限处理由业务接入，不内置跳转、弹窗或 SDK。 */
  onLoginExpired?: ErrorCallback
  onPermissionDenied?: ErrorCallback
  onError?: (message: string, error: unknown) => void
}

let loginExpiredHandler: ErrorCallback | undefined
let permissionDeniedHandler: ErrorCallback | undefined
let errorHandler: RequestOptions['onError']

/** 保留原登录过期注册入口；返回清理函数，便于组件卸载时解除注册。 */
export function setRequestLoginExpired(handler?: ErrorCallback) {
  loginExpiredHandler = handler
  return () => {
    if (loginExpiredHandler === handler)
      loginExpiredHandler = undefined
  }
}

export function setRequestPermissionDenied(handler?: ErrorCallback) {
  permissionDeniedHandler = handler
  return () => {
    if (permissionDeniedHandler === handler)
      permissionDeniedHandler = undefined
  }
}

export function setRequestErrorHandler(handler?: RequestOptions['onError']) {
  errorHandler = handler
  return () => {
    if (errorHandler === handler)
      errorHandler = undefined
  }
}

function isHttpResponse(value: unknown): value is HttpResponse {
  return typeof value === 'object' && value !== null && 'code' in value
}

function downloadName(disposition: unknown): string | undefined {
  if (typeof disposition !== 'string')
    return undefined
  const encoded = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition)?.[1]?.trim()
  if (encoded) {
    try {
      return decodeURIComponent(encoded.replace(/^"|"$/g, ''))
    }
    catch {
      /* malformed encoding: fall back to filename */
    }
  }
  return /filename\s*=\s*(?:"([^"]*)"|([^;]+))/i.exec(disposition)?.slice(1).find(Boolean)?.trim()
}

/** 由原请求封装提取；保留调用契约，移除公司服务与具体产品分支。 */
export function initRequest(client: AxiosInstance = axios.create({ timeout: 30_000 }), options: RequestOptions = {}) {
  const successCode = String(options.successCode ?? 2000)
  const storage = buildMemoryStorage(false, false, 512)
  let cacheEpoch = 0

  const instance = setupCache(client, {
    storage,
    ttl: 5 * 60 * 1000,
    interpretHeader: false,
    methods: ['get', 'post'],
    generateKey: buildKeyGenerator((config) => {
      const headers = AxiosHeaders.from(config.headers as RawAxiosHeaders | undefined)
      return {
        baseURL: config.baseURL,
        url: config.url,
        method: config.method,
        params: config.params,
        data: config.data,
        locale: headers.get('Accept-Language'),
        authorization: headers.get('Authorization'),
        cookie: headers.get('Cookie'),
        cacheEpoch,
      }
    }),
    cachePredicate: {
      statusCheck: status => status >= 200 && status < 300,
      responseMatch: response =>
        isHttpResponse(response.data) && String(response.data.code) === successCode,
    },
  })

  function request<T = unknown>(params: HyperRequestConfig & { rawResponse: true }, errorCallback?: ErrorCallback, disableEmitErrorToast?: boolean,): Promise<AxiosResponse<T>>
  function request(
    params: HyperRequestConfig & { responseType: 'blob' },
    errorCallback?: ErrorCallback,
    disableEmitErrorToast?: boolean,
  ): Promise<DownloadResponse>
  function request<T = unknown>(
    params: HyperRequestConfig,
    errorCallback?: ErrorCallback,
    disableEmitErrorToast?: boolean,
  ): Promise<T>
  async function request(
    params: HyperRequestConfig,
    errorCallback?: ErrorCallback,
    disableEmitErrorToast = false,
  ): Promise<unknown> {
    const { cache, cacheResponseMatch, rawResponse, loginCheckNeed = true, ...config } = params
    const headers = AxiosHeaders.from(config.headers as RawAxiosHeaders | undefined)
    if (!headers.has('Accept-Language')) {
      const locale = options.getLocale?.() ?? getLocale()
      headers.set('Accept-Language', locale)
    }
    const requestConfig: CacheRequestConfig<unknown, unknown> = {
      ...config,
      baseURL: config.baseURL ?? options.baseURL
        ?? (typeof window !== 'undefined' ? window.CONFIG?.BASE_URL : undefined)
        ?? '/api',
      headers,
      cache: cache ? (cache === true ? {} : cache) : false,
    }
    if (!config.method || config.method.toLowerCase() === 'get') {
      requestConfig.params = config.params ?? config.data
      requestConfig.data = undefined
    }
    // 文件内容不适合作为普通 JSON 缓存键，默认禁用 multipart/下载缓存。
    if (
      (typeof FormData !== 'undefined' && config.data instanceof FormData)
      || config.responseType === 'blob'
      || rawResponse
    ) {
      requestConfig.cache = false
    }
    if (cacheResponseMatch && requestConfig.cache) {
      const configuredPredicate = requestConfig.cache.cachePredicate
      requestConfig.cache = {
        ...requestConfig.cache,
        cachePredicate: {
          ...(typeof configuredPredicate === 'object' ? configuredPredicate : {}),
          statusCheck: status => status >= 200 && status < 300,
          responseMatch: response =>
            isHttpResponse(response.data)
            && String(response.data.code) === successCode
            && cacheResponseMatch(response),
        },
      }
    }

    const notify = (error: unknown) => {
      if (!disableEmitErrorToast && !axios.isCancel(error)) {
        const message = isHttpResponse(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : undefined;
        (options.onError ?? errorHandler)?.(message || t('common.requestFailed'), error)
      }
    }
    let response: AxiosResponse<unknown>
    try {
      response = await instance(requestConfig)
    }
    catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401 && loginCheckNeed) {
        (options.onLoginExpired ?? loginExpiredHandler)?.(error)
      }
      else if (axios.isAxiosError(error) && error.response?.status === 403) {
        (options.onPermissionDenied ?? permissionDeniedHandler)?.(error)
      }
      else {
        notify(error)
      }
      errorCallback?.(error)
      throw error
    }
    if (rawResponse)
      return response
    if (config.responseType === 'blob') {
      return { blob: response.data, name: downloadName(response.headers['content-disposition']) }
    }
    const body = response.data
    if (isHttpResponse(body) && String(body.code) === successCode)
      return body.data
    const code = isHttpResponse(body) ? Number(body.code) : undefined
    if (code === ERROR_TYPE.NOT_LOGIN) {
      if (loginCheckNeed)
        (options.onLoginExpired ?? loginExpiredHandler)?.(body)
    }
    else if (
      code === ERROR_TYPE.NOT_AUTH
      || code === ERROR_TYPE.NOT_APP_AUTH
      || code === ERROR_TYPE.NO_PERMISSION
    ) {
      (options.onPermissionDenied ?? permissionDeniedHandler)?.(body)
    }
    else {
      notify(body)
    }
    errorCallback?.(body)
    throw body
  }

  return Object.assign(request, {
    client: instance,
    clearCache: () => {
      cacheEpoch += 1
      storage.data = {}
    },
  })
}

export type Request = ReturnType<typeof initRequest>

/** 按接口路径切换服务地址，保留完整调用参数、泛型和缓存管理能力。 */
export function requestWithMapBaseURL(baseURLMap: Map<string, string>, request: Request): Request {
  const mapped = (
    params: HyperRequestConfig,
    errorCallback?: ErrorCallback,
    disableEmitErrorToast?: boolean,
  ) =>
    request(
      {
        ...params,
        baseURL: (params.url && baseURLMap.get(params.url)) || params.baseURL,
      },
      errorCallback,
      disableEmitErrorToast,
    )
  return Object.assign(mapped, {
    client: request.client,
    clearCache: request.clearCache,
  }) as Request
}

const request = initRequest()

export default request
