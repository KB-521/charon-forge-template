import type { UploadFile } from 'antd'
import { PageContainer } from '@ant-design/pro-components'
import { Alert, Button, Card, Space, Typography } from 'antd'
import { useState } from 'react'
import ExcelUploadModal from '@/components/ExcelUploadModal'
import useExcelModal from '@/components/ExcelUploadModal/add-hooks'
import ImageUpload from '@/components/Form/ImageUpload'
import NormalUpload from '@/components/Form/NormalUpload'

export default function Uploads() {
  const [images, setImages] = useState<UploadFile[]>([])
  const [files, setFiles] = useState<UploadFile[]>([])
  const [accepted, setAccepted] = useState('')
  const modal = useExcelModal(() => {})
  return (
    <PageContainer title="文件上传" subTitle="校验和交互与服务端传输分离">
      <Alert
        className="demo-panel"
        type="info"
        showIcon
        message="本页仅本地预览/接收文件，不会上传云端或解析导入数据。生产接入时注入 upload / submit 回调。"
      />
      <Card className="demo-panel" title="图片预览">
        <ImageUpload value={images} onChange={setImages} maxSize={3} />
        <Typography.Text type="secondary">
          PNG / JPG / JPEG / WEBP / GIF，每个不超过 4MB。
        </Typography.Text>
      </Card>
      <Card className="demo-panel" title="普通文件">
        <NormalUpload value={files} onChange={setFiles} maxSize={2} />
        <Typography.Text type="secondary">
          PDF / XLSX / XLS，每个不超过 4MB。
        </Typography.Text>
      </Card>
      <Card title="Excel 提交弹窗">
        <Space direction="vertical">
          <Button type="primary" onClick={modal.handleExcelAdd}>
            打开 Excel 提交
          </Button>
          {accepted && (
            <Typography.Text>
              已接收：
              {accepted}
            </Typography.Text>
          )}
        </Space>
      </Card>
      <ExcelUploadModal
        visible={modal.excelVisible}
        onCancel={modal.handleExcelCancel}
        title="Excel 文件提交"
        submit={async file => ({ fileName: file.name })}
        onFormSave={(result) => {
          setAccepted((result as { fileName: string }).fileName)
          modal.handleExcelSave()
        }}
      />
    </PageContainer>
  )
}
