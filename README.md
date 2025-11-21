# GoodBot

GoodBot 是一个基于 Next.js 15 构建的 Telegram 机器人管理系统，集成了 WebUI 管理界面。项目旨在提供一个现代化、易于管理的 Bot 解决方案。

## ✨ 特性

-   **双向聊天**：通过 WebUI 与 Telegram 用户实时交流（开发中）。
-   **群组管理**：管理 Bot 所在的群组（开发中）。
-   **WebUI 管理**：基于 shadcn/ui 的现代化仪表盘。
-   **初始化向导**：首次运行自动引导配置 Bot Token 和管理员密码。
-   **配置持久化**：关键配置（如 Token）存储在数据库中，减少环境变量依赖。

## 🛠️ 技术栈

-   **框架**: [Next.js 15](https://nextjs.org/) (App Router)
-   **样式**: [Tailwind CSS 4](https://tailwindcss.com/)
-   **UI 组件**: [shadcn/ui](https://ui.shadcn.com/)
-   **数据库**: [Neon](https://neon.tech/) (PostgreSQL)
-   **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
-   **Bot 框架**: [grammY](https://grammy.dev/)
-   **包管理器**: pnpm

## 🚀 快速开始

### 前置要求

-   Node.js 18+
-   pnpm
-   一个 Neon 数据库实例
-   Telegram Bot Token (从 @BotFather 获取)

### 安装步骤

1.  **克隆项目并安装依赖**

    ```bash
    git clone <repository-url>
    cd goodbot
    pnpm install
    ```

2.  **配置环境变量**

    复制 `.env.example` 为 `.env` 并填入你的数据库连接字符串：

    ```bash
    cp .env.example .env
    ```

    在 `.env` 中设置 `DATABASE_URL`：
    ```env
    DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
    ```

3.  **同步数据库结构**

    将数据表结构推送到 Neon 数据库：

    ```bash
    pnpm db:push
    ```

4.  **启动开发服务器**

    ```bash
    pnpm dev
    ```

5.  **初始化配置**

    -   打开浏览器访问 [http://localhost:3000](http://localhost:3000)。
    -   系统会自动跳转到 `/setup` 初始化页面。
    -   输入你的 **Telegram Bot Token** 和设置 **管理员密码**。
    -   点击初始化完成设置。

## 📂 项目结构

```
src/
├── app/                # Next.js App Router 页面
│   ├── api/            # API 路由 (Webhook 等)
│   ├── setup/          # 初始化页面
│   └── page.tsx        # 仪表盘主页
├── components/         # React 组件
│   └── ui/             # shadcn/ui 组件
├── lib/                # 工具库
│   ├── bot/            # Telegram Bot 实例与逻辑
│   ├── db/             # Drizzle ORM 配置与 Schema
│   └── settings.ts     # 设置管理工具
```

## 📝 脚本命令

-   `pnpm dev`: 启动开发服务器
-   `pnpm build`: 构建生产版本
-   `pnpm start`: 启动生产服务器
-   `pnpm lint`: 代码检查
-   `pnpm db:push`: 推送数据库结构变更
-   `pnpm db:studio`: 打开 Drizzle Studio 数据库管理界面

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT
