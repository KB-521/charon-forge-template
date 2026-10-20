'use client'

import type { Dispatch, SetStateAction } from 'react'
import { useMemo, useState } from 'react'

export interface StateOutController<T> {
  setStateOut?: Dispatch<SetStateAction<T>>
  stateOut?: T
}

export function useStateMayOutControl<T>(
  init: T,
  soc: StateOutController<T>,
): [T, Dispatch<SetStateAction<T>>] {
  const [_state, _setState] = useState<T>(init)

  const state = useMemo((): T => {
    return soc?.stateOut ?? _state
  }, [soc?.stateOut, _state])

  const setState = useMemo((): Dispatch<SetStateAction<T>> => {
    return soc?.setStateOut ?? _setState
  }, [soc?.setStateOut])

  return [state, setState]
}
