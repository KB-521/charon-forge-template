'use client'

import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface DisableWrapperProps {
  children: ReactNode
  disabled?: boolean
  clickHandler?: () => void
  /**
   * clickHandler不会生效
   */
  disableLayerRender?: ReactNode
  wrapCls?: string
}

function DisableWrapper(props: DisableWrapperProps) {
  const { children, disabled, clickHandler, disableLayerRender, wrapCls } = props

  const disableRender = useMemo(() => {
    return (
      disableLayerRender || (
        <div
          onClick={() => clickHandler?.()}
          className="absolute inset-0 z-[999] cursor-not-allowed bg-white/50"
        >
        </div>
      )
    )
  }, [clickHandler, disableLayerRender])

  return (
    <div className={cn('relative isolate w-full ', wrapCls)}>
      {children}
      {disabled && disableRender}
    </div>
  )
}

export default DisableWrapper
