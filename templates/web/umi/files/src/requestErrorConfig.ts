import type { RequestConfig, RequestOptions } from '@umijs/max'
import { message } from 'antd'
import { getRuntimeConfig } from './config/runtime'

export const requestConfig: RequestConfig = {
  timeout: 15000,
  requestInterceptors: [
    (config: RequestOptions) => ({
      ...config,
      baseURL: getRuntimeConfig().API_BASE_URL,
    }),
  ],
  errorConfig: {
    errorThrower: (data) => {
      if (data?.success === false)
        throw new Error(data.message || '请求未成功')
    },
    errorHandler: (error, options) => {
      if (options?.skipErrorHandler)
        throw error
      message.error(error.message || '网络请求失败')
    },
  },
}
