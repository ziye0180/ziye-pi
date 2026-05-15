---
description: 标准 git commit 并 push，自动生成 Conventional Commits 格式的提交信息
argument-hint: "[commit 类型和说明]"
---
提交并推送当前改动。

附加指令：$ARGUMENTS

## 流程

1. **检查改动范围**：
   ```bash
   git status
   git diff --stat
   ```

2. **生成 commit message**：
   - 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式
   - 类型：`feat` / `fix` / `refactor` / `docs` / `chore` / `style` / `test` / `perf`
   - 范围用中文简要描述（如 `feat(支付): 新增退款接口`）
   - 如果用户给了 $ARGUMENTS，按其指示确定类型和描述
   - 提交信息末尾固定署名：

   ```
   ziye

   Co-Authored-By: ziye <ziye0180@outlook.com>
   ```

3. **暂存文件**：
   - 只 add 你本次会话中修改的文件
   - 绝对禁止 `git add -A` 或 `git add .`

4. **提交前检查**（如果改了代码）：
   ```bash
   npm run check
   ```
   有 error/warning 必须先修复再提交

5. **提交**：
   ```bash
   git commit -m "$(cat <<'EOF'
   <类型>(<范围>): <描述>

   <改动说明>

   ziye

   Co-Authored-By: ziye <ziye0180@outlook.com>
   EOF
   )"
   ```

6. **推送**：
   ```bash
   git push origin main
   ```

7. **最终验证 —— 一个文件都不能留**：
   ```bash
   git status
   ```
   必须输出 `nothing to commit, working tree clean`。如果还有未提交的文件或改动，回到步骤 3 继续 add 并 amend，直到彻底干净。

## 约束

- **所有本次会话的改动全部提交，一个不留**
- 禁止暂存无关文件（CHANGELOG、build 产物、models.generated.ts 等非本次改动的文件）
- 禁止 `git add .` 或 `git add -A`，每个文件单独 add
- 禁止 `git commit --no-verify`
- 禁止 force push 到 main
- 如果当前分支不是 `main`，先询问
- 如果 $ARGUMENTS 为空，先检查 diff 内容再生成 commit message，不要猜
