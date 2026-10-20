'use client'

import { useCallback, useRef } from 'react'

export type EventListener<T> = (event: T) => void

export function useEvent<T>() {
  const listeners = useRef<EventListener<T>[]>([])

  const emit = useCallback((event: T) => {
    listeners.current.forEach(lsn => lsn(event))
  }, [])

  const addListener = useCallback((lsn: EventListener<T>) => {
    listeners.current.push(lsn)
    return () => {
      listeners.current = listeners.current.filter(_lsn => lsn !== _lsn)
    }
  }, [])

  return { emit, addListener }
}
