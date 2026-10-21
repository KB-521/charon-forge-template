import { PageContainer } from '@ant-design/pro-components'
import { useModel } from '@umijs/max'
import { Alert, Button, Card, Form, Input, message } from 'antd'
import { useEffect, useState } from 'react'
import { saveProfile } from '@/services'

export default function Profile() {
  const { initialState, setInitialState } = useModel('@@initialState')
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    form.setFieldsValue(initialState?.userInfo)
  }, [initialState?.userInfo, form])
  return (
    <PageContainer title="个人资料" subTitle="用统一服务适配本地数据与真实接口">
      <Card style={{ maxWidth: 700 }}>
        <Alert
          type="info"
          showIcon
          message="这里演示资料编辑；登录与服务器授权由使用项目接入。"
          style={{ marginBottom: 24 }}
        />
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            setLoading(true)
            try {
              const userInfo = await saveProfile(values)
              await setInitialState(state =>
                state ? { ...state, userInfo } : state,
              )
              message.success('资料已更新')
            }
            catch (error) {
              message.error(
                error instanceof Error ? error.message : '保存失败',
              )
            }
            finally {
              setLoading(false)
            }
          }}
        >
          <Form.Item
            name="name"
            label="显示名称"
            rules={[
              { required: true, whitespace: true, message: '请输入显示名称' },
              { max: 50 },
            ]}
          >
            <Input maxLength={50} placeholder="显示名称" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, type: 'email', message: '请输入有效邮箱' },
            ]}
          >
            <Input placeholder="邮箱" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            保存资料
          </Button>
        </Form>
      </Card>
    </PageContainer>
  )
}
