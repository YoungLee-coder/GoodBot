# 认证系统文档

## 概述

GoodBot 使用 NextAuth.js v5 (Auth.js) 实现基于会话的身份验证系统。

## 功能特性

- ✅ 邮箱密码登录（Credentials Provider）
- ✅ 密码哈希（bcrypt，10 轮加密）
- ✅ 会话管理（JWT，30 分钟超时）
- ✅ 路由保护（中间件自动重定向）
- ✅ 登出功能

## 环境变量配置

在 `.env` 文件中配置以下变量：

```env
# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here

# 管理员账号（用于初始化）
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
```

生成 NEXTAUTH_SECRET：
```bash
openssl rand -base64 32
```

## 初始化管理员账号

运行以下命令创建初始管理员账号：

```bash
pnpm create-admin
```

这将使用环境变量中的 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 创建管理员用户。

## 受保护的路由

以下路由需要认证：
- `/dashboard/*` - 所有仪表板页面
- `/api/bot/*` - Bot 配置 API
- `/api/messages/*` - 消息管理 API
- `/api/groups/*` - 群组管理 API

未认证用户访问这些路由将被重定向到 `/login`。

## 会话配置

- **策略**: JWT
- **超时时间**: 30 分钟无活动后自动注销
- **刷新**: 每次请求自动刷新会话

## 密码安全

- 使用 bcrypt 进行密码哈希
- 加密轮数: 10
- 最小密码长度: 6 个字符
- 密码永不以明文存储

## 使用示例

### 在服务器组件中获取会话

```typescript
import { auth } from "@/auth";

export default async function Page() {
  const session = await auth();
  
  if (!session?.user) {
    // 用户未登录
  }
  
  return <div>Welcome {session.user.email}</div>;
}
```

### 在客户端组件中登出

```typescript
"use client";

import { logout } from "@/lib/auth-actions";

export default function LogoutButton() {
  return (
    <button onClick={() => logout()}>
      登出
    </button>
  );
}
```

### 在 API 路由中验证

```typescript
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // 处理请求
}
```

## 架构说明

### 文件结构

```
├── auth.ts                    # NextAuth 主配置
├── auth.config.ts             # 认证配置（授权回调）
├── middleware.ts              # 路由保护中间件
├── lib/
│   ├── auth-actions.ts        # 服务器操作（登录/登出）
│   └── password.ts            # 密码哈希工具
├── app/
│   ├── login/
│   │   └── page.tsx          # 登录页面
│   ├── dashboard/
│   │   ├── layout.tsx        # 仪表板布局（包含导航和登出）
│   │   └── page.tsx          # 仪表板主页
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts  # NextAuth API 路由
└── components/
    └── logout-button.tsx     # 登出按钮组件
```

### 认证流程

1. **登录流程**:
   - 用户访问 `/login`
   - 输入邮箱和密码
   - 表单提交到 `authenticate` 服务器操作
   - NextAuth 验证凭证（查询数据库，比对密码）
   - 成功后创建 JWT 会话
   - 重定向到 `/dashboard`

2. **授权检查**:
   - 用户访问受保护路由
   - 中间件检查会话
   - 有效会话：允许访问
   - 无效会话：重定向到 `/login`

3. **登出流程**:
   - 用户点击登出按钮
   - 调用 `logout` 服务器操作
   - NextAuth 清除会话
   - 重定向到 `/login`

## 安全考虑

1. **密码存储**: 使用 bcrypt 哈希，永不存储明文
2. **会话安全**: JWT 使用 NEXTAUTH_SECRET 签名
3. **CSRF 保护**: NextAuth 内置 CSRF 保护
4. **会话超时**: 30 分钟无活动自动注销
5. **路由保护**: 中间件自动保护所有管理路由

## 验证需求

该实现满足以下需求：

- ✅ **需求 6.1**: 未认证用户重定向到登录页面
- ✅ **需求 6.2**: 正确凭证创建会话并允许访问
- ✅ **需求 6.3**: 30 分钟会话超时
- ✅ **需求 6.4**: 错误凭证显示错误并阻止访问
- ✅ **需求 6.5**: 登出清除会话并返回登录页面
