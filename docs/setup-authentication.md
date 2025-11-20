# 认证系统设置指南

## 快速开始

### 1. 配置环境变量

创建 `.env.local` 文件：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 并填入实际值：

```env
# 数据库连接（从 Neon 获取）
DATABASE_URL=postgresql://user:password@host/database

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret_here

# 管理员账号
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
```

### 2. 生成 NEXTAUTH_SECRET

```bash
# 使用 OpenSSL
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. 运行数据库迁移

```bash
pnpm prisma:migrate
```

### 4. 创建管理员账号

```bash
pnpm create-admin
```

这将使用 `.env.local` 中的 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 创建管理员用户。

### 5. 启动开发服务器

```bash
pnpm dev
```

### 6. 访问应用

打开浏览器访问：
- 登录页面: http://localhost:3000/login
- 仪表板: http://localhost:3000/dashboard

使用创建的管理员账号登录。

## 生产环境部署

### Vercel 环境变量

在 Vercel 项目设置中添加以下环境变量：

1. `DATABASE_URL` - Neon 数据库连接字符串
2. `NEXTAUTH_URL` - 生产环境 URL（如 https://your-app.vercel.app）
3. `NEXTAUTH_SECRET` - 生成的随机密钥
4. `ADMIN_EMAIL` - 管理员邮箱
5. `ADMIN_PASSWORD` - 管理员密码

### 部署后初始化

部署后，需要创建管理员账号：

1. 在 Vercel 项目中，进入 "Settings" > "Functions"
2. 或者通过 Vercel CLI 运行：
   ```bash
   vercel env pull .env.production.local
   pnpm create-admin
   ```

## 常见问题

### Q: 忘记管理员密码怎么办？

A: 重新运行 `pnpm create-admin` 脚本，它会检查用户是否存在。如果需要重置密码，可以直接在数据库中更新：

```typescript
// 使用 Prisma Studio
pnpm prisma:studio

// 或创建重置脚本
import { prisma } from './lib/prisma';
import { hashPassword } from './lib/password';

const newPassword = await hashPassword('new_password');
await prisma.user.update({
  where: { email: 'admin@example.com' },
  data: { password: newPassword }
});
```

### Q: 会话超时时间可以修改吗？

A: 可以。在 `auth.config.ts` 中修改：

```typescript
session: {
  strategy: "jwt",
  maxAge: 60 * 60, // 改为 60 分钟
}
```

### Q: 如何添加更多管理员？

A: 可以通过以下方式：

1. 修改 `scripts/create-admin.ts` 接受命令行参数
2. 使用 Prisma Studio 直接在数据库中创建
3. 创建一个管理界面用于用户管理（后续功能）

### Q: 数据库连接错误怎么办？

A: 检查以下几点：

1. `DATABASE_URL` 格式正确
2. Neon 数据库正在运行
3. 网络连接正常
4. 数据库凭证有效

### Q: 登录后立即被登出？

A: 可能的原因：

1. `NEXTAUTH_SECRET` 未设置或在不同环境中不一致
2. `NEXTAUTH_URL` 配置错误
3. Cookie 设置问题（检查浏览器设置）

## 安全建议

1. ✅ 使用强密码（至少 12 位，包含大小写字母、数字和特殊字符）
2. ✅ 定期更换 `NEXTAUTH_SECRET`
3. ✅ 不要在代码中硬编码密码
4. ✅ 使用 HTTPS（生产环境）
5. ✅ 定期更新依赖包
6. ✅ 启用数据库备份

## 下一步

认证系统已就绪，可以继续实现：

- Task 5: Webhook 处理器
- Task 6: 消息服务
- Task 7: 群组服务
- Task 8: Bot 配置 API 路由

查看 `.kiro/specs/goodbot/tasks.md` 了解完整的实施计划。
