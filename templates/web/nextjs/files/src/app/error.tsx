'use client'

import { Button } from 'antd'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <p className="font-mono text-sm text-accent">Something went wrong</p>
      <h1 className="mb-4 mt-2 font-serif text-5xl font-normal">Let&apos;s try again.</h1>
      <p className="mb-8 leading-7 text-ink/65">
        This page could not be displayed. Please try again.
      </p>
      <div>
        <Button type="primary" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  )
}
