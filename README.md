# GoodBot - Telegram Bot 管理系统

基于 Next.js 15 的 Telegram Bot 管理平台，提供 Web UI 界面来管理 Telegram Bot 的消息和群组。系统使用现代化技术栈，支持双向消息通信、群组管理和安全认证。

## 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [本地开发](#本地开发)
- [部署指南](#部署指南)
- [项目结构](#项目结构)
- [可用脚本](#可用脚本)
- [环境变量](#环境变量)
- [文档](#文档)
- [故障排查](#故障排查)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 功能特性

- ✅ **Bot 配置管理** - 通过 Web 界面配置 Telegram Bot Token 和 Webhook
- 💬 **双向消息通信** - 接收用户消息并通过管理界面回复
- 👥 **群组管理** - 管理 Bot 加入的群组，发送和接收群组消息
- 🔐 **安全认证** - 基于 NextAuth.js 的会话认证系统
- 📊 **消息历史** - 查询和浏览历史消息，支持分页
- 🎨 **现代化 UI** - 使用 Tailwind CSS 4 和 shadcn/ui 构建的响应式界面
- ⚡ **高性能** - 基于 Next.js 15 App Router，部署在 Vercel 无服务器平台
- 🗄️ **可靠存储** - 使用 Neon PostgreSQL 和 Prisma ORM

## 技术栈

### 核心框架
- **前端框架**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI 库**: [React 19](https://react.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **包管理**: [pnpm](https://pnpm.io/)

### 样式和组件
- **样式框架**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI 组件**: [shadcn/ui](https://ui.shadcn.com/)
- **图标**: [Lucide React](https://lucide.dev/)

### 后端和数据
- **数据库**: [Neon PostgreSQL](https://neon.tech/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **认证**: [NextAuth.js v5](https://next-auth.js.org/) (Auth.js)
- **Telegram SDK**: [grammy](https://grammy.dev/)

### 部署和工具
- **部署平台**: [Vercel](https://vercel.com/)
- **测试框架**: [Vitest](https://vitest.dev/)
- **密码哈希**: [bcrypt](https://www.npmjs.com/package/bcrypt)
- **数据验证**: [Zod](https://zod.dev/)

## 快速开始

### 前置要求

在开始之前，请确保已安装：

- **Node.js** 18.0 或更高版本
- **pnpm** 8.0 或更高版本
- **Git** (用于克隆仓库)

### 一键部署到 Vercel

最快的方式是直接部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

部署后，按照 [部署后配置](#部署后配置) 完成设置。

### 本地快速启动

```bash
# 1. 克隆仓库
git clone <your-repo-url>
cd goodbot

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入实际值

# 4. 设置数据库
pnpm prisma:generate
pnpm prisma:migrate

# 5. 创建管理员用户
pnpm create-admin

# 6. 启动开发服务器
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 本地开发

### 详细安装步骤

#### 1. 克隆项目

```bash
git clone <your-repo-url>
cd goodbot
```

#### 2. 安装依赖

使用 pnpm 安装所有依赖：

```bash
pnpm install
```

如果没有安装 pnpm，可以通过以下方式安装：

```bash
npm install -g pnpm
```

#### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入以下信息：

```env
# Telegram Bot 配置
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_SECRET=generate_with_openssl_rand_hex_32

# 数据库配置
DATABASE_URL=your_neon_postgresql_connection_string

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32

# 管理员凭证
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
```

**生成密钥：**

```bash
# 生成 TELEGRAM_WEBHOOK_SECRET
openssl rand -hex 32

# 生成 NEXTAUTH_SECRET
openssl rand -base64 32
```

**获取 Telegram Bot Token：**

1. 在 Telegram 中搜索 [@BotFather](https://t.me/botfather)
2. 发送 `/newbot` 命令
3. 按提示设置 Bot 名称和用户名
4. 复制获得的 Token

**获取数据库连接字符串：**

1. 访问 [Neon Console](https://console.neon.tech)
2. 创建新项目或选择现有项目
3. 复制连接字符串（确保包含 `?sslmode=require`）

#### 4. 设置数据库

生成 Prisma Client：

```bash
pnpm prisma:generate
```

运行数据库迁移：

```bash
pnpm prisma:migrate
```

这将创建所有必需的数据库表。

#### 5. 创建管理员用户

运行脚本创建初始管理员账号：

```bash
pnpm create-admin
```

该脚本会使用 `.env.local` 中的 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 创建管理员用户。

#### 6. 启动开发服务器

```bash
pnpm dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动。

#### 7. 访问应用

1. 打开浏览器访问 http://localhost:3000
2. 使用管理员凭证登录
3. 进入 Bot 配置页面设置 Telegram Bot

### 开发工具

#### Prisma Studio

使用 Prisma Studio 可视化查看和编辑数据库：

```bash
pnpm prisma:studio
```

#### 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式运行测试
pnpm test:watch

# 使用 UI 界面运行测试
pnpm test:ui
```

#### 代码检查

```bash
# 运行 ESLint
pnpm lint
```

## 部署指南

### 部署到 Vercel

#### 方法 1: 通过 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New Project"
3. 导入你的 Git 仓库
4. 配置环境变量（见下方）
5. 点击 "Deploy"

#### 方法 2: 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署到生产环境
vercel --prod
```

### 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | Neon PostgreSQL 连接字符串 | `postgresql://user:pass@host/db?sslmode=require` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | `123456:ABC-DEF...` |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook 验证密钥 | 使用 `openssl rand -hex 32` 生成 |
| `NEXTAUTH_URL` | 应用完整 URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth JWT 密钥 | 使用 `openssl rand -base64 32` 生成 |
| `ADMIN_EMAIL` | 管理员邮箱 | `admin@example.com` |
| `ADMIN_PASSWORD` | 管理员密码 | 使用强密码 |

### 部署后配置

#### 1. 运行数据库迁移

```bash
# 拉取生产环境变量
vercel env pull .env.production

# 运行迁移
pnpm prisma:deploy
```

或在 Neon Console 中手动执行 `prisma/migration.sql`。

#### 2. 创建管理员用户

```bash
pnpm create-admin
```

#### 3. 设置 Telegram Webhook

登录应用后，进入 Bot 配置页面输入 Bot Token，系统会自动设置 Webhook。

或使用 API 手动设置：

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.vercel.app/api/webhook",
    "secret_token": "<YOUR_WEBHOOK_SECRET>"
  }'
```

### 详细部署文档

- [快速部署指南](./DEPLOYMENT.md) - 快速开始部署
- [完整部署文档](./docs/deployment.md) - 详细部署说明
- [Vercel 配置指南](./docs/vercel-setup.md) - Vercel 特定配置
- [部署检查清单](./docs/deployment-checklist.md) - 完整的部署检查清单

## 项目结构

```
goodbot/
├── app/                      # Next.js App Router 应用
│   ├── api/                 # API 路由
│   │   ├── auth/           # NextAuth 认证端点
│   │   ├── bot/            # Bot 配置 API
│   │   ├── groups/         # 群组管理 API
│   │   ├── messages/       # 消息管理 API
│   │   └── webhook/        # Telegram Webhook 处理器
│   ├── dashboard/          # 管理界面页面
│   │   ├── config/         # Bot 配置页面
│   │   ├── groups/         # 群组管理页面
│   │   └── messages/       # 消息管理页面
│   ├── login/              # 登录页面
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页
│   └── globals.css         # 全局样式
├── components/              # React 组件
│   ├── ui/                 # shadcn/ui 组件
│   ├── error-boundary.tsx  # 错误边界
│   └── logout-button.tsx   # 登出按钮
├── lib/                     # 工具函数和服务
│   ├── api-client.ts       # API 客户端
│   ├── api-error-handler.ts # API 错误处理
│   ├── auth-actions.ts     # 认证操作
│   ├── bot-config-service.ts # Bot 配置服务
│   ├── group-service.ts    # 群组服务
│   ├── message-service.ts  # 消息服务
│   ├── password.ts         # 密码哈希
│   ├── prisma.ts           # Prisma 客户端
│   ├── rate-limiter.ts     # 速率限制
│   ├── validation.ts       # 输入验证
│   └── __tests__/          # 单元测试
├── prisma/                  # Prisma 配置
│   ├── schema.prisma       # 数据库模型
│   ├── migration.sql       # 数据库迁移 SQL
│   └── README.md           # 数据库设置说明
├── docs/                    # 项目文档
│   ├── deployment.md       # 完整部署文档
│   ├── vercel-setup.md     # Vercel 配置指南
│   ├── deployment-checklist.md # 部署检查清单
│   ├── authentication.md   # 认证系统说明
│   ├── error-handling.md   # 错误处理策略
│   └── webhook-implementation.md # Webhook 实现
├── scripts/                 # 工具脚本
│   └── create-admin.ts     # 创建管理员脚本
├── .kiro/                   # Kiro 规范文档
│   └── specs/goodbot/      # GoodBot 功能规范
│       ├── requirements.md # 需求文档
│       ├── design.md       # 设计文档
│       └── tasks.md        # 实施计划
├── .env.example            # 环境变量模板
├── .gitignore              # Git 忽略文件
├── package.json            # 项目依赖
├── tsconfig.json           # TypeScript 配置
├── next.config.ts          # Next.js 配置
├── postcss.config.mjs      # PostCSS 配置
├── tailwind.config.ts      # Tailwind CSS 配置
├── vitest.config.ts        # Vitest 测试配置
├── DEPLOYMENT.md           # 快速部署指南
└── README.md               # 本文件
```

## 可用脚本

### 开发

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 运行代码检查
pnpm lint
```

### 测试

```bash
# 运行所有测试
pnpm test

# 监听模式运行测试
pnpm test:watch

# 使用 UI 界面运行测试
pnpm test:ui
```

### 数据库

```bash
# 生成 Prisma Client
pnpm prisma:generate

# 运行数据库迁移（开发环境）
pnpm prisma:migrate

# 应用迁移（生产环境）
pnpm prisma:deploy

# 打开 Prisma Studio
pnpm prisma:studio
```

### 工具

```bash
# 创建管理员用户
pnpm create-admin

# Vercel 构建命令（包含迁移）
pnpm vercel-build
```

## 环境变量

### 必需的环境变量

| 变量名 | 说明 | 开发环境 | 生产环境 |
|--------|------|----------|----------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | ✅ | ✅ |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | ✅ | ✅ |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook 验证密钥 | ✅ | ✅ |
| `NEXTAUTH_URL` | 应用 URL | ✅ | ✅ |
| `NEXTAUTH_SECRET` | NextAuth JWT 密钥 | ✅ | ✅ |
| `ADMIN_EMAIL` | 管理员邮箱 | ✅ | ✅ |
| `ADMIN_PASSWORD` | 管理员密码 | ✅ | ✅ |

### 环境变量文件

- `.env.local` - 本地开发环境（不提交到 Git）
- `.env.example` - 环境变量模板（提交到 Git）
- `.env.production` - 生产环境（不提交到 Git，仅用于本地测试）

### 安全注意事项

⚠️ **重要**: 
- 永远不要将 `.env.local` 或包含真实密钥的文件提交到 Git
- 使用强随机密钥，不要使用示例值
- 定期轮换密钥（建议每 90 天）
- 在 Vercel 中使用环境变量管理，不要硬编码

## 文档

### 核心文档

- [需求文档](./.kiro/specs/goodbot/requirements.md) - 功能需求和验收标准
- [设计文档](./.kiro/specs/goodbot/design.md) - 系统架构和设计决策
- [实施计划](./.kiro/specs/goodbot/tasks.md) - 开发任务清单

### 部署文档

- [快速部署指南](./DEPLOYMENT.md) - 快速开始部署
- [完整部署文档](./docs/deployment.md) - 详细部署说明和故障排查
- [Vercel 配置指南](./docs/vercel-setup.md) - Vercel 特定配置步骤
- [部署检查清单](./docs/deployment-checklist.md) - 完整的部署验证清单

### 技术文档

- [认证系统](./docs/authentication.md) - NextAuth.js 认证实现
- [错误处理](./docs/error-handling.md) - 错误处理策略和最佳实践
- [Webhook 实现](./docs/webhook-implementation.md) - Telegram Webhook 处理
- [安全实现](./docs/security-implementation.md) - 安全措施和最佳实践
- [数据库优化](./docs/task-18-database-optimization.md) - 数据库性能优化
- [游标分页](./docs/cursor-pagination.md) - 高效分页实现

### 数据库文档

- [Prisma 设置](./prisma/README.md) - 数据库配置和迁移说明

## 故障排查

### 常见问题

#### 1. 数据库连接失败

**症状**: `Can't reach database server`

**解决方案**:
```bash
# 检查连接字符串格式
echo $DATABASE_URL

# 测试数据库连接
pnpm prisma db pull

# 确保包含 sslmode=require
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

#### 2. Prisma Client 未生成

**症状**: `Cannot find module '@prisma/client'`

**解决方案**:
```bash
pnpm prisma:generate
```

#### 3. Webhook 未收到消息

**症状**: Bot 无法接收 Telegram 消息

**解决方案**:
```bash
# 检查 Webhook 状态
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# 验证 Webhook URL
curl https://your-app.vercel.app/api/webhook

# 重新设置 Webhook
# 在管理界面的 Bot 配置页面重新保存 Token
```

#### 4. 认证失败

**症状**: 无法登录管理界面

**解决方案**:
```bash
# 重新创建管理员用户
pnpm create-admin

# 检查环境变量
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL

# 清除浏览器 Cookie 并重试
```

#### 5. 构建失败

**症状**: Vercel 部署时构建失败

**解决方案**:
1. 检查所有环境变量是否已设置
2. 查看 Vercel 构建日志中的具体错误
3. 确保 `package.json` 中的构建命令正确
4. 本地测试构建: `pnpm build`

### 获取帮助

如果遇到问题：

1. 查看 [完整部署文档](./docs/deployment.md) 的故障排查部分
2. 检查 [部署检查清单](./docs/deployment-checklist.md)
3. 查看项目 Issues
4. 查阅相关技术文档：
   - [Next.js 文档](https://nextjs.org/docs)
   - [Vercel 文档](https://vercel.com/docs)
   - [Prisma 文档](https://www.prisma.io/docs)
   - [Telegram Bot API](https://core.telegram.org/bots/api)

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

- 使用 TypeScript 编写类型安全的代码
- 遵循 ESLint 规则
- 为新功能编写测试
- 更新相关文档
- 保持代码简洁和可维护

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](./LICENSE) 文件。

---

## 相关资源

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev/)
- [Vercel 平台](https://vercel.com/)
- [Neon 数据库](https://neon.tech/)
- [Prisma ORM](https://www.prisma.io/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

## 更新日志

### v0.1.0 (2024)

初始版本发布：
- ✅ Bot 配置和 Webhook 管理
- ✅ 双向消息通信
- ✅ 群组管理
- ✅ 安全认证系统
- ✅ 消息历史查询和分页
- ✅ 响应式 Web UI
- ✅ Vercel 部署支持

---

**开发团队**: GoodBot Team  
**最后更新**: 2024  
**文档版本**: 1.0
