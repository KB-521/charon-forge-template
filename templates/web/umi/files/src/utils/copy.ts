export async function setClipboardData(value: string | number): Promise<void> {
  const text = String(value)
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const input = document.createElement('textarea')
  input.value = text
  document.body.appendChild(input)
  try {
    input.select()
    if (!document.execCommand('copy'))
      throw new Error('复制失败')
  }
  finally {
    input.remove()
  }
}
