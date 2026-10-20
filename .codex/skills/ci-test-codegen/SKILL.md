---
name: ci-test-codegen
description: 在 GitLab MR / Jenkins / CI 容器中运行 Codex 时使用；读取 GitLab MR webhook payload 或 CI 环境变量，识别 MR diff 中的后端 Java 增量，调用 server/test-codegen 生成 unit/api-mock Java 测试代码，执行全部相关测试，把执行结果发布到 GitLab MR 评论区，并将生成的测试代码提交回 MR 源分支。
version: 1.0.0
owners:
  - sunwencong
---

# CI 测试代码生成编排

用于 MR CI 中调起 Codex 自动补后端 Java 测试代码并执行测试。

本 skill 负责 Codex 在 CI 容器内的行为编排：读取 GitLab MR webhook payload 或 CI 环境变量，识别 diff、生成测试代码、执行全部相关测试、汇总结果并准备 MR 评论内容，同时声明生成测试代码的 bot commit/push 规则。Webhook 接收、checkout、状态回写和实际 push 凭证仍由 CI 脚本负责兜底。

## 适用场景

- GitLab MR 创建或更新后，CI 调起 Codex 自动补测试代码。
- 用户或 CI 直接把 GitLab MR webhook payload 提供给 Codex。
- CI 已提供 MR diff、变更文件清单、源分支和目标分支信息。
- 只想为后端增量业务代码补 `unit` / `api-mock` Java 测试。
- 只允许生成或更新 `server/**/src/test/java/**/*.java`。
- 需要在同一轮 CI 中执行全部相关测试，并把结果写入 GitLab MR 评论区。
- 需要把生成的测试代码提交到 GitLab MR 源分支。

以下场景不要用本 skill：

- 需要完整 `spec -> JSON suite -> Java test` 测试资产链路或资产完整性门禁：本 CI 流程不承接。
- 需要修改业务代码来修复失败测试：本 CI 流程应标记失败并写入 MR 评论，不自动修业务代码，也不因测试失败阻塞后续 CI 阶段。
- 不是 MR/CI 自动补测场景，只是人工要求补测试：直接使用 `ai-workflow/skills/server/test-codegen/SKILL.md`。

## 输入约定

优先读取 GitLab MR webhook payload。payload 可以由用户直接粘贴给 Codex，也可以保存到 `GITLAB_MR_PAYLOAD` 指向的文件，或默认保存到 `/tmp/gitlab-mr-payload.json`。

从 payload 中提取：

- 事件类型：`object_kind` / `event_type`，必须是 `merge_request`
- 动作：`object_attributes.action`
- 源分支：`object_attributes.source_branch`
- 目标分支：`object_attributes.target_branch`
- MR iid：`object_attributes.iid`
- 项目 ID：优先 `object_attributes.target_project_id`，其次 `project.id`
- 源项目 ID：`object_attributes.source_project_id`
- 最新提交：`object_attributes.last_commit.id`
- MR URL：`object_attributes.url`

若没有 payload，再读取 CI 生成的确定性输入：

- 变更文件清单：`CI_CHANGED_FILES` 指向的文件，或 `/tmp/changed-files.txt`；CI 中该文件应预过滤为 `server/**/src/main/java/**/*.java`，避免把全量 MR 文档 diff 交给 Codex。
- MR diff：`CI_MR_DIFF` 指向的文件，或 `/tmp/mr.diff`；CI 中该文件应只包含上述后端 Java 源码增量。
- 目标分支：`CI_MERGE_REQUEST_TARGET_BRANCH_NAME` / `gitlabTargetBranch`
- 源分支：`CI_MERGE_REQUEST_SOURCE_BRANCH_NAME` / `gitlabSourceBranch`
- 可选覆盖档位：`CI_TEST_CODEGEN_PROFILE=full|minimal`，默认 `full`
- MR 评论输出文件：`CI_MR_COMMENT_FILE` 指向的文件，或 `/tmp/ci-test-codegen-comment.md`
- GitLab 评论发布所需信息优先从 payload 解析；payload 解析不到时再读取环境变量或 `agent.config`：
  - 可从 payload 解析：`CI_PROJECT_ID` / `GITLAB_PROJECT_ID`、`CI_MERGE_REQUEST_IID` / `GITLAB_MERGE_REQUEST_IID`、`GITLAB_API_URL`（由 `project.web_url`、MR URL 或 `git_http_url` 推导为 `<gitlab-host>/api/v4`）。
  - 不应出现在 payload：`GITLAB_TOKEN`，由环境变量或 `agent.config` 提供。
- Git 提交所需变量：bot 用户名、邮箱、可 push 的远端地址或 token 由 CI 脚本提供，skill 不记录敏感值

配置读取优先级：

```text
命令行显式参数 -> GitLab MR payload -> 环境变量 -> agent.config
```

