'use client'

import type { ReactNode } from 'react'
import { App, ConfigProvider } from 'antd'
import { useEffect } from 'react'
import { setRequestErrorHandler } from '@/lib/request'
import '@ant-design/v5-patch-for-react-19'

function RequestFeedback() {
  const { message } = App.useApp()
  useEffect(
    () =>
      setRequestErrorHandler((content) => {
        void message.error({ content, key: content })
      }),
    [message],
  )
  return null
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#c34b23',
          colorText: '#25251f',
          borderRadius: 6,
          fontFamily: 'inherit',
        },
      }}
    >
      <App>
        <RequestFeedback />
        {children}
      </App>
    </ConfigProvider>
  )
}
