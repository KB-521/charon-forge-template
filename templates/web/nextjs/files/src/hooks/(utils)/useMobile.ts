'use client'

export function checkIsMobile() {
  if (typeof window === 'undefined')
    return false

  // return true
  const media = window.matchMedia('(pointer: coarse)')
  const uaHit = /Android|iPhone|Mobile|Windows Phone/i.test(navigator.userAgent)
  return media.matches && uaHit && window.outerWidth <= 768
}
