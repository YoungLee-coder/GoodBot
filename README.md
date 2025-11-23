# GoodBot

[English](#english) | [中文](#中文)

---

## 中文

GoodBot 是一个基于 Next.js 16 构建的 Telegram 机器人管理系统，集成了现代化的 Web 管理界面。通过直观的仪表盘，轻松管理你的 Telegram Bot，实现与用户的双向通信。

### ✨ 核心功能

- **消息转发系统**：用户发送的消息自动转发给管理员，管理员可直接回复
- **用户管理**：追踪和管理所有与 Bot 互动的用户
- **群组管理**：监控和管理 Bot 加入的 Telegram 群组
- **初始化向导**：首次运行时的友好配置流程，引导设置 Bot Token 和管理员密码
- **数据库驱动配置**：所有配置存储在 PostgreSQL 中，无需复杂的环境变量管理
- **现代化界面**：基于 shadcn/ui 构建的美观、响应式仪表盘

### 🛠️ 技术栈

- **框架**: [Next.js 16](https://nextjs.org/) (App Router) + React 19
- **语言**: TypeScript 5 (严格模式)
- **样式**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI 组件**: [shadcn/ui](https://ui.shadcn.com/) (基于 Radix UI)
- **图标**: Lucide React
- **数据库**: [Neon](https://neon.tech/) (Serverless PostgreSQL)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Bot 框架**: [grammY](https://grammy.dev/)
- **表单验证**: React Hook Form + Zod
- **包管理器**: pnpm

### 🚀 快速开始

#### 前置要求

- Node.js 18 或更高版本
- pnpm 包管理器
- Neon 数据库实例（或其他 PostgreSQL 数据库）
- Telegram Bot Token（从 [@BotFather](https://t.me/botfather) 获取）

#### 安装步骤

1. **克隆项目并安装依赖**

   ```bash
   git clone <repository-url>
   cd goodbot
   pnpm install
   ```

2. **配置环境变量**

   复制 `.env.example` 为 `.env` 并填入数据库连接字符串：

   ```bash
   cp .env.example .env
   ```

   编辑 `.env` 文件，设置 `DATABASE_URL`：
   ```env
   DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
   ```

3. **同步数据库结构**

   将数据表结构推送到数据库：

   ```bash
   pnpm db:push
   ```

4. **启动开发服务器**

   ```bash
   pnpm dev
   ```

5. **完成初始化配置**

   - 在浏览器中访问 [http://localhost:3000](http://localhost:3000)
   - 系统会自动跳转到 `/setup` 初始化页面
   - 输入你的 **Telegram Bot Token** 和设置 **管理员密码**
   - 点击提交完成初始化

6. **在 Telegram 中登录**

   - 在 Telegram 中找到你的 Bot
   - 发送命令：`/login <你设置的密码>`
   - 登录成功后，所有用户消息将转发到你的聊天

### � 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── bot/          # Telegram Webhook 处理器
│   │   ├── chats/        # 聊天和消息接口
│   │   └── setup-webhook/ # Webhook 配置
│   ├── chat/             # 聊天界面页面
│   ├── groups/           # 群组管理页面
│   ├── settings/         # 设置页面 + Server Actions
│   ├── setup/            # 初始化向导 + Actions
│   ├── layout.tsx        # 根布局（含侧边栏）
│   ├── page.tsx          # 仪表盘主页
│   └── globals.css       # 全局样式
├── components/
│   ├── ui/               # shadcn/ui 组件
│   ├── chat/             # 聊天相关组件
│   └── app-sidebar.tsx   # 主导航侧边栏
├── lib/
│   ├── bot/              # Telegram Bot 实例和逻辑
│   ├── db/               # 数据库配置和 Schema
│   │   ├── index.ts     # Drizzle 客户端
│   │   └── schema.ts    # 表定义
│   ├── settings.ts       # 设置辅助函数
│   └── utils.ts          # 工具函数
└── hooks/                # React Hooks
```

### 📝 常用命令

```bash
# 开发
pnpm dev              # 启动开发服务器 (http://localhost:3000)
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器
pnpm lint             # 运行 ESLint 代码检查

# 数据库
pnpm db:push          # 推送 Schema 变更到数据库
pnpm db:studio        # 打开 Drizzle Studio（数据库 GUI）
```

### 🔧 使用说明

#### 管理员工作流

1. 在 Web 界面完成初始化设置
2. 在 Telegram 中使用 `/login <密码>` 登录
3. 用户发送的消息会自动转发到你的 Telegram 聊天
4. 直接回复转发的消息，即可回复给原用户
5. 通过 Web 仪表盘查看统计数据和管理用户/群组

#### Bot 命令

- `/start` - 显示欢迎消息
- `/help` - 显示帮助信息
- `/login <密码>` - 管理员登录（仅管理员）

### 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 📄 许可证

MIT

---

## English

GoodBot is a Telegram bot management system built with Next.js 16, featuring a modern web-based admin interface. Easily manage your Telegram bot and communicate with users through an intuitive dashboard.

### ✨ Key Features

- **Message Forwarding System**: User messages are automatically forwarded to admin; admin can reply directly
- **User Management**: Track and manage all users interacting with your bot
- **Group Management**: Monitor and manage Telegram groups where your bot is active
- **Setup Wizard**: Friendly first-run configuration flow for bot token and admin password
- **Database-Driven Config**: All settings stored in PostgreSQL, no complex environment variable management
- **Modern Interface**: Beautiful, responsive dashboard built with shadcn/ui

### 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) + React 19
- **Language**: TypeScript 5 (strict mode)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **Icons**: Lucide React
- **Database**: [Neon](https://neon.tech/) (Serverless PostgreSQL)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Bot Framework**: [grammY](https://grammy.dev/)
- **Form Validation**: React Hook Form + Zod
- **Package Manager**: pnpm

### 🚀 Quick Start

#### Prerequisites

- Node.js 18 or higher
- pnpm package manager
- Neon database instance (or other PostgreSQL database)
- Telegram Bot Token (obtain from [@BotFather](https://t.me/botfather))

#### Installation Steps

1. **Clone and install dependencies**

   ```bash
   git clone <repository-url>
   cd goodbot
   pnpm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env` and add your database connection string:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file and set `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
   ```

3. **Sync database schema**

   Push the database schema to your database:

   ```bash
   pnpm db:push
   ```

4. **Start development server**

   ```bash
   pnpm dev
   ```

5. **Complete initial setup**

   - Open [http://localhost:3000](http://localhost:3000) in your browser
   - You'll be redirected to the `/setup` initialization page
   - Enter your **Telegram Bot Token** and set an **admin password**
   - Submit to complete initialization

6. **Login in Telegram**

   - Find your bot in Telegram
   - Send command: `/login <your-password>`
   - After successful login, all user messages will be forwarded to your chat

### 📂 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── bot/          # Telegram webhook handler
│   │   ├── chats/        # Chat & message endpoints
│   │   └── setup-webhook/ # Webhook configuration
│   ├── chat/             # Chat interface page
│   ├── groups/           # Group management page
│   ├── settings/         # Settings page + server actions
│   ├── setup/            # Setup wizard + actions
│   ├── layout.tsx        # Root layout with sidebar
│   ├── page.tsx          # Dashboard (main page)
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── chat/             # Chat-specific components
│   └── app-sidebar.tsx   # Main navigation sidebar
├── lib/
│   ├── bot/              # Telegram bot instance & logic
│   ├── db/               # Database config & schema
│   │   ├── index.ts     # Drizzle client
│   │   └── schema.ts    # Table definitions
│   ├── settings.ts       # Settings helper functions
│   └── utils.ts          # Utility functions
└── hooks/                # React hooks
```

### 📝 Common Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio (database GUI)
```

### 🔧 Usage Guide

#### Admin Workflow

1. Complete initial setup in the web interface
2. Login in Telegram using `/login <password>`
3. User messages are automatically forwarded to your Telegram chat
4. Reply to forwarded messages to respond to the original user
5. View statistics and manage users/groups through the web dashboard

#### Bot Commands

- `/start` - Show welcome message
- `/help` - Show help information
- `/login <password>` - Admin login (admin only)

### 🤝 Contributing

Issues and Pull Requests are welcome!

### 📄 License

MIT
