# GoodBot 本地开发指南

本文档提供 GoodBot 系统的完整本地开发环境设置和开发工作流程指南。

## 目录

- [前置要求](#前置要求)
- [环境设置](#环境设置)
- [开发工作流](#开发工作流)
- [开发工具](#开发工具)
- [测试](#测试)
- [调试](#调试)
- [常见开发任务](#常见开发任务)
- [最佳实践](#最佳实践)
- [故障排查](#故障排查)

## 前置要求

### 必需软件

在开始之前，请确保已安装以下软件：

#### 1. Node.js

- **版本**: 18.0 或更高
- **推荐**: 使用 LTS 版本（20.x）
- **安装方式**:
  - 官网下载: https://nodejs.org/
  - 使用 nvm: `nvm install 20 && nvm use 20`
  - 使用 Homebrew (macOS): `brew install node@20`

验证安装：
```bash
node --version  # 应该显示 v18.x 或更高
```

#### 2. pnpm

- **版本**: 8.0 或更高
- **安装方式**:
  ```bash
  npm install -g pnpm
  ```
  或使用 Homebrew (macOS):
  ```bash
  brew install pnpm
  ```

验证安装：
```bash
pnpm --version  # 应该显示 8.x 或更高
```

#### 3. Git

- **版本**: 2.x 或更高
- **安装方式**:
  - 官网下载: https://git-scm.com/
  - 使用 Homebrew (macOS): `brew install git`

验证安装：
```bash
git --version
```

### 必需账号和服务

#### 1. Neon PostgreSQL

1. 访问 [Neon Console](https://console.neon.tech)
2. 注册免费账号
3. 创建新项目
4. 复制数据库连接字符串

#### 2. Telegram Bot

1. 在 Telegram 中搜索 [@BotFather](https://t.me/botfather)
2. 发送 `/newbot` 命令
3. 按提示设置 Bot 名称和用户名
4. 保存获得的 Bot Token

### 推荐工具

- **代码编辑器**: VS Code, WebStorm, 或其他支持 TypeScript 的编辑器
- **API 测试**: Postman, Insomnia, 或 curl
- **数据库客户端**: Prisma Studio (内置), pgAdmin, 或 TablePlus

## 环境设置

### 1. 克隆项目

```bash
# 克隆仓库
git clone <your-repo-url>
cd goodbot

# 或使用 SSH
git clone git@github.com:your-username/goodbot.git
cd goodbot
```

### 2. 安装依赖

```bash
# 使用 pnpm 安装所有依赖
pnpm install
```

这将安装：
- Next.js 15 和 React 19
- Prisma ORM
- NextAuth.js v5
- Tailwind CSS 4
- grammy (Telegram SDK)
- 所有其他依赖

### 3. 配置环境变量

#### 创建环境变量文件

```bash
# 复制模板文件
cp .env.example .env.local
```

#### 编辑 .env.local

使用你喜欢的编辑器打开 `.env.local`：

```bash
# 使用 VS Code
code .env.local

# 或使用 nano
nano .env.local

# 或使用 vim
vim .env.local
```

#### 填写环境变量

```env
# ============================================
# Telegram Bot 配置
# ============================================
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_SECRET=generate_random_secret

# ============================================
# 数据库配置
# ============================================
DATABASE_URL=your_neon_postgresql_connection_string

# ============================================
# NextAuth 配置
# ============================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_random_secret

# ============================================
# 管理员凭证
# ============================================
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
```

#### 生成随机密钥

```bash
# 生成 TELEGRAM_WEBHOOK_SECRET (64 位十六进制)
openssl rand -hex 32

# 生成 NEXTAUTH_SECRET (Base64 编码)
openssl rand -base64 32
```

### 4. 设置数据库

#### 生成 Prisma Client

```bash
pnpm prisma:generate
```

这将：
- 读取 `prisma/schema.prisma`
- 生成类型安全的 Prisma Client
- 创建 `node_modules/@prisma/client`

#### 运行数据库迁移

```bash
pnpm prisma:migrate
```

当提示输入迁移名称时，输入描述性名称，如 `init` 或 `initial_schema`。

这将：
- 创建所有数据库表（BotConfig, Message, Group, User）
- 应用索引和约束
- 生成迁移历史

#### 验证数据库设置

```bash
# 打开 Prisma Studio 查看数据库
pnpm prisma:studio
```

在浏览器中打开 http://localhost:5555，你应该看到：
- BotConfig 表（空）
- Message 表（空）
- Group 表（空）
- User 表（空）

### 5. 创建管理员用户

```bash
pnpm create-admin
```

这将使用 `.env.local` 中的 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 创建管理员账号。

验证：
```bash
# 在 Prisma Studio 中查看 User 表
pnpm prisma:studio
```

应该看到一个用户记录。

### 6. 启动开发服务器

```bash
pnpm dev
```

应用将在 http://localhost:3000 启动。

你应该看到：
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Ready in X.Xs
```

### 7. 验证设置

1. 打开浏览器访问 http://localhost:3000
2. 应该看到登录页面
3. 使用管理员凭证登录
4. 应该成功进入仪表板

## 开发工作流

### 日常开发流程

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装新依赖（如果有）
pnpm install

# 3. 运行数据库迁移（如果有新迁移）
pnpm prisma:migrate

# 4. 启动开发服务器
pnpm dev

# 5. 开始开发...

# 6. 运行测试
pnpm test

# 7. 运行代码检查
pnpm lint

# 8. 提交代码
git add .
git commit -m "Your commit message"
git push origin your-branch
```

### 热重载

Next.js 开发服务器支持热重载：

- **页面和组件**: 自动刷新
- **API 路由**: 自动重启
- **样式**: 即时更新
- **环境变量**: 需要重启服务器

重启开发服务器：
```bash
# 按 Ctrl+C 停止
# 然后重新运行
pnpm dev
```

### 分支策略

推荐的 Git 工作流：

```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 开发和提交
git add .
git commit -m "Add feature X"

# 推送到远程
git push origin feature/your-feature-name

# 创建 Pull Request
# 在 GitHub/GitLab 上创建 PR

# 合并后删除本地分支
git checkout main
git pull origin main
git branch -d feature/your-feature-name
```

## 开发工具

### Prisma Studio

可视化数据库管理工具：

```bash
# 启动 Prisma Studio
pnpm prisma:studio
```

功能：
- 查看所有表和数据
- 添加、编辑、删除记录
- 执行过滤和排序
- 查看关系

### VS Code 扩展推荐

创建 `.vscode/extensions.json`：

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### TypeScript 类型检查

```bash
# 运行类型检查
pnpm tsc --noEmit

# 监听模式
pnpm tsc --noEmit --watch
```

### ESLint

```bash
# 运行 linter
pnpm lint

# 自动修复
pnpm lint --fix
```

## 测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式（自动重新运行）
pnpm test:watch

# 使用 UI 界面
pnpm test:ui

# 运行特定测试文件
pnpm test lib/__tests__/security.test.ts

# 运行匹配模式的测试
pnpm test --grep "password"
```

### 编写测试

测试文件位置：
- 单元测试: `lib/__tests__/*.test.ts`
- 组件测试: `components/__tests__/*.test.tsx`
- API 测试: `app/api/**/__tests__/*.test.ts`

示例测试：

```typescript
// lib/__tests__/example.test.ts
import { describe, it, expect } from 'vitest';
import { yourFunction } from '../your-module';

describe('yourFunction', () => {
  it('should do something', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### 测试覆盖率

```bash
# 生成覆盖率报告
pnpm test --coverage

# 查看覆盖率报告
open coverage/index.html
```

## 调试

### VS Code 调试配置

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### 使用 console.log

```typescript
// 在服务器端代码中
console.log('Debug info:', data);

// 在客户端代码中
console.log('Client debug:', data);
```

### 使用 debugger 语句

```typescript
function myFunction() {
  debugger; // 执行会在这里暂停
  // ...
}
```

### 查看日志

开发服务器日志会显示在终端中：
- 请求日志
- 错误信息
- 编译信息

## 常见开发任务

### 添加新的 API 路由

```bash
# 创建新的 API 路由文件
mkdir -p app/api/your-endpoint
touch app/api/your-endpoint/route.ts
```

```typescript
// app/api/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}
```

### 添加新的页面

```bash
# 创建新页面
mkdir -p app/your-page
touch app/your-page/page.tsx
```

```typescript
// app/your-page/page.tsx
export default function YourPage() {
  return (
    <div>
      <h1>Your Page</h1>
    </div>
  );
}
```

### 修改数据库模型

```bash
# 1. 编辑 prisma/schema.prisma
# 添加或修改模型

# 2. 创建迁移
pnpm prisma migrate dev --name your_migration_name

# 3. 生成新的 Prisma Client
pnpm prisma:generate
```

### 添加新的环境变量

```bash
# 1. 在 .env.local 中添加变量
echo "NEW_VARIABLE=value" >> .env.local

# 2. 在 .env.example 中添加说明
echo "NEW_VARIABLE=example_value" >> .env.example

# 3. 重启开发服务器
# Ctrl+C 然后 pnpm dev
```

### 安装新依赖

```bash
# 安装生产依赖
pnpm add package-name

# 安装开发依赖
pnpm add -D package-name

# 安装特定版本
pnpm add package-name@1.2.3
```

### 更新依赖

```bash
# 检查过时的依赖
pnpm outdated

# 更新所有依赖到最新版本
pnpm update

# 更新特定依赖
pnpm update package-name

# 交互式更新
pnpm update -i
```

## 最佳实践

### 代码组织

- **组件**: 放在 `components/` 目录
- **工具函数**: 放在 `lib/` 目录
- **类型定义**: 使用 TypeScript 接口和类型
- **常量**: 集中定义在单独文件中

### TypeScript 使用

```typescript
// 使用接口定义类型
interface User {
  id: string;
  email: string;
  name?: string;
}

// 使用类型别名
type MessageDirection = 'incoming' | 'outgoing';

// 使用泛型
function getData<T>(id: string): Promise<T> {
  // ...
}
```

### 错误处理

```typescript
// API 路由中的错误处理
try {
  const result = await someOperation();
  return NextResponse.json(result);
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### 环境变量访问

```typescript
// 服务器端
const dbUrl = process.env.DATABASE_URL;

// 客户端（需要 NEXT_PUBLIC_ 前缀）
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### Git 提交规范

使用语义化提交消息：

```bash
# 功能
git commit -m "feat: add user profile page"

# 修复
git commit -m "fix: resolve login redirect issue"

# 文档
git commit -m "docs: update README with setup instructions"

# 样式
git commit -m "style: format code with prettier"

# 重构
git commit -m "refactor: simplify message service logic"

# 测试
git commit -m "test: add tests for auth middleware"

# 构建
git commit -m "chore: update dependencies"
```

## 故障排查

### 问题 1: 端口已被占用

**症状**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或使用不同端口
PORT=3001 pnpm dev
```

### 问题 2: 模块未找到

**症状**: `Cannot find module 'xxx'`

**解决方案**:
```bash
# 重新安装依赖
rm -rf node_modules
pnpm install

# 清除 Next.js 缓存
rm -rf .next
pnpm dev
```

### 问题 3: Prisma Client 过期

**症状**: `Prisma Client is outdated`

**解决方案**:
```bash
# 重新生成 Prisma Client
pnpm prisma:generate
```

### 问题 4: 数据库连接失败

**症状**: `Can't reach database server`

**解决方案**:
```bash
# 检查 DATABASE_URL
echo $DATABASE_URL

# 测试连接
pnpm prisma db pull

# 检查 Neon 数据库状态
# 访问 Neon Console
```

### 问题 5: 热重载不工作

**症状**: 修改代码后页面不更新

**解决方案**:
```bash
# 重启开发服务器
# Ctrl+C 然后 pnpm dev

# 清除缓存
rm -rf .next
pnpm dev

# 检查文件监听限制（Linux）
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 问题 6: TypeScript 错误

**症状**: 类型错误或 IDE 提示错误

**解决方案**:
```bash
# 重启 TypeScript 服务器（VS Code）
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"

# 运行类型检查
pnpm tsc --noEmit

# 重新生成类型
pnpm prisma:generate
```

## 相关资源

### 官方文档

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Prisma 文档](https://www.prisma.io/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [NextAuth.js 文档](https://next-auth.js.org/)

### 学习资源

- [Next.js 教程](https://nextjs.org/learn)
- [TypeScript 手册](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Prisma 入门](https://www.prisma.io/docs/getting-started)

### 社区

- [Next.js GitHub](https://github.com/vercel/next.js)
- [Next.js Discord](https://discord.gg/nextjs)
- [Prisma Discord](https://discord.gg/prisma)

---

**准备好开始开发了吗？** 🚀

按照本指南设置好环境后，你就可以开始开发 GoodBot 了。如有问题，请查看故障排查部分或查阅相关文档。

祝开发愉快！
