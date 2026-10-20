'use client'

import { useCallback, useEffect, useRef } from 'react'

export interface Config {
  delay?: number
  autoStartUp?: boolean
  immediate?: boolean
  callback: () => void
}

/** 保留原定时器的启动、暂停、恢复、关闭接口，并清理自动恢复定时器。 */
export function useInterval({ delay = 1000, autoStartUp, immediate, callback }: Config) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const paused = useRef(false)

  const ready = useCallback(() => {
    if (resumeRef.current !== null)
      clearTimeout(resumeRef.current)
    resumeRef.current = null
    paused.current = false
  }, [])

  const stop = useCallback(
    (timeout?: number) => {
      if (resumeRef.current !== null)
        clearTimeout(resumeRef.current)
      resumeRef.current = null
      paused.current = true
      if (timeout !== undefined)
        resumeRef.current = setTimeout(ready, timeout)
    },
    [ready],
  )

  const shutdown = useCallback(
    (timer?: ReturnType<typeof setInterval>, clearManualLock = true) => {
      if (timer !== undefined)
        clearInterval(timer)
      if (timerRef.current !== null)
        clearInterval(timerRef.current)
      timerRef.current = null
      if (clearManualLock)
        ready()
    },
    [ready],
  )

  const startup = useCallback(() => {
    shutdown()
    if (immediate)
      callback()
    timerRef.current = setInterval(() => {
      if (!paused.current)
        callback()
    }, delay)
    return timerRef.current
  }, [callback, delay, immediate, shutdown])

  useEffect(() => {
    if (autoStartUp)
      startup()
    return () => shutdown()
  }, [autoStartUp, startup, shutdown])

  return { ready, startup, shutdown, stop }
}
