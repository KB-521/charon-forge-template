'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * 仅当onlyIn为真时执行
 * @param callback
 * @param onlyIn
 * @param maxTimes 最大执行次数，默认为1
 * @returns 可重置执行次数的控制器。
 */
export function useOnly(
  callback: () => void,
  onlyIn: () => boolean = () => true,
  maxTimes: number = 1,
) {
  const doneTime = useRef<number>(0)

  useEffect(() => {
    if (onlyIn() && doneTime.current < maxTimes) {
      callback()
      doneTime.current += 1
    }
  }, [callback, maxTimes, onlyIn])

  /**
   * @param doImmediately 立刻执行一次
   */
  const reset = useCallback(
    (doImmediately: boolean = false) => {
      doneTime.current = 0
      // 无视onlyIn
      if (doImmediately) {
        callback()
        doneTime.current += 1
      }
    },
    [callback],
  )

  return {
    reset,
  }
}
