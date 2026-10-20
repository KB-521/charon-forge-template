# API 实现代码示例

## 类型定义

禁止把通用响应结构写进业务类型：

```ts
// 禁止声明 requestid, code, message
```

正确示例：

```ts
export interface QueryOneTaskRes {
  /** 满足当前筛选条件的总记录数，单位：条 */
  total: number
  /** 当前分页任务列表，无额外约束 */
  list: TaskItem[]
}
```

## API 函数结构

```ts
export function requestXxx(data: XxxReq) {
  return request<XxxRes>({
    url: '/<service-prefix>/<resource>/<action>',
    method: 'POST',
    data,
  })
}
```
