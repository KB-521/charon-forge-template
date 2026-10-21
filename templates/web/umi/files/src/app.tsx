import type { RunTimeLayoutConfig } from '@umijs/max'
import type { Profile } from './services/demo'
import { UserOutlined } from '@ant-design/icons'
import { Link } from '@umijs/max'
import { Avatar, Result, Space, Tag } from 'antd'
import settings from '../config/defaultSettings'
import { getRuntimeConfig } from './config/runtime'
import { requestConfig } from './requestErrorConfig'
import { getProfile } from './services'

export interface InitialState {
  userInfo: Profile
  settings: typeof settings
}
export async function getInitialState(): Promise<InitialState> {
  return {
    userInfo: await getProfile(),
    settings: { ...settings, title: getRuntimeConfig().APP_NAME },
  }
}
export const layout: RunTimeLayoutConfig = ({ initialState }) => ({
  ...initialState?.settings,
  rightContentRender: () => (
    <Space size="middle">
      <Tag color="blue">
        {getRuntimeConfig().MODE === 'demo' ? '本地演示' : 'API 模式'}
      </Tag>
      <Link to="/profile">
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {initialState?.userInfo.name}
        </Space>
      </Link>
    </Space>
  ),
  footerRender: () => (
    <div className="app-footer">
      {getRuntimeConfig().APP_NAME}
      {' '}
      · Umi Max
    </div>
  ),
  unAccessible: (
    <Result
      status="403"
      title="403"
      subTitle="当前用户没有访问权限"
      extra={<Link to="/dashboard">返回工作台</Link>}
    />
  ),
})
export const request = requestConfig