`agent.config` 使用 `KEY=VALUE` 形式，建议至少提供 payload 无法携带的敏感项：

```text
GITLAB_TOKEN=<masked>
```

如 payload 中缺少字段，也可补充对应 fallback：

```text
GITLAB_API_URL=https://gitlab.example.com/api/v4
CI_PROJECT_ID=12345
CI_MERGE_REQUEST_IID=123
SOURCE_BRANCH=feat/example
TARGET_BRANCH=main
```

拿到源分支和目标分支后，Codex 应准备“完整文件清单 + 预过滤后端 Java diff”输入，不要把全量 MR diff 写入 `/tmp/mr.diff`：

```bash
git fetch origin "<target-branch>"
git fetch origin "<source-branch>"
git diff --name-only --diff-filter=ACMR "origin/<target-branch>...origin/<source-branch>" > /tmp/all-changed-files.txt
grep -E '^server/.*/src/main/java/.*\.java$' /tmp/all-changed-files.txt > /tmp/changed-files.txt || true
if [ -s /tmp/changed-files.txt ]; then
  xargs -a /tmp/changed-files.txt git diff --binary "origin/<target-branch>...origin/<source-branch>" -- > /tmp/mr.diff
else
  : > /tmp/mr.diff
fi
```

若当前工作区已经 checkout 到 MR 源分支，也可以使用 `origin/<target-branch>...HEAD`。不要在缺少目标分支、源分支和 diff 的情况下猜测范围。

## 服务器手动执行方式

手动验证时，用户只需把 GitLab MR webhook payload 交给 Codex，并说明是否允许发布 MR 评论和 push 测试代码。Codex 必须先按「输入约定」解析 payload；能从 payload、当前 git 仓库或 CI 环境变量推导出的信息，不再向用户追问。

推荐输入：

```text
请使用 .codex/skills/ci-test-codegen/SKILL.md 执行 MR 测试生成流程。
下面是 GitLab MR webhook payload:
<payload-json>
执行策略：仅本地演练 / 允许发布 MR 评论 / 允许 push 测试代码
```

若 payload 缺少关键字段，先尝试从当前分支、`git remote -v`、CI 环境变量或 `agent.config` 补齐；仍无法补齐时，只追问缺失的最小字段。若缺少 GitLab API token 或 push 凭证，只生成评论文件并标记发布或提交被跳过，不要求用户在对话里粘贴敏感值。

## 配套脚本

本 skill 提供可在 CI 中组合使用的脚本：

- `scripts/prepare_mr_context.sh`：生成完整变更清单 `/tmp/all-changed-files.txt`，并把 `/tmp/changed-files.txt` 与 `/tmp/mr.diff` 预过滤为后端 Java 源码增量。
- `scripts/ci_context.py`：按“命令行显式参数 -> payload -> 环境变量 -> agent.config”解析 MR 上下文与 GitLab 发布配置。
- `scripts/build_test_commands.py`：根据本轮生成/更新的 Java 测试文件，以及变更源码对应的已有测试文件，生成最小 Maven 测试命令。
- `scripts/run_test_commands.py`：顺序执行全部测试命令，失败不提前终止，并生成 Markdown 摘要。
- `scripts/build_mr_comment.py`：在 Codex agent 评论生成失败时，把 diff、测试结果和安全校验报告组装成兜底 MR 评论 Markdown。
- `scripts/post_gitlab_mr_comment.py`：把 Markdown 摘要发布到 GitLab MR 评论区。
- `scripts/validate_codegen_diff.py`：校验本轮 diff 只包含允许提交的测试代码。
- `scripts/commit_generated_tests.py`：提交并 push 生成的测试代码到 MR 源分支。

## 防循环门禁

开始前检查最近一次提交信息或 CI 传入标记。

命中以下任一情况时，直接跳过并输出 `SKIPPED`：

- 提交信息包含 `[ci-generated-tests]`
- CI 环境变量表明当前构建由测试生成 bot commit 触发

## 增量识别

只处理变更文件中满足以下条件的文件：

- 路径匹配 `server/**/src/main/java/**/*.java`
- 属于可测试业务或接口代码
- 文件仍存在，且不是纯删除

模式判定：

- `Endpoint` / `Controller` / 路由 / HTTP API：`api-mock`
- `Service` / `ServiceImpl` / `Domain` / `Manager` / `DAO` / `DAOPlus` / `Util` / 纯逻辑：`unit`

默认跳过：

- DTO / VO / PO / BO / Query / Request / Response 等纯模型
- enum / constant / config / properties / application 启动类
- interface 且无默认实现逻辑
- generator 产物、测试代码、资源文件
- 无法定位被测方法或接口动作的文件

跳过时要在结果中列出原因。

## 执行流程

