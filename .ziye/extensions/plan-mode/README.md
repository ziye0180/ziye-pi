# Plan Mode 扩展

只读探索模式，安全分析代码。

## 功能

- **只读工具**：限制可用工具为 read、bash、grep、find、ls、questionnaire
- **Bash 白名单**：仅允许只读的 bash 命令
- **Plan 提取**：从 `Plan:` 段落中提取编号步骤
- **进度追踪**：执行过程中显示完成状态的小部件
- **[DONE:n] 标记**：显式步骤完成追踪
- **会话持久化**：状态在会话恢复后保留

## 命令

- `/plan` - 切换 plan mode
- `/todos` - 显示当前 plan 进度
- `Ctrl+Alt+P` - 切换 plan mode（快捷键）

## 用法

1. 用 `/plan` 或 `--plan` 参数启用 plan mode
2. 让 agent 分析代码并创建计划
3. agent 应在 `Plan:` 标题下输出编号计划：

```
Plan:
1. 第一步描述
2. 第二步描述
3. 第三步描述
```

4. 弹出选择时选 "Execute the plan"
5. 执行过程中，agent 用 `[DONE:n]` 标签标记完成的步骤
6. 进度小部件显示完成状态

## 工作原理

### Plan Mode（只读）
- 仅可用只读工具
- Bash 命令经过白名单过滤
- agent 只创建计划，不做任何修改

### Execution Mode（执行）
- 恢复完整工具权限
- agent 按顺序执行步骤
- `[DONE:n]` 标记追踪完成情况
- 小部件显示进度

### 命令白名单

安全命令（允许）：
- 文件查看：`cat`、`head`、`tail`、`less`、`more`
- 搜索：`grep`、`find`、`rg`、`fd`
- 目录：`ls`、`pwd`、`tree`
- Git 只读：`git status`、`git log`、`git diff`、`git branch`
- 包信息：`npm list`、`npm outdated`、`yarn info`
- 系统信息：`uname`、`whoami`、`date`、`uptime`

禁止的命令：
- 文件修改：`rm`、`mv`、`cp`、`mkdir`、`touch`
- Git 写入：`git add`、`git commit`、`git push`
- 包安装：`npm install`、`yarn add`、`pip install`
- 系统：`sudo`、`kill`、`reboot`
- 编辑器：`vim`、`nano`、`code`
