/**
 * 复制clipboard
 * @param {string} data
 * @return {Promise<void>}
 */
export async function setClipboardData(data: string | number) {
  const _data: string = String(data)
  return new Promise<void>((resolve, reject) => {
    const input = document.createElement('textarea')

    try {
      input.value = _data

      // 关键兼容设置
      input.setAttribute('readonly', '')
      input.style.position = 'absolute'
      input.style.left = '-9999px'
      input.style.top = '0'

      document.body.appendChild(input)
      input.select()
      input.setSelectionRange(0, _data.length)

      if (!document.queryCommandSupported('Copy')) {
        throw new Error('can\'t execCommand of copy.')
      }

      if (!document.execCommand('Copy')) {
        throw new Error('copy 事件调用失败，请检查是否存在异步事件流或非主动触发行为')
      }

      resolve()
    }
    catch (error) {
      reject(error)
    }
    finally {
      document.body.removeChild(input)
    }
  })
}
