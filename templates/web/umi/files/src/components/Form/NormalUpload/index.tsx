import type { UploadFile, UploadProps } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { Button, message, Upload } from 'antd'
import { useEffect, useRef } from 'react'
import { validateFile } from '@/utils/upload'

export interface UploadResult {
  url: string
  key?: string
}
export type UploadTransport = (
  file: File,
  signal: AbortSignal,
) => Promise<UploadResult>
export interface NormalUploadProps {
  value?: UploadFile[]
  onChange?: (files: UploadFile[]) => void
  acceptSuffix?: string[]
  maxFileSize?: number
  maxSize?: number
  upload?: UploadTransport
  listType?: UploadProps['listType']
  label?: string
}
const EMPTY_FILES: UploadFile[] = []
const DEFAULT_SUFFIXES = ['.pdf', '.xlsx', '.xls']

export default function NormalUpload({
  value = EMPTY_FILES,
  onChange,
  acceptSuffix = DEFAULT_SUFFIXES,
  maxFileSize = 4,
  maxSize = 1,
  upload,
  listType = 'text',
  label = '选择文件',
}: NormalUploadProps) {
  const urls = useRef(new Set<string>())
  const controllers = useRef(new Set<AbortController>())
  useEffect(
    () => () => {
      urls.current.forEach(url => URL.revokeObjectURL(url))
      controllers.current.forEach(controller => controller.abort())
    },
    [],
  )
  const props: UploadProps = {
    accept: acceptSuffix.join(','),
    fileList: value,
    maxCount: maxSize,
    listType,
    beforeUpload(file) {
      const error = validateFile(file, acceptSuffix, maxFileSize)
      if (error) {
        message.error(error)
        return Upload.LIST_IGNORE
      }
      return true
    },
    customRequest(options) {
      const controller = new AbortController()
      controllers.current.add(controller)
      const file = options.file as File
      const run = upload
        ? upload(file, controller.signal)
        : Promise.resolve().then(() => {
            const url = URL.createObjectURL(file)
            urls.current.add(url)
            return { url }
          })
      run
        .then((result) => {
          if (!controller.signal.aborted)
            options.onSuccess?.(result)
        })
        .catch((error: Error) => {
          if (!controller.signal.aborted)
            options.onError?.(error)
        })
        .finally(() => controllers.current.delete(controller))
      return { abort: () => controller.abort() }
    },
    onChange({ fileList, file }) {
      if (file.status === 'error')
        message.error('文件提交失败')
      onChange?.(
        fileList.map(item => ({
          ...item,
          url: item.response?.url || item.url,
        })),
      )
    },
    onRemove(file) {
      if (file.url && urls.current.delete(file.url))
        URL.revokeObjectURL(file.url)
    },
  }
  return (
    <Upload {...props}>
      {value.length < maxSize
        ? (
            <Button icon={<UploadOutlined />}>{label}</Button>
          )
        : null}
    </Upload>
  )
}
