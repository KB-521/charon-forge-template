# Entry Checklist

- [ ] API path、method、title、用途已确认。
- [ ] request 字段已展开到名称、类型、必填、默认值、校验、说明。
- [ ] response 字段已展开到名称、类型、默认值、说明。
- [ ] Endpoint/Controller 只调用 service，不直接访问 DAO/Mapper。
- [ ] 鉴权、权限、审计和上下文提取符合项目样板。
- [ ] 错误码、异常映射和响应封装符合项目样板。
- [ ] 不暴露敏感字段、内部异常栈、内部配置或 token。
- [ ] 已输出 Entry API Contract，覆盖 API、Method、Request、Response、鉴权、校验、错误映射和调用 service。
- [ ] 已说明是否需要 YApi 同步。
- [ ] 若使用 `**Controller` 而非 `**Endpoint`，已说明当前 YApi 自动同步缺口或替代方案。
