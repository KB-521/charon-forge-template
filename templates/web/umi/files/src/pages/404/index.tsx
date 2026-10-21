import { Link } from '@umijs/max'
import { Button, Result } from 'antd'

export default function Page() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="没有找到这个页面"
      extra={(
        <Link to="/dashboard">
          <Button type="primary">返回工作台</Button>
        </Link>
      )}
    />
  )
}
