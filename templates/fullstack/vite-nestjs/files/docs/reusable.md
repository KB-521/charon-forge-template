# 通用能力与组件

这些模块从既有工程提炼，去掉气象数据、地图依赖和私有词条；不额外引入 UI、图表、日期或国际化依赖。示例接入见 `web/src/examples/ReusableExamples.tsx`。

## LineChart

```tsx
import { LineChart } from './components/LineChart';

<LineChart
  title="响应时间示例"
  unit="ms"
  emptyText="暂无数据"
  data={[
    { label: '09:00', value: 12 },
    { label: '10:00', value: null },
    { label: '11:00', value: 18 },
  ]}
/>;
```

- `data` 为只读的 `{ label: string; value: number | null }[]`；null 或非有限数值会断开折线，单点仍可见。修改数据时提供新数组。
- `title` 必填；`unit`、`emptyText`、`formatValue(value)` 可选。刻度按数据长度生成，支持空数据、单点和多实例，SVG ID 不共享。
- 指针移入可读取数值；键盘聚焦后使用左右方向键、Home、End、Escape。提示卡在绘图区内选择较少遮挡曲线的位置。
- CSS Module 限定组件样式；可由 CSS 变量 `--accent`、`--ink` 调整主色。该组件适合轻量趋势展示，不提供多系列、缩放或大数据降采样。

## AsyncSearchSelect

```tsx
import { useState } from 'react';
import { AsyncSearchSelect, type SearchOption } from './components/AsyncSearchSelect';
import { request } from './lib/request';

function Search() {
  const [value, setValue] = useState<SearchOption | null>(null);
  return (
    <AsyncSearchSelect
      label="选择项目"
      value={value}
      onChange={setValue}
      loadOptions={(query, signal) =>
        request<SearchOption[]>(`projects?q=${encodeURIComponent(query)}`, { signal })
      }
      messages={{
        loading: '查询中…',
        error: '查询失败，请重试',
        empty: '暂无结果',
        clear: '清空选择',
      }}
    />
  );
}
```

示例接口由业务实现，模板未新增 projects API。选项包含唯一 `id`、`label`，可附 `description`；支持自定义选项字段，泛型会保留到 onChange。

- `value/onChange` 控制已选项；输入查询不会自行修改已选项，选择结果或清空才触发 onChange。外部改变 value 会同步输入内容。
- `loadOptions(query, signal)` 注入数据来源。默认防抖 250ms、至少输入 1 个字符；可设置 `debounceMs`、`minLength`（最小有效值为 1）。
- 输入变化、关闭、选择、清空或卸载会取消当前请求。即使 loader 忽略 signal，旧响应也不会覆盖新结果。
- 支持加载/失败/空结果提示、点击外部关闭，以及方向键、Enter、Escape。焦点保留在 combobox，选项通过 aria-activedescendant 表达。
- `messages`、`placeholder` 可本地化；结果数组应使用唯一 id。示例页用本地技术列表演示，不依赖外部服务。

## 请求取消与超时

`request<T>(path, options)` 继续支持原生 RequestInit，并增加 `timeoutMs`，默认 15000ms，0 关闭超时。非 2xx 抛出含 status/statusText 的 `HttpError`；204 返回 undefined，其余响应按 JSON 解析。外部取消与超时均通过 AbortSignal 传播，响应体读取结束后才释放监听器和计时器。

```ts
const controller = new AbortController();
const health = await request<Health>('health', { signal: controller.signal, timeoutMs: 5000 });
```

`linkAbort(controller, ...signals)` 可组合其它请求拥有者，保留首个取消原因，返回清理函数。单独使用时应在操作的 finally 中调用清理函数。

## 服务端时钟、时区与语言

