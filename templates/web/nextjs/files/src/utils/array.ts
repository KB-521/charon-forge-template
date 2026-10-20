/**
 * 数组相等
 * @param arrA
 * @param arrB
 * @param compare
 */
export function arrayEqual<T>(arrA: T[], arrB: T[], compare: (itemA: T, itemB: T) => boolean) {
  let ALL_CLEAR = true
  for (const item of arrA) {
    if (arrB.findIndex(value => compare(value, item)) === -1) {
      ALL_CLEAR = false
      break
    }
  }
  if (!ALL_CLEAR)
    return ALL_CLEAR
  for (const item of arrB) {
    if (arrA.findIndex(value => compare(value, item)) === -1) {
      ALL_CLEAR = false
      break
    }
  }
  return ALL_CLEAR
}

/**
 * 数组相等,且顺序一致
 * @param arrA
 * @param arrB
 * @param compare
 */
export function arrayEqualInQueue<T>(
  arrA: T[],
  arrB: T[],
  compare: (itemA: T, itemB: T) => boolean,
) {
  if (arrA.length !== arrB.length)
    return false
  let ALL_CLEAR = true
  arrA.forEach((item, index) => {
    if (!compare(item, arrB[index])) {
      ALL_CLEAR = false
    }
  })
  return ALL_CLEAR
}

/**
 * 数组分割，根据子数组长度分段
 * @param arr
 * @param subLength
 */
export function arraySplit<T>(arr: T[], subLength: number): T[][] {
  if (arr.length <= subLength || subLength <= 0)
    return [arr]
  const total: T[][] = []
  for (let i = 0; i < arr.length; i += subLength) {
    total.push(arr.slice(i, i + subLength))
  }
  return total
}

/**
 * 数组分割，根据子数组个数分段
 * @param arr
 * @param subNum
 * @param average 是否尽量平均
 */
export function arraySplitTo<T>(arr: T[], subNum: number, average?: boolean): T[][] {
  if (arr.length <= subNum)
    return arr.map(i => [i])
  if (subNum <= 1)
    return [arr]
  const subLength = Math.ceil(arr.length / Math.floor(subNum))
  let total: T[][] = []
  if (average) {
    total = Array.from(Array.from({ length: Math.floor(subNum) })).map(() => [])
    let index = 0
    while (index < arr.length) {
      total.forEach((item) => {
        if (index < arr.length) {
          item.push(arr[index])
          index++
        }
      })
    }
  }
  else {
    for (let i = 0; i < arr.length; i += subLength) {
      total.push(arr.slice(i, i + subLength))
    }
  }
  return total
}

/**
 * 数组去重，不覆盖
 * @param array
 * @param getKey
 */
export function arrayDistinct<T, K>(array: T[], getKey: (el: T) => K): T[] {
  const keyMap = new Map<K, T>()
  array.forEach((item) => {
    const key = getKey(item)
    // if (keyMap.has(key))
    //   console.warn('key ', key, ' conflict')
    keyMap.set(key, item)
  })
  return Array.from(keyMap.values())
}

/**
 * 将指定元素为index=0，前面的元素拼接在数组末尾
 * @param arr
 * @param hitFn
 */
export function getResortFromItem<T>(arr: T[], hitFn: (item: T) => boolean) {
  const headIndex = arr.findIndex(hitFn)
  if (headIndex === -1)
    return arr
  return [...arr.slice(headIndex), ...arr.slice(0, headIndex)]
}

/**
 * polyfill
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/toReversed
 * @param array
 */
export function toReversed<T>(array: T[]): T[] {
  if (array.length < 2)
    return array
  const reverse = Array.from({ length: array.length }) as T[]
  array.forEach((elm, index) => {
    reverse[array?.length - 1 - index] = elm
  })
  return reverse
}

type NotFunction<T> = T extends (...args: never[]) => unknown ? never : T

export function intersperse<T>(
  array: T[],
  separator: NotFunction<T> | ((index: number, itemInsertedPre: T) => T),
) {
  if (array.length < 2)
    return array?.[0]
  return array.flatMap((item, index) =>
    index < array.length - 1
      ? [
          item,
          typeof separator === 'function'
            ? (separator as (index: number, item: T) => T)(index, item)
            : separator,
        ]
      : [item],
  )
}
