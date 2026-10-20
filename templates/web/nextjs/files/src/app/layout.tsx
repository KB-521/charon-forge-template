import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import Script from 'next/script'
import Providers from './providers'
import 'antd/dist/reset.css'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Next.js Starter',
    template: '%s | Next.js Starter',
  },
  description: 'A starting point built with Next.js, TypeScript, Tailwind CSS and Ant Design.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Script src="/runtime-config.js" strategy="beforeInteractive" />
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  )
}
