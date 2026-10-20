# 6. 设计 measure 运行模块接入

## 何时读取

需要决定 `measure-web`、`measure-server` 或其他运行模块如何依赖 starter 时读取本文件。

## 执行动作

- 需要模块职责和依赖样例时读 [rules/INDEX.md](./rules/INDEX.md)，再读取 measure 规则切片。
- 判断依赖加在 `measure-web`、`measure-server` 还是两者；不要默认全模块接入。
- 如果 starter 暴露 endpoint，确认该运行模块是否真实承接渠道流量。
- 如果 starter 需要业务接口，在同一运行模块实现配置查询、订单查询、客户持久化或提现结果更新接口。

## 产出

- POM 依赖位置。
- 业务接口实现类。
- 配置入口。
- 流量入口说明。

## 门禁

handler 依赖 starter 事件类时放运行模块，不放 `measure-biz`；公共服务改动必须保持旧业务兼容。
