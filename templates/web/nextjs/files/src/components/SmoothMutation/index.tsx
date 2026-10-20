'use client'

import type { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react'
import classNames from 'clsx'
import { useMemo } from 'react'

interface SmoothMutationProps extends DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> {
  children?: ReactNode
  height: number
  className?: string
  /**
   * @default false 不传的话使用children判断
   */
  show?: boolean
}

/**
 * 通过max-h 和overflow实现平滑appear
 * @param props
 * @returns 包含平滑展开内容的容器。
 */
function SmoothMutation(props: SmoothMutationProps) {
  const { style, children, height, className, show, ...nativeProps } = props

  const finalShow = useMemo(() => {
    return show === undefined ? !!children : show
  }, [children, show])

  // ==========func=============

  // ==========effect===========

  // ==========render===========
  return (
    <div
      style={{ height, ...style }}
      className={classNames(
        'w-full overflow-hidden transition-all',
        {
          'max-h-screen ': finalShow,
          'max-h-0 ': !finalShow,
        },
        className,
      )}
      {...nativeProps}
    >
      {children}
    </div>
  )
}

export default SmoothMutation
