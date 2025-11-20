# GoodBot 部署指南

本文档提供 GoodBot 系统的完整部署指南，包括本地开发环境和 Vercel 生产环境的配置。

## 目录

- [前置要求](#前置要求)
- [本地开发环境设置](#本地开发环境设置)
- [Vercel 生产环境部署](#vercel-生产环境部署)
- [环境变量配置](#环境变量配置)
- [数据库迁移](#数据库迁移)
- [故障排查](#故障排查)

## 前置要求

- Node.js 18+ 
- pnpm 8+
- Neon PostgreSQL 账号
- Telegram Bot Token（从 @BotFather 获取）
- Vercel 账号（用于生产部署）

## 本地开发环境设置

### 1. 克隆项目并安装依赖

```bash
git clone <your-repo-url>
cd goodbot
pnpm install
```

### 2. 配置环境变量

复制环境变量模板文件：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件，填入实际值：

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=<your_bot_token_from_botfather>
TELEGRAM_WEBHOOK_SECRET=<generate_random_string>

# Database
DATABASE_URL=<your_neon_database_url>

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate_random_string>

# Admin Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<your_secure_password>
```

#### 生成随机密钥

```bash
# 生成 TELEGRAM_WEBHOOK_SECRET
openssl rand -hex 32

# 生成 NEXTAUTH_SECRET
openssl rand -base64 32
```

### 3. 设置数据库

#### 创建 Neon 数据库

1. 访问 [Neon Console](https://console.neon.tech)
2. 创建新项目
3. 复制连接字符串到 `DATABASE_URL`

#### 运行数据库迁移

```bash
# 生成 Prisma Client
pnpm prisma:generate

# 运行迁移
pnpm prisma:migrate

# 或者直接使用 SQL 文件
# 在 Neon Console 中执行 prisma/migration.sql
```

### 4. 创建管理员用户

```bash
pnpm create-admin
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000 查看应用。

## Vercel 生产环境部署

### 1. 准备 Vercel 项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New Project"
3. 导入你的 Git 仓库
4. 选择 "Next.js" 框架

### 2. 配置环境变量

在 Vercel 项目设置中，添加以下环境变量：

#### 必需的环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | Neon PostgreSQL 连接字符串 | `postgresql://user:pass@host/db` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | `123456:ABC-DEF...` |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook 验证密钥 | 随机字符串 |
| `NEXTAUTH_URL` | 应用 URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth JWT 密钥 | 随机字符串 |
| `ADMIN_EMAIL` | 管理员邮箱 | `admin@example.com` |
| `ADMIN_PASSWORD` | 管理员密码 | 安全密码 |

#### 在 Vercel 中添加环境变量

```bash
# 使用 Vercel CLI
vercel env add DATABASE_URL
vercel env add TELEGRAM_BOT_TOKEN
vercel env add TELEGRAM_WEBHOOK_SECRET
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add ADMIN_EMAIL
vercel env add ADMIN_PASSWORD
```

或者在 Vercel Dashboard 中：
1. 进入项目设置
2. 选择 "Environment Variables"
3. 添加每个变量

### 3. 配置构建设置

Vercel 会自动检测 `vercel.json` 配置文件。确保以下设置正确：

```json
{
  "buildCommand": "pnpm prisma generate && pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

### 4. 部署

```bash
# 使用 Vercel CLI
vercel --prod

# 或者通过 Git 推送自动部署
git push origin main
```

### 5. 运行生产环境数据库迁移

部署后，需要运行数据库迁移：

#### 方法 1: 使用 Vercel CLI

```bash
vercel env pull .env.production
pnpm prisma:deploy
```

#### 方法 2: 在 Neon Console 中手动执行

1. 访问 Neon Console
2. 选择你的数据库
3. 打开 SQL Editor
4. 执行 `prisma/migration.sql` 中的 SQL 语句

### 6. 设置 Telegram Webhook

部署完成后，需要设置 Telegram Webhook：

1. 登录到你的应用: `https://your-app.vercel.app/login`
2. 进入 Bot 配置页面: `/dashboard/config`
3. 输入你的 Bot Token
4. 系统会自动设置 Webhook 到: `https://your-app.vercel.app/api/webhook`

或者使用 Telegram API 手动设置：

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.vercel.app/api/webhook",
    "secret_token": "<YOUR_WEBHOOK_SECRET>"
  }'
```

## 环境变量配置

### 环境变量说明

#### TELEGRAM_BOT_TOKEN
- **说明**: Telegram Bot API Token
- **获取方式**: 
  1. 在 Telegram 中搜索 @BotFather
  2. 发送 `/newbot` 创建新 Bot
  3. 按提示设置 Bot 名称和用户名
  4. 获取 Token
- **格式**: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

#### TELEGRAM_WEBHOOK_SECRET
- **说明**: 用于验证 Webhook 请求的密钥
- **生成方式**: `openssl rand -hex 32`
- **格式**: 64 位十六进制字符串

#### DATABASE_URL
- **说明**: PostgreSQL 数据库连接字符串
- **获取方式**: 从 Neon Console 复制
- **格式**: `postgresql://user:password@host/database?sslmode=require`

#### NEXTAUTH_URL
- **说明**: 应用的完整 URL
- **本地开发**: `http://localhost:3000`
- **生产环境**: `https://your-app.vercel.app`

#### NEXTAUTH_SECRET
- **说明**: NextAuth.js 用于加密 JWT 的密钥
- **生成方式**: `openssl rand -base64 32`
- **格式**: Base64 编码的随机字符串

#### ADMIN_EMAIL / ADMIN_PASSWORD
- **说明**: 初始管理员账号凭证
- **用途**: 用于创建第一个管理员用户
- **安全提示**: 首次登录后应立即修改密码

## 数据库迁移

### 开发环境迁移

```bash
# 创建新迁移
pnpm prisma migrate dev --name <migration_name>

# 应用迁移
pnpm prisma migrate dev

# 重置数据库（警告：会删除所有数据）
pnpm prisma migrate reset
```

### 生产环境迁移

```bash
# 仅应用迁移，不创建新迁移
pnpm prisma:deploy
```

### 查看迁移状态

```bash
pnpm prisma migrate status
```

### 手动迁移（使用 SQL）

如果 Prisma 迁移失败，可以手动执行 SQL：

1. 打开 `prisma/migration.sql`
2. 在 Neon Console 的 SQL Editor 中执行
3. 验证表结构是否正确

## 故障排查

### 问题 1: 数据库连接失败

**症状**: 应用启动时报错 "Can't reach database server"

**解决方案**:
1. 检查 `DATABASE_URL` 是否正确
2. 确认 Neon 数据库是否在运行
3. 检查网络连接
4. 验证数据库凭证是否有效

```bash
# 测试数据库连接
pnpm prisma db pull
```

### 问题 2: Prisma Client 未生成

**症状**: 导入 `@prisma/client` 时报错

**解决方案**:
```bash
pnpm prisma:generate
```

### 问题 3: Webhook 未收到消息

**症状**: Bot 无法接收 Telegram 消息

**解决方案**:
1. 检查 Webhook 是否正确设置：
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

2. 验证 Webhook URL 是否可访问：
```bash
curl https://your-app.vercel.app/api/webhook
```

3. 检查 `TELEGRAM_WEBHOOK_SECRET` 是否匹配

### 问题 4: 认证失败

**症状**: 无法登录管理界面

**解决方案**:
1. 确认管理员用户已创建：
```bash
pnpm create-admin
```

2. 检查 `NEXTAUTH_SECRET` 是否设置
3. 清除浏览器 Cookie 并重试
4. 验证 `NEXTAUTH_URL` 是否正确

### 问题 5: Vercel 构建失败

**症状**: 部署时构建失败

**解决方案**:
1. 检查构建日志中的错误信息
2. 确认所有环境变量已设置
3. 验证 `package.json` 中的构建命令
4. 确保 Prisma 生成在构建命令中：
```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

### 问题 6: 环境变量未生效

**症状**: 应用无法读取环境变量

**解决方案**:
1. 在 Vercel Dashboard 中验证环境变量
2. 确认变量应用于正确的环境（Production/Preview/Development）
3. 重新部署应用
4. 检查变量名是否拼写正确

## 监控和维护

### 查看应用日志

```bash
# Vercel CLI
vercel logs <deployment-url>

# 或在 Vercel Dashboard 中查看
```

### 数据库备份

Neon 提供自动备份功能。建议：
1. 启用自动备份
2. 定期导出数据
3. 测试恢复流程

### 性能监控

1. 使用 Vercel Analytics 监控性能
2. 检查 Neon 数据库指标
3. 监控 Telegram API 调用频率

## 安全最佳实践

1. **定期轮换密钥**
   - 每 90 天更新 `NEXTAUTH_SECRET`
   - 定期更新 `TELEGRAM_WEBHOOK_SECRET`

2. **限制访问**
   - 使用强密码
   - 启用 2FA（如果可用）
   - 限制管理员账号数量

3. **监控异常**
   - 检查异常登录尝试
   - 监控 API 调用频率
   - 设置告警通知

4. **数据保护**
   - 定期备份数据库
   - 加密敏感数据
   - 遵守数据保护法规

## 扩展和优化

### 添加自定义域名

1. 在 Vercel 项目设置中添加域名
2. 配置 DNS 记录
3. 更新 `NEXTAUTH_URL` 环境变量
4. 重新设置 Telegram Webhook

### 启用 CDN 缓存

Vercel 自动提供 CDN。优化建议：
1. 使用 Next.js ISR（增量静态再生成）
2. 配置适当的缓存头
3. 优化图片和静态资源

### 数据库优化

1. 添加必要的索引（已在 schema 中定义）
2. 使用连接池
3. 监控慢查询
4. 定期清理旧数据

## 支持和资源

- [Next.js 文档](https://nextjs.org/docs)
- [Vercel 文档](https://vercel.com/docs)
- [Neon 文档](https://neon.tech/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [NextAuth.js 文档](https://next-auth.js.org)

## 更新日志

- **v0.1.0** (2024): 初始版本
  - 基础 Bot 配置
  - 消息管理
  - 群组管理
  - 认证系统