1. 若输入是 webhook payload，先提取源分支、目标分支、MR iid、项目 ID 和 MR URL。
2. 过滤非 MR 事件、非 `open/update/reopen` 动作、Draft MR 或已关闭 MR；不符合时输出 `SKIPPED`。
3. fetch 源分支和目标分支，生成完整变更清单，并把 `/tmp/changed-files.txt` 与 `/tmp/mr.diff` 预过滤为后端 Java 源码增量。
4. 读取预过滤后的变更文件清单和 MR diff，不读取全量 MR diff。
5. 过滤出后端增量 Java 目标，并按模块分组。
6. 对每个目标读取源代码，识别被测类、方法或接口动作。
7. 读取并遵循 `ai-workflow/skills/server/test-codegen/SKILL.md`。
8. 根据模式按需读取 `test-codegen/references/` 中的场景矩阵和测试风格。
9. 只生成或更新 Java 测试代码；本 skill 中“测试用例”指 Java 测试类和测试方法，不生成 spec 或 JSON suite。
10. CI 脚本根据本轮生成/更新的测试文件和变更源码对应的已有测试文件，生成每个模块的最小相关 Maven 测试命令；所有 Maven 命令必须使用仓库自带 `server/tools/maven/settings.xml`，并显式关闭测试跳过开关。
11. CI 脚本执行全部测试命令；单条命令失败不能提前终止，必须继续执行剩余测试。
12. CI 脚本汇总每条测试命令的退出码、通过/失败状态和关键失败摘要，并写出测试结果与最终状态文件。
13. 自检本轮 diff，发现越界改动时标记失败。
14. 调用 Codex agent 读取测试结果摘要、失败输出、生成文件清单、测试命令和安全校验报告，生成 MR 评论内容文件；Codex 评论生成失败时再使用脚本兜底。
15. 若存在生成或更新的测试代码且 diff 未越界，要求 CI bot commit + push 到 MR 源分支。

可选脚本串联：

```bash
.codex/skills/ci-test-codegen/scripts/prepare_mr_context.sh
python3 .codex/skills/ci-test-codegen/scripts/build_test_commands.py --commands-file /tmp/ci-test-codegen-commands.txt --changed-tests-file /tmp/ci-test-codegen-generated-tests.txt --selected-tests-file /tmp/ci-test-codegen-selected-tests.txt --source-files /tmp/changed-files.txt
python3 .codex/skills/ci-test-codegen/scripts/run_test_commands.py --commands-file /tmp/ci-test-codegen-commands.txt --summary-file /tmp/ci-test-codegen-test-results.md --status-file /tmp/ci-test-codegen-test-status.txt --exit-zero
python3 .codex/skills/ci-test-codegen/scripts/validate_codegen_diff.py --json-output /tmp/ci-test-codegen-diff-report.json --exit-zero
python3 .codex/skills/ci-test-codegen/scripts/build_mr_comment.py --test-results-file /tmp/ci-test-codegen-test-results.md --diff-report-file /tmp/ci-test-codegen-diff-report.json --output-file /tmp/ci-test-codegen-comment.md
python3 .codex/skills/ci-test-codegen/scripts/post_gitlab_mr_comment.py --comment-file /tmp/ci-test-codegen-comment.md
python3 .codex/skills/ci-test-codegen/scripts/commit_generated_tests.py
```

## 写入范围

允许写入：

- `server/**/src/test/java/**/*Test.java`
- `server/**/src/test/java/**/*IT.java`

禁止写入：

- `server/**/src/main/java/**`
- `server/**/src/test/resources/testcases/**`
- `ai-workflow/**`
- `.codex/**`
- CI 配置文件
- 任何密钥、配置、环境文件

若生成测试时发现必须修改业务代码才能通过，停止并输出失败原因，不修改业务代码。

## 测试执行

CI 脚本必须生成并执行可执行命令；Codex agent 在 CI 中只负责生成或更新测试代码，不直接执行 Maven。优先使用最小相关测试命令：

```bash
mvn -s server/tools/maven/settings.xml -f server/pom.xml -pl <module> -am -Dmaven.test.skip=false -DskipTests=false -Dtest=<TestClass>[,<TestClass>] -DfailIfNoTests=false test
```

如果脚本无法稳定定位测试类，降级为模块级命令：

```bash
mvn -s server/tools/maven/settings.xml -f server/pom.xml -pl <module> -am -Dmaven.test.skip=false -DskipTests=false test
```

执行要求：

