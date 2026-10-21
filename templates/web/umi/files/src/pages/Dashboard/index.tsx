import {
  ArrowRightOutlined,
  DatabaseOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { PageContainer } from '@ant-design/pro-components'
import { Link, useModel } from '@umijs/max'
import { Alert, Button, Card, Descriptions, Space, Statistic } from 'antd'
import { getRuntimeConfig } from '@/config/runtime'

export default function Dashboard() {
  const { initialState } = useModel('@@initialState')
  const { compact, setCompact } = useModel('global')
  const config = getRuntimeConfig()
  return (
    <PageContainer
      title="工作台"
      subTitle={`欢迎回来，${initialState?.userInfo.name || '访客'}`}
    >
      <p className="page-intro">
        从列表、文件和权限三个常见场景开始搭建你的后台。
      </p>
      <div className="dashboard-grid">
        <Card>
          <Statistic
            title="演示数据"
            value={48}
            suffix="条"
            prefix={<DatabaseOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="通用上传"
            value={3}
            suffix="种"
            prefix={<InboxOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="默认模式"
            value={config.MODE === 'demo' ? '本地演示' : '真实 API'}
            prefix={<SafetyCertificateOutlined />}
          />
        </Card>
      </div>
      <Card
        title="开始使用"
        className="demo-panel"
        size={compact ? 'small' : 'default'}
        extra={(
          <Button onClick={() => setCompact(!compact)}>
            {compact ? '标准间距' : '紧凑间距'}
          </Button>
        )}
      >
        <Space wrap size="middle">
          <Link to="/examples/table">
            <Button type="primary">
              查看数据列表
              <ArrowRightOutlined />
            </Button>
          </Link>
          <Link to="/examples/uploads">
            <Button>体验文件上传</Button>
          </Link>
          <Link to="/profile">
            <Button>编辑个人资料</Button>
          </Link>
          <Link to="/admin">权限拦截示例</Link>
        </Space>
        <Descriptions
          style={{ marginTop: 24 }}
          column={{ xs: 1, md: 3 }}
          items={[
            { key: 'name', label: '项目', children: config.APP_NAME },
            {
              key: 'stack',
              label: '技术栈',
              children: 'Umi Max / React / Ant Design',
            },
            { key: 'env', label: '接口地址', children: config.API_BASE_URL },
          ]}
        />
      </Card>
      <Alert
        showIcon
        type="info"
        message={
          config.MODE === 'demo'
            ? '当前是浏览器内演示数据，无需后端；修改资料仅在当前页面会话中生效。'
            : 'API 模式：数据来自配置的接口，请在服务器实现认证和授权。'
        }
      />
    </PageContainer>
  )
}
