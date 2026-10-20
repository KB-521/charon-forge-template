'use client'

import type { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react'
import styles from './index.module.css'

interface NoMoreProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  desc?: ReactNode
  centerMargin?: number
  fontSize?: number
  lineThick?: number
}

function NoMore(props: NoMoreProps) {
  const {
    desc = 'END',
    centerMargin = 64,
    fontSize = 16,
    lineThick = 1,
    className,
    ...nativeProps
  } = props
  // ==========func=============

  // ==========effect===========

  // ==========render===========
  return (
    <div className={`${styles.wrap} ${className || ''}`} {...nativeProps}>
      <div className={styles.line} style={{ fontSize: `${lineThick}px` }} />
      <div
        className={styles['desc-wrap']}
        style={{ margin: `0 ${centerMargin}px`, fontSize: `${fontSize}px` }}
      >
        <div className={styles['desc-container']}>{desc}</div>
      </div>
      <div className={styles.line} style={{ fontSize: `${lineThick}px` }} />
    </div>
  )
}

export default NoMore
