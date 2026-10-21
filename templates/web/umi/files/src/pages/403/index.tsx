import { Link } from '@umijs/max'
import { Button, Result } from 'antd'

export default function Page() {
  return (
    <Result
      status="403"
      title="403"
      subTitle="当前用户没有访问权限"
      extra={(
        <Link to="/dashboard">
          <Button type="primary">返回工作台</Button>
        </Link>
      )}
    />
  )
}