- 不使用会导致 fail fast 的命令串；禁止用第一条失败阻断后续测试。
- 每条命令独立执行并记录退出码。
- 所有命令执行完后再计算整体状态：任一命令失败则整体 `FAIL`，全部成功才是 `PASS`。
- CI 使用 `run_test_commands.py --exit-zero`，并从 `--status-file` 读取最终测试状态，以便后续继续发布评论和提交测试代码。
- CI job 不应仅因为测试状态为 `FAIL` 或 `NOT_RUN` 退出非零；失败原因写入 MR 评论和 artifacts，后续阶段继续执行。
- 若没有可执行测试命令，状态为 `FAIL` 或 `NOT_RUN`：无后端 Java 增量时为 `NOT_RUN`，存在后端 Java 增量但未找到生成/相关测试时为 `FAIL`。
- 若测试执行失败，不修改业务代码，不隐藏失败；只汇总失败并继续进入 MR 评论和后续 CI 阶段。

## MR 评论

测试执行结束后，必须生成 Markdown 评论内容，优先由 Codex agent 生成并写入：

```text
${CI_MR_COMMENT_FILE:-/tmp/ci-test-codegen-comment.md}
```

评论内容至少包含：

- 处理的源分支和目标分支
- 识别到的增量目标
- 生成或更新的测试文件
- 每条测试命令与结果
- 失败摘要和下一步建议
- 是否存在越界改动
- 最终状态：`PASS / FAIL / NOT_RUN / SKIPPED`

当最终状态为 `FAIL` 时，评论必须包含 `Failure Analysis` 表格，至少包含以下列：

```text
失败项 | 可能原因 | 修复建议 | 相关位置/命令
```

Codex agent 应把 Maven / Surefire 原始日志归纳为可读结论，只保留关键异常、断言、类名、方法名或命令，不粘贴大段原始日志。修复建议应具体到测试初始化、mock、断言期望、依赖注入、测试数据或业务前置条件等可执行方向。

若 Codex agent 评论生成失败，CI 使用 `scripts/build_mr_comment.py` 生成兜底评论，仍继续发布 MR 评论和后续阶段。

若 CI 提供 payload，发布脚本优先从 payload 解析项目 ID、MR iid 和 GitLab API 地址；解析不到时再从环境变量或 `agent.config` 读取 `CI_PROJECT_ID`、`CI_MERGE_REQUEST_IID`、`GITLAB_API_URL`。`GITLAB_TOKEN` 只能来自环境变量或 `agent.config`。信息齐全后，可以把该 Markdown 作为 GitLab MR note/comment 发布到评论区。这里的“提交到评论区”指发布 MR comment/note，不是 git commit。禁止在日志或评论中输出 token。

如果 GitLab 评论发布失败，仍保留评论文件并在最终输出中标记 `MR_COMMENT_FAILED`。

## 生成测试代码提交

测试执行结束后，只要存在生成或更新的测试代码，就要求 CI 将这些测试代码提交到 GitLab MR 源分支。

提交前必须满足：

- `git diff --name-only` 只包含允许写入路径。
- 不包含 `server/**/src/main/java/**`、`ai-workflow/**`、`.codex/**`、配置或密钥文件变更。
- MR 评论内容已生成；若 CI 配置要求直接发评论，则已发布或记录发布失败原因。

提交规则：

- 测试执行 `PASS` 时提交生成的测试代码。
- 测试执行 `FAIL` 时也提交生成的测试代码，失败原因通过 MR 评论和 CI 状态体现。
- diff 越界、没有生成测试代码、或 bot push 凭证缺失时不提交，并在结果中说明原因。
- commit message 使用防循环标记：

```text
test: generate CI tests [ci-generated-tests] [skip ci]
```

CI 生成测试代码的 bot commit 必须包含 `[skip ci]`，避免 push 回 MR 源分支后再次触发同一套流水线。

## CI 后置安全校验

本 skill 的输出仍必须由 CI 脚本兜底校验：

1. `git diff --name-only` 只包含允许写入路径。
2. 所有测试命令都已执行完毕；失败不能提前终止流程。
3. 没有 `src/main/java`、`ai-workflow`、`.codex`、配置或密钥文件变更。
4. MR 评论内容已生成；若要求直接发布评论，则发布动作已成功或失败原因已记录。
5. 只有 diff 未越界时才允许 bot commit + push 生成的测试代码。

## 输出模板

```md
## CI 测试生成结果
- 触发来源：MR CI
- 源分支：
- 目标分支：
- 覆盖档位：full / minimal
- 处理目标：
- 跳过目标与原因：
- 生成/更新测试文件：
- 执行测试命令：
- 测试结果明细：
- MR 评论文件：
- MR 评论发布状态：POSTED / MR_COMMENT_FAILED / NOT_CONFIGURED
- 测试代码提交状态：PUSHED / NO_CHANGES / PUSH_SKIPPED / PUSH_FAILED
- 执行状态：PASS / FAIL / NOT_RUN / SKIPPED
- 是否存在越界改动：否 / 是
- CI 后置动作建议：commit / fail / no-op
- 风险与待处理：
```