- 收到服务端当前时间后调用 `setServerClock(timestamp)`；`serverClockMs()` 读取当前估计毫秒时间，`useServerClock()` 每秒更新组件。多个消费者共享同一个计时器，最后一个卸载后停止；未校准时为 NaN。使用 performance.now 计算流逝时间，不受本机系统时间调整影响。
- `formatDateTime(value, options?, locale?)` 基于 Intl，默认 UTC；例如 `formatDateTime(value, { timeZone: 'Asia/Shanghai', timeStyle: 'medium' })`。非法日期返回 `—`；非法时区由 Intl 抛错。此工具只负责显示，不修改请求或存储时间。
- `initLocale()` 在 React 挂载前执行；优先 localStorage，其次浏览器语言，默认 zh-CN。`setLocale('en-US')` 更新文档 lang、持久化并通知 `useLocale()`，不刷新页面；存储不可用时仍可切换。
- `t(key, params?)` 支持 `{name}` 插值，缺词回退中文，仍缺失则返回 key。词条位于 `web/src/lib/i18n/messages/`，延续首个 Next.js 模板的回退和存储容错方式。

服务端时钟是最后一次响应时间加浏览器流逝时间的估计，不做网络往返时延校正；长期打开的页面可定期重新请求校准。

## OSS 增强

保留原 create/get/list/update/remove 与 bucket 白名单，同时增加：

| 方法                                                             | 行为                                                                                     |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `tryGet(key, bucket?)`                                           | 对象不存在返回 null，其它错误继续抛出                                                    |
| `exists(key, bucket?)`                                           | 使用 head；仅不存在返回 false，权限/网络错误继续抛出                                     |
| `tryDownloadToFile(key, path, bucket?, { signal?, timeoutMs? })` | 流式写同目录临时文件，成功后 rename；不存在返回 false，失败/取消清理临时文件，保留原目标 |
| `removeMany(keys, bucket?)`                                      | 请求前验证全部键，每批最多 1000，返回 OSS 确认的删除数量                                 |
| `list(prefix?, marker?, maxKeys?, bucket?, delimiter?)`          | 支持空前缀、目录分隔符，返回 objects/prefixes/nextMarker/isTruncated                     |
| `create(key, content, contentType?, bucket?, cacheControl?)`     | 可设置对象 Cache-Control；update 保留同样参数                                            |

文件下载的目标父目录需存在；timeoutMs 传给 SDK，请使用 signal 取消整次传输。下载不提供本地路径选择策略，调用者应提供自己管理的目标路径。批量删除不是跨批事务，异常前已完成的远程删除不会回滚。OSS 仍默认关闭，模板没有新增公开文件操作接口。

## 日志

`server/src/logging/` 包含文件 writer、Nest LoggerService 适配、访问中间件、错误 cause 描述和事件行格式化；通过 LoggingModule 注入 LogFileWriter，普通 Nest Logger 调用自动进入已配置的输出。

| 参数               | 默认值            | 说明                                      |
| ------------------ | ----------------- | ----------------------------------------- |
| LOG_TO_FILE        | true              | false 时保留控制台输出，不创建日志目录    |
| LOG_DIR            | 服务根目录的 log/ | 相对路径按服务根目录解析，也接受绝对路径  |
| LOG_RETENTION_DAYS | 14                | 保留的日目录数量，必须为正整数            |
| LOG_TIME_ZONE      | UTC               | 日目录的时区；行内时间戳使用 UTC ISO 格式 |

日志分 app/error/access，串行追加到 `log/YYYY-MM-DD/*.log`，跨日时清理过期日期目录；不清理普通目录或符号链接。写入失败会关闭本次进程的文件输出并保留控制台。Nest 关闭钩子等待已排队日志写完。

访问日志记录 API 路径、方法、状态和耗时，不记录 query、headers、body。控制台与文件对常见 password/secret/token/authorization/cookie/access key 字段、同名进程环境值及常见凭证文本脱敏；消息换行转义为单行。业务调用仍应只提供必要的日志字段，额外私有字段应扩充 `redact.ts` 的规则。

Docker 运行镜像准备了非 root 用户可写的 `/app/log`。使用持久化卷时需保证相应目录权限；可设置 LOG_TO_FILE=false，仅由容器平台采集 stdout/stderr。日志目录已从 Git 和源码 Docker context 排除。
