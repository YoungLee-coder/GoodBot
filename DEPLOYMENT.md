# GoodBot 快速部署指南

本指南提供 GoodBot 系统的快速部署步骤，适合想要快速启动项目的用户。如需详细说明，请参考 [完整部署文档](./docs/deployment.md)。

## 目录

- [本地开发环境](#本地开发环境)
- [Vercel 生产部署](#vercel-生产部署)
- [环境变量配置](#环境变量配置)
- [部署后配置](#部署后配置)
- [验证部署](#验证部署)
- [常见问题](#常见问题)

## 本地开发环境

### 前置要求

- Node.js 18+
- pnpm 8+
- Neon PostgreSQL 账号
- Telegram Bot Token

### 快速启动

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd goodbot

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入实际值（见下方环境变量说明）

# 4. 设置数据库
pnpm prisma:generate
pnpm prisma:migrate

# 5. 创建管理员用户
pnpm create-admin

# 6. 启动开发服务器
pnpm dev
```

访问 http://localhost:3000 查看应用。

### 获取必需的凭证

#### 1. Telegram Bot Token

1. 在 Telegram 中搜索 [@BotFather](https://t.me/botfather)
2. 发送 `/newbot` 命令
3. 按提示设置 Bot 名称和用户名
4. 复制获得的 Token（格式: `123456:ABC-DEF...`）

#### 2. Neon 数据库

1. 访问 [Neon Console](https://console.neon.tech)
2. 创建新项目
3. 复制连接字符串（确保包含 `?sslmode=require`）

#### 3. 生成密钥

```bash
# 生成 TELEGRAM_WEBHOOK_SECRET
openssl rand -hex 32

# 生成 NEXTAUTH_SECRET
openssl rand -base64 32
```

## Vercel 生产部署

### 方法 1: 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

点击按钮后：
1. 登录或注册 Vercel 账号
2. 选择 Git 提供商并授权
3. 配置环境变量（见下方）
4. 点击 Deploy

### 方法 2: 通过 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New Project"
3. 导入你的 Git 仓库（GitHub/GitLab/Bitbucket）
4. 框架预设会自动检测为 Next.js
5. 添加环境变量（见下方）
6. 点击 "Deploy"

### 方法 3: 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 在项目目录中部署
vercel --prod
```

## 环境变量配置

### 必需的环境变量

在 Vercel Dashboard 的 **Settings > Environment Variables** 中添加以下变量：

| 变量名 | 说明 | 如何获取 |
|--------|------|----------|
| `DATABASE_URL` | Neon PostgreSQL 连接字符串 | 从 Neon Console 复制 |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | 从 @BotFather 获取 |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook 验证密钥 | `openssl rand -hex 32` |
| `NEXTAUTH_URL` | 应用完整 URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth JWT 密钥 | `openssl rand -base64 32` |
| `ADMIN_EMAIL` | 管理员邮箱 | 自定义邮箱地址 |
| `ADMIN_PASSWORD` | 管理员密码 | 使用强密码 |

### 环境变量示例

```env
# Telegram Bot 配置
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

# 数据库配置
DATABASE_URL=postgresql://user:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# NextAuth 配置
NEXTAUTH_URL=https://goodbot.vercel.app
NEXTAUTH_SECRET=Xj8K9mN2pQ5rS7tU1vW3xY6zA4bC8dE0fG2hI5jK7lM=

# 管理员凭证
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourSecurePassword123!
```

### 添加环境变量的方式

#### 通过 Vercel Dashboard

1. 进入项目设置: **Settings > Environment Variables**
2. 点击 "Add New"
3. 输入变量名和值
4. 选择环境: **Production** (必需)
5. 点击 "Save"

#### 通过 Vercel CLI

```bash
# 添加单个变量
vercel env add DATABASE_URL production

# 批量添加（交互式）
vercel env add
```

### 安全提示

⚠️ **重要安全建议**:
- 使用强随机密钥，不要使用示例值
- 不要在代码中硬编码密钥
- 不要将 `.env.local` 提交到 Git
- 定期轮换密钥（建议每 90 天）
- 使用强管理员密码（至少 12 位，包含大小写字母、数字和特殊字符）

## 部署后配置

部署成功后，需要完成以下配置步骤：

### 1. 运行数据库迁移

选择以下方法之一：

#### 方法 A: 使用 Prisma CLI（推荐）

```bash
# 1. 拉取生产环境变量
vercel env pull .env.production

# 2. 运行迁移
pnpm prisma:deploy
```

#### 方法 B: 在 Neon Console 中手动执行

1. 打开 [Neon Console](https://console.neon.tech)
2. 选择你的数据库
3. 打开 **SQL Editor**
4. 复制 `prisma/migration.sql` 的内容
5. 执行 SQL 语句
6. 验证表已创建（应该看到 BotConfig, Message, Group, User 表）

### 2. 创建管理员用户

```bash
# 使用拉取的生产环境变量
pnpm create-admin
```

或在数据库中手动创建：

```sql
-- 在 Neon SQL Editor 中执行
INSERT INTO "User" (id, email, password, name, "createdAt", "updatedAt")
VALUES (
  'admin-' || gen_random_uuid()::text,
  'admin@example.com',
  -- 使用 bcrypt 哈希的密码
  '$2b$10$...',
  'Admin',
  NOW(),
  NOW()
);
```

生成密码哈希：
```bash
node -e "console.log(require('bcrypt').hashSync('your_password', 10))"
```

### 3. 设置 Telegram Webhook

#### 自动设置（推荐）

1. 访问你的应用: `https://your-app.vercel.app`
2. 使用管理员凭证登录
3. 进入 Bot 配置页面: `/dashboard/config`
4. 输入 Telegram Bot Token
5. 点击保存（系统会自动设置 Webhook）

#### 手动设置

使用 Telegram API 设置 Webhook：

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.vercel.app/api/webhook",
    "secret_token": "<YOUR_WEBHOOK_SECRET>",
    "allowed_updates": ["message", "my_chat_member"]
  }'
```

成功响应：
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

## 验证部署

### 1. 检查应用状态

```bash
# 检查应用是否运行
curl https://your-app.vercel.app

# 应该返回 HTML 内容
```

### 2. 验证 Webhook 配置

```bash
# 检查 Webhook 状态
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

期望的响应：
```json
{
  "ok": true,
  "result": {
    "url": "https://your-app.vercel.app/api/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40
  }
}
```

### 3. 测试登录

1. 访问 `https://your-app.vercel.app/login`
2. 使用管理员凭证登录
3. 应该成功进入仪表板

### 4. 测试 Bot 功能

1. 在 Telegram 中找到你的 Bot
2. 发送测试消息: `/start` 或 `Hello`
3. 在管理界面的消息页面查看是否收到消息
4. 尝试回复消息
5. 在 Telegram 中确认收到回复

### 5. 检查日志

在 Vercel Dashboard 中查看日志：
- 进入 **Deployments** > 选择最新部署 > **Logs**
- 或使用 CLI: `vercel logs`

确认：
- ✅ 无错误日志
- ✅ Webhook 请求正常记录
- ✅ 数据库连接正常

## 常见问题

### 问题 1: 构建失败

**症状**: Vercel 部署时构建失败

**可能原因**:
- 环境变量未设置
- 依赖安装失败
- Prisma 生成失败

**解决方案**:
```bash
# 1. 检查所有环境变量是否已设置
vercel env ls

# 2. 查看构建日志中的具体错误
# 在 Vercel Dashboard 中查看

# 3. 本地测试构建
pnpm build

# 4. 确保 package.json 中的构建命令正确
# "build": "prisma generate && next build"
```

### 问题 2: 数据库连接失败

**症状**: 应用无法连接到数据库

**可能原因**:
- `DATABASE_URL` 格式错误
- Neon 数据库未运行
- 缺少 `sslmode=require`

**解决方案**:
```bash
# 1. 验证连接字符串格式
echo $DATABASE_URL

# 2. 确保包含 sslmode=require
# 正确格式: postgresql://user:pass@host/db?sslmode=require

# 3. 测试数据库连接
pnpm prisma db pull

# 4. 在 Neon Console 中检查数据库状态
```

### 问题 3: Webhook 不工作

**症状**: Bot 无法接收 Telegram 消息

**可能原因**:
- Webhook URL 未设置
- Webhook Secret 不匹配
- 应用无法访问

**解决方案**:
```bash
# 1. 检查 Webhook 状态
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# 2. 验证 Webhook URL 可访问
curl https://your-app.vercel.app/api/webhook

# 3. 重新设置 Webhook
# 在管理界面的 Bot 配置页面重新保存 Token

# 4. 检查 TELEGRAM_WEBHOOK_SECRET 是否匹配
vercel env ls
```

### 问题 4: 认证失败

**症状**: 无法登录管理界面

**可能原因**:
- 管理员用户未创建
- `NEXTAUTH_SECRET` 未设置
- `NEXTAUTH_URL` 不正确
- 密码错误

**解决方案**:
```bash
# 1. 重新创建管理员用户
vercel env pull .env.production
pnpm create-admin

# 2. 检查环境变量
vercel env ls

# 3. 验证 NEXTAUTH_URL 与实际 URL 匹配
# 应该是: https://your-app.vercel.app

# 4. 清除浏览器 Cookie 并重试

# 5. 检查密码是否正确
# 可以在数据库中重置密码
```

### 问题 5: 环境变量未生效

**症状**: 应用无法读取环境变量

**可能原因**:
- 变量未应用到 Production 环境
- 变量名拼写错误
- 需要重新部署

**解决方案**:
```bash
# 1. 在 Vercel Dashboard 中验证变量
# Settings > Environment Variables

# 2. 确认变量应用于 Production 环境
# 每个变量都应该勾选 Production

# 3. 重新部署应用
vercel --prod

# 4. 检查变量名是否拼写正确
# 变量名区分大小写
```

## 下一步

部署成功后，你可以：

1. **配置自定义域名**
   - 在 Vercel 项目设置中添加域名
   - 配置 DNS 记录
   - 更新 `NEXTAUTH_URL` 环境变量

2. **启用监控**
   - 使用 Vercel Analytics 监控性能
   - 设置错误告警
   - 监控 Neon 数据库指标

3. **优化性能**
   - 添加数据库索引（已在 schema 中定义）
   - 配置缓存策略
   - 优化查询性能

4. **增强安全性**
   - 定期轮换密钥
   - 启用 2FA（如果可用）
   - 审查访问日志

## 更多资源

### 详细文档

- [完整部署文档](./docs/deployment.md) - 详细部署说明和高级配置
- [Vercel 配置指南](./docs/vercel-setup.md) - Vercel 特定配置步骤
- [部署检查清单](./docs/deployment-checklist.md) - 完整的部署验证清单
- [数据库设置](./prisma/README.md) - Prisma 和数据库配置

### 技术文档

- [认证系统](./docs/authentication.md) - NextAuth.js 认证实现
- [错误处理](./docs/error-handling.md) - 错误处理策略
- [Webhook 实现](./docs/webhook-implementation.md) - Telegram Webhook 处理
- [安全实现](./docs/security-implementation.md) - 安全措施

### 外部资源

- [Next.js 文档](https://nextjs.org/docs)
- [Vercel 文档](https://vercel.com/docs)
- [Neon 文档](https://neon.tech/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [NextAuth.js 文档](https://next-auth.js.org)

## 获取帮助

如果遇到问题：

1. 查看 [常见问题](#常见问题) 部分
2. 查阅 [完整部署文档](./docs/deployment.md) 的故障排查章节
3. 检查 [部署检查清单](./docs/deployment-checklist.md)
4. 查看项目 Issues
5. 查阅相关技术文档

---

**部署成功？** 🎉

恭喜！你的 GoodBot 已经成功部署。现在可以：
- 在 Telegram 中测试你的 Bot
- 通过管理界面管理消息和群组
- 探索更多功能和配置选项

**需要帮助？** 📚

查看 [完整文档](./docs/) 或提交 Issue。
