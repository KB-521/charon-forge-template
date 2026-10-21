import type { UploadFile } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { Alert, message, Modal, Upload } from 'antd'
import { useEffect, useState } from 'react'
import { validateFile } from '@/utils/upload'

interface Props {
  visible: boolean
  title?: string
  onCancel: () => void
  onFormSave: (result: unknown) => void
  submit: (file: File) => Promise<unknown>
  maxFileSize?: number
}
export default function ExcelUploadModal({
  visible,
  title = 'Excel 文件提交',
  onCancel,
  onFormSave,
  submit,
  maxFileSize = 10,
}: Props) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!visible)
      setFiles([])
  }, [visible])
  const save = async () => {
    const file = files[0]?.originFileObj
    if (!file || loading)
      return
    setLoading(true)
    try {
      const result = await submit(file)
      message.success('文件提交完成')
      onFormSave(result)
    }
    catch (error) {
      message.error(error instanceof Error ? error.message : '文件提交失败')
    }
    finally {
      setLoading(false)
    }
  }
  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      onOk={save}
      confirmLoading={loading}
      okButtonProps={{ disabled: !files.length }}
      cancelButtonProps={{ disabled: loading }}
      closable={!loading}
      maskClosable={!loading}
      keyboard={!loading}
    >
      <Alert
        type="info"
        showIcon
        message="支持 .xlsx / .xls；解析和数据写入由提交回调实现。"
        style={{ marginBottom: 16 }}
      />
      <Upload.Dragger
        accept=".xlsx,.xls"
        maxCount={1}
        fileList={files}
        disabled={loading}
        onRemove={() => {
          setFiles([])
          return true
        }}
        beforeUpload={(file) => {
          const error = validateFile(file, ['.xlsx', '.xls'], maxFileSize)
          if (error) {
            message.error(error)
            return Upload.LIST_IGNORE
          }
          setFiles([{ uid: file.uid, name: file.name, originFileObj: file }])
          return false
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p>点击或拖入 Excel 文件</p>
      </Upload.Dragger>
    </Modal>
  )
}
