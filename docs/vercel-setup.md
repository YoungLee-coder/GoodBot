# Vercel 部署配置指南

本文档详细说明如何在 Vercel 上部署 GoodBot 应用。

## 前置准备

1. **Vercel 账号**: 在 [vercel.com](https://vercel.com) 注册账号
2. **Git 仓库**: 将代码推送到 GitHub/GitLab/Bitbucket
3. **Neon 数据库**: 在 [neon.tech](https://neon.tech) 创建 PostgreSQL 数据库
4. **Telegram Bot**: 从 @BotFather 获取 Bot Token

## 步骤 1: 导入项目到 Vercel

### 通过 Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New..." → "Project"
3. 选择你的 Git 提供商（GitHub/GitLab/Bitbucket）
4. 授权 Vercel 访问你的仓库
5. 选择 GoodBot 仓库
6. 点击 "Import"

### 通过 CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 在项目目录中运行
vercel

# 按提示完成配置
```

## 步骤 2: 配置项目设置

### 框架预设

Vercel 会自动检测 Next.js 项目。确认以下设置：

- **Framework Preset**: Next.js
- **Root Directory**: `./` (项目根目录)
- **Build Command**: `pnpm prisma generate && pnpm build`
- **Install Command**: `pnpm install`
- **Output Directory**: `.next` (自动)

### 自定义构建命令

如果需要在构建时运行数据库迁移（不推荐，见下文），可以使用：

```bash
pnpm vercel-build
```

这会执行：
1. `prisma generate` - 生成 Prisma Client
2. `prisma migrate deploy` - 应用数据库迁移
3. `next build` - 构建 Next.js 应用

**注意**: 在构建时运行迁移可能导致问题。推荐在部署后手动运行迁移。

## 步骤 3: 配置环境变量

### 必需的环境变量

在 Vercel 项目设置中添加以下环境变量：

#### 1. DATABASE_URL

```
postgresql://user:password@host/database?sslmode=require
```

- 从 Neon Console 获取
- 确保包含 `?sslmode=require`

#### 2. TELEGRAM_BOT_TOKEN

```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

- 从 @BotFather 获取
- 格式: `<bot_id>:<token>`

#### 3. TELEGRAM_WEBHOOK_SECRET

```bash
# 生成随机密钥
openssl rand -hex 32
```

- 用于验证 Webhook 请求
- 64 位十六进制字符串

#### 4. NEXTAUTH_URL

```
https://your-app.vercel.app
```

- 你的应用完整 URL
- 部署后会自动分配
- 可以先使用临时 URL，部署后更新

#### 5. NEXTAUTH_SECRET

```bash
# 生成随机密钥
openssl rand -base64 32
```

- NextAuth.js JWT 加密密钥
- Base64 编码的随机字符串

#### 6. ADMIN_EMAIL

```
admin@example.com
```

- 管理员邮箱地址
- 用于首次登录

#### 7. ADMIN_PASSWORD

```
your_secure_password
```

- 管理员密码
- 使用强密码
- 首次登录后应修改

### 添加环境变量的方法

#### 方法 1: 通过 Dashboard

1. 进入项目设置: Settings → Environment Variables
2. 点击 "Add New"
3. 输入变量名和值
4. 选择环境: Production, Preview, Development
5. 点击 "Save"

#### 方法 2: 通过 CLI

```bash
# 添加单个变量
vercel env add DATABASE_URL production

# 从文件导入
vercel env pull .env.production
```

#### 方法 3: 批量导入

创建 `.env.production` 文件（不要提交到 Git）：

```env
DATABASE_URL=postgresql://...
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_WEBHOOK_SECRET=abc123...
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=xyz789...
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_password
```

然后使用 CLI 导入：

```bash
vercel env add < .env.production
```

### 环境变量作用域

为每个变量选择适当的环境：

- **Production**: 生产环境（必需）
- **Preview**: 预览部署（可选，用于测试）
- **Development**: 本地开发（可选，使用 `vercel dev`）

推荐配置：
- 所有变量都添加到 Production
- Preview 使用独立的测试数据库
- Development 使用本地 `.env.local`

## 步骤 4: 部署应用

### 首次部署

1. 确认所有环境变量已配置
2. 点击 "Deploy" 按钮
3. 等待构建完成（约 2-3 分钟）
4. 部署成功后会显示 URL

### 后续部署

每次推送到主分支会自动触发部署：

```bash
git add .
git commit -m "Update feature"
git push origin main
```

### 手动部署

```bash
# 部署到生产环境
vercel --prod

# 部署到预览环境
vercel
```

## 步骤 5: 运行数据库迁移

部署后需要设置数据库结构。

### 方法 1: 使用 Prisma CLI（推荐）

```bash
# 1. 拉取生产环境变量
vercel env pull .env.production

# 2. 运行迁移
pnpm prisma migrate deploy

# 或使用生产环境 URL
DATABASE_URL="postgresql://..." pnpm prisma migrate deploy
```

### 方法 2: 在 Neon Console 中执行 SQL

1. 打开 [Neon Console](https://console.neon.tech)
2. 选择你的数据库
3. 打开 SQL Editor
4. 复制 `prisma/migration.sql` 的内容
5. 执行 SQL 语句
6. 验证表已创建

### 方法 3: 使用 Vercel 函数

创建一个临时的 API 路由来运行迁移（仅用于首次设置）：

```typescript
// app/api/setup/route.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout, stderr } = await execAsync('pnpm prisma migrate deploy');
    return Response.json({ success: true, stdout, stderr });
  } catch (error) {
    return Response.json({ success: false, error }, { status: 500 });
  }
}
```

访问 `https://your-app.vercel.app/api/setup` 运行迁移。

**重要**: 运行后立即删除此路由！

## 步骤 6: 创建管理员用户

### 方法 1: 使用脚本（推荐）

```bash
# 1. 拉取环境变量
vercel env pull .env.production

# 2. 运行创建脚本
pnpm create-admin
```

### 方法 2: 在数据库中手动创建

```sql
-- 在 Neon SQL Editor 中执行
INSERT INTO "User" (id, email, password, name, "createdAt", "updatedAt")
VALUES (
  'admin-' || gen_random_uuid()::text,
  'admin@example.com',
  '$2b$10$...',  -- 使用 bcrypt 哈希的密码
  'Admin',
  NOW(),
  NOW()
);
```

生成密码哈希：

```bash
node -e "console.log(require('bcrypt').hashSync('your_password', 10))"
```

## 步骤 7: 配置 Telegram Webhook

### 自动配置（推荐）

1. 访问你的应用: `https://your-app.vercel.app`
2. 登录管理界面
3. 进入 Bot 配置页面: `/dashboard/config`
4. 输入 Bot Token
5. 点击保存（会自动设置 Webhook）

### 手动配置

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

### 验证 Webhook

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

应该返回：

```json
{
  "ok": true,
  "result": {
    "url": "https://your-app.vercel.app/api/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## 步骤 8: 验证部署

### 1. 检查应用状态

访问: `https://your-app.vercel.app`

应该看到登录页面。

### 2. 测试登录

使用配置的管理员凭证登录。

### 3. 测试 Bot

1. 在 Telegram 中找到你的 Bot
2. 发送消息: `/start`
3. 在管理界面查看消息是否收到

### 4. 检查日志

在 Vercel Dashboard 中查看：
- Deployments → 选择部署 → Logs
- 或使用 CLI: `vercel logs`

## 步骤 9: 配置自定义域名（可选）

### 添加域名

1. 在 Vercel 项目设置中: Settings → Domains
2. 输入你的域名: `bot.example.com`
3. 点击 "Add"
4. 按提示配置 DNS 记录

### DNS 配置

添加以下记录到你的 DNS 提供商：

```
Type: CNAME
Name: bot (或 @)
Value: cname.vercel-dns.com
```

### 更新环境变量

域名配置完成后，更新 `NEXTAUTH_URL`:

```
NEXTAUTH_URL=https://bot.example.com
```

### 重新设置 Webhook

使用新域名重新设置 Telegram Webhook：

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://bot.example.com/api/webhook",
    "secret_token": "<YOUR_WEBHOOK_SECRET>"
  }'
```

## 故障排查

### 构建失败

**问题**: 部署时构建失败

**解决方案**:
1. 检查构建日志中的错误
2. 确认所有环境变量已设置
3. 验证 `package.json` 中的依赖版本
4. 确保 Prisma 生成命令在构建中

```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

### 数据库连接错误

**问题**: 应用无法连接到数据库

**解决方案**:
1. 验证 `DATABASE_URL` 格式正确
2. 确认 Neon 数据库正在运行
3. 检查 IP 白名单（Neon 默认允许所有）
4. 测试连接:

```bash
DATABASE_URL="postgresql://..." pnpm prisma db pull
```

### Webhook 不工作

**问题**: Bot 无法接收消息

**解决方案**:
1. 检查 Webhook 状态:
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

2. 验证 Webhook URL 可访问:
```bash
curl https://your-app.vercel.app/api/webhook
```

3. 检查 `TELEGRAM_WEBHOOK_SECRET` 是否匹配

4. 查看 Vercel 日志中的错误

### 认证失败

**问题**: 无法登录管理界面

**解决方案**:
1. 确认管理员用户已创建
2. 检查 `NEXTAUTH_SECRET` 是否设置
3. 验证 `NEXTAUTH_URL` 与实际 URL 匹配
4. 清除浏览器 Cookie
5. 检查密码是否正确哈希

### 环境变量未生效

**问题**: 应用无法读取环境变量

**解决方案**:
1. 在 Vercel Dashboard 中验证变量
2. 确认变量应用于 Production 环境
3. 重新部署应用
4. 检查变量名拼写

## 最佳实践

### 1. 使用环境分离

- **Production**: 生产数据库和 Bot
- **Preview**: 测试数据库和测试 Bot
- **Development**: 本地数据库

### 2. 定期备份

- 启用 Neon 自动备份
- 定期导出数据
- 测试恢复流程

### 3. 监控和告警

- 使用 Vercel Analytics
- 监控 Neon 数据库指标
- 设置错误告警

### 4. 安全措施

- 使用强密码和密钥
- 定期轮换密钥
- 限制管理员访问
- 启用 2FA（如果可用）

### 5. 性能优化

- 使用 Vercel Edge Functions
- 启用 Next.js ISR
- 优化数据库查询
- 添加适当的索引

## 持续集成/部署

### GitHub Actions 示例

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run linter
        run: pnpm lint
      
      - name: Build
        run: pnpm build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署](https://nextjs.org/docs/deployment)
- [Prisma 部署](https://www.prisma.io/docs/guides/deployment)
- [Neon 文档](https://neon.tech/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)

## 支持

如有问题，请查看：
- [完整部署文档](./deployment.md)
- [故障排查指南](./deployment.md#故障排查)
- 项目 Issues
