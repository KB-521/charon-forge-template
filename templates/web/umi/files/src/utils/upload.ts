export function validateFile(
  file: Pick<File, 'name' | 'size' | 'type'>,
  suffixes: string[],
  maxMB: number,
): string | undefined {
  if (file.size > maxMB * 1024 * 1024)
    return `文件不能超过 ${maxMB}MB`
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!suffixes.map(x => x.toLowerCase()).includes(extension))
    return `支持格式：${suffixes.join(', ')}`
  return undefined
}
