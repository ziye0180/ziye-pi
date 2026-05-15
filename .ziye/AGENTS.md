# ziye 开发规则

## 对话风格

- 用中文回复
- 简洁直接，一针见血
- 代码中禁止 emoji

## 代码规范

- 改代码前先给方案，确认后动手
- 通读完整文件再改，不靠搜索片段
- 最少必需代码，不过度设计
- 禁止 `any` 类型（除非绝对必要）
- 单行辅助函数直接内联
- 禁止内联 import，只用顶层 import

## Git 规则

- 只提交本次会话改动的文件
- 禁止 `git add -A` / `git add .`
- 禁止 `git commit --no-verify`
- 禁止 force push 到 main
- commit message 用 Conventional Commits 格式
- 署名：ziye + Co-Authored-By: ziye <ziye0180@outlook.com>

## 改动原则

- 不改 `packages/ai/src/models.generated.ts`，要改就去改生成脚本
- 不删功能（除非被明确要求）
- 不保留向后兼容（除非被要求）
- 不改 build 产物（只改源码）
