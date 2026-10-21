export function downloadFile(
  data: Blob | string,
  filename = 'export.csv',
  mime = 'text/csv;charset=utf-8',
) {
  const url = URL.createObjectURL(
    data instanceof Blob ? data : new Blob([data], { type: mime }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = filename.replace(/[\\/:*?"<>|]/g, '_')
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function downloadTxt(text: string, filename = 'download.txt') {
  downloadFile(text, filename, 'text/plain;charset=utf-8')
}
