'use client'

import type { TooltipProps } from 'antd'
import type { ReactNode } from 'react'
import { Tooltip } from 'antd'

interface TooltipTitleProps {
  title?: ReactNode
  children?: ReactNode
  tooltipProps?: Partial<TooltipProps>
  disableExtraElmWrapper?: boolean
}

function TooltipTitle(props: TooltipTitleProps) {
  const { title, children, tooltipProps, disableExtraElmWrapper } = props

  return (
    <Tooltip
      color="black"
      styles={{ body: { width: 'fit-content', fontSize: '12px', color: 'white' } }}
      title={title}
      {...tooltipProps}
    >
      {disableExtraElmWrapper ? children : <div className="">{children}</div>}
    </Tooltip>
  )
}

export default TooltipTitle
