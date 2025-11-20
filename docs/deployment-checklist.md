# 部署检查清单

使用此清单确保 GoodBot 正确部署到 Vercel。

## 部署前检查

### 代码准备

- [ ] 所有代码已提交到 Git 仓库
- [ ] `.env.local` 和 `.env` 已添加到 `.gitignore`
- [ ] `package.json` 包含正确的构建脚本
- [ ] `vercel.json` 配置文件已创建
- [ ] Prisma schema 包含 `url = env("DATABASE_URL")`

### 数据库准备

- [ ] Neon PostgreSQL 数据库已创建
- [ ] 数据库连接字符串已获取
- [ ] 数据库迁移文件已准备（`prisma/migration.sql`）

### Telegram Bot 准备

- [ ] 已从 @BotFather 创建 Bot
- [ ] 已获取 Bot Token
- [ ] 已生成 Webhook Secret（`openssl rand -hex 32`）

### 认证准备

- [ ] 已生成 NextAuth Secret（`openssl rand -base64 32`）
- [ ] 已准备管理员邮箱和密码

## Vercel 配置检查

### 项目导入

- [ ] 项目已导入到 Vercel
- [ ] 框架预设为 Next.js
- [ ] 构建命令: `pnpm prisma generate && pnpm build`
- [ ] 安装命令: `pnpm install`

### 环境变量配置

在 Vercel Dashboard 的 Settings > Environment Variables 中添加：

- [ ] `DATABASE_URL` - Neon PostgreSQL 连接字符串
- [ ] `TELEGRAM_BOT_TOKEN` - Telegram Bot Token
- [ ] `TELEGRAM_WEBHOOK_SECRET` - Webhook 验证密钥
- [ ] `NEXTAUTH_URL` - 应用 URL（如 `https://your-app.vercel.app`）
- [ ] `NEXTAUTH_SECRET` - NextAuth JWT 密钥
- [ ] `ADMIN_EMAIL` - 管理员邮箱
- [ ] `ADMIN_PASSWORD` - 管理员密码

### 环境变量验证

```bash
# 验证所有变量已设置
vercel env ls
```

应该看到所有 7 个环境变量。

## 部署检查

### 首次部署

- [ ] 点击 "Deploy" 按钮
- [ ] 等待构建完成（约 2-3 分钟）
- [ ] 构建成功，无错误
- [ ] 获取部署 URL

### 构建日志检查

查看构建日志，确认：

- [ ] `pnpm install` 成功
- [ ] `prisma generate` 成功
- [ ] `next build` 成功
- [ ] 无错误或警告

## 部署后配置

### 数据库迁移

选择一种方法运行迁移：

#### 方法 1: Prisma CLI
```bash
vercel env pull .env.production
pnpm prisma migrate deploy
```

- [ ] 迁移命令执行成功
- [ ] 所有表已创建

#### 方法 2: Neon Console
- [ ] 在 Neon SQL Editor 中执行 `prisma/migration.sql`
- [ ] 验证表结构正确

### 数据库验证

```bash
# 检查表是否存在
pnpm prisma studio
```

应该看到：
- [ ] BotConfig 表
- [ ] Message 表
- [ ] Group 表
- [ ] User 表

### 创建管理员用户

```bash
vercel env pull .env.production
pnpm create-admin
```

- [ ] 管理员用户创建成功
- [ ] 可以使用凭证登录

### Telegram Webhook 配置

#### 自动配置（推荐）
- [ ] 访问 `https://your-app.vercel.app/login`
- [ ] 使用管理员凭证登录
- [ ] 进入 `/dashboard/config`
- [ ] 输入 Bot Token
- [ ] 点击保存
- [ ] 看到 "Webhook 设置成功" 消息

#### 手动配置
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.vercel.app/api/webhook",
    "secret_token": "<SECRET>"
  }'
```

- [ ] 返回 `{"ok": true}`

### Webhook 验证

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

验证：
- [ ] `url` 正确指向你的应用
- [ ] `has_custom_certificate` 为 `false`
- [ ] `pending_update_count` 为 `0`
- [ ] 无错误信息

## 功能测试

### 应用访问测试

- [ ] 访问 `https://your-app.vercel.app`
- [ ] 看到登录页面
- [ ] 页面样式正确加载

### 认证测试

- [ ] 使用管理员凭证登录
- [ ] 成功进入仪表板
- [ ] 看到 Bot 配置、消息、群组菜单

### Bot 配置测试

- [ ] 进入 `/dashboard/config`
- [ ] 看到 Bot 信息（用户名、ID）
- [ ] Webhook 状态显示为 "已设置"

### 消息接收测试

1. 在 Telegram 中找到你的 Bot
2. 发送测试消息: "Hello Bot"
3. 在管理界面检查：
   - [ ] 进入 `/dashboard/messages`
   - [ ] 看到收到的消息
   - [ ] 消息内容正确
   - [ ] 发送者信息正确
   - [ ] 时间戳正确

### 消息发送测试

1. 在管理界面点击消息
2. 点击 "回复" 按钮
3. 输入回复内容
4. 点击发送
5. 验证：
   - [ ] 看到 "发送成功" 提示
   - [ ] 在 Telegram 中收到回复
   - [ ] 消息内容正确

### 群组测试（如果适用）

1. 将 Bot 添加到测试群组
2. 在管理界面检查：
   - [ ] 进入 `/dashboard/groups`
   - [ ] 看到新加入的群组
   - [ ] 群组信息正确（名称、成员数）
3. 在群组中发送消息
4. 验证：
   - [ ] 管理界面收到群组消息
   - [ ] 可以在管理界面回复群组

## 性能和监控

### 响应时间测试

- [ ] 登录响应时间 < 2 秒
- [ ] 消息列表加载 < 1 秒
- [ ] Webhook 响应时间 < 500ms

### 日志检查

在 Vercel Dashboard 查看日志：
- [ ] 无错误日志
- [ ] Webhook 请求正常记录
- [ ] 数据库查询正常

### 数据库性能

在 Neon Console 检查：
- [ ] 连接数正常
- [ ] 查询响应时间正常
- [ ] 无慢查询

## 安全检查

### 环境变量安全

- [ ] 所有密钥都是随机生成的
- [ ] 密钥长度足够（至少 32 字符）
- [ ] 环境变量未暴露在代码中
- [ ] `.env` 文件已添加到 `.gitignore`

### 认证安全

- [ ] 管理员密码足够强
- [ ] 会话超时设置正确（30 分钟）
- [ ] 未认证用户无法访问管理页面

### Webhook 安全

- [ ] Webhook Secret 已设置
- [ ] Webhook 请求验证正常工作
- [ ] 只接受来自 Telegram 的请求

## 文档和备份

### 文档

- [ ] README.md 包含部署说明
- [ ] 环境变量已记录
- [ ] 故障排查指南已准备

### 备份

- [ ] Neon 自动备份已启用
- [ ] 环境变量已安全保存
- [ ] 数据库连接字符串已备份

## 可选配置

### 自定义域名

如果使用自定义域名：
- [ ] 域名已添加到 Vercel
- [ ] DNS 记录已配置
- [ ] SSL 证书已自动配置
- [ ] `NEXTAUTH_URL` 已更新为自定义域名
- [ ] Telegram Webhook 已更新为新域名

### 监控和告警

- [ ] Vercel Analytics 已启用
- [ ] 错误告警已配置
- [ ] 性能监控已设置

### CI/CD

- [ ] GitHub Actions 已配置（如果使用）
- [ ] 自动部署已测试
- [ ] 部署通知已设置

## 最终验证

### 端到端测试

完整流程测试：
1. [ ] 用户发送消息到 Bot
2. [ ] 管理员在界面看到消息
3. [ ] 管理员回复消息
4. [ ] 用户收到回复
5. [ ] 所有数据正确存储

### 压力测试（可选）

- [ ] 发送多条消息测试
- [ ] 并发请求测试
- [ ] 大量数据查询测试

### 回滚计划

- [ ] 知道如何回滚到上一个版本
- [ ] 数据库备份可用
- [ ] 回滚步骤已记录

## 部署完成

- [ ] 所有检查项已完成
- [ ] 应用正常运行
- [ ] 用户可以正常使用
- [ ] 监控和告警已设置
- [ ] 文档已更新

## 后续维护

### 定期检查（每周）

- [ ] 检查应用日志
- [ ] 验证 Webhook 正常工作
- [ ] 检查数据库性能
- [ ] 查看错误率

### 定期维护（每月）

- [ ] 更新依赖包
- [ ] 检查安全漏洞
- [ ] 清理旧数据
- [ ] 验证备份

### 安全审计（每季度）

- [ ] 轮换密钥
- [ ] 审查访问日志
- [ ] 更新密码
- [ ] 检查权限设置

---

## 故障排查快速参考

### 构建失败
```bash
# 检查构建日志
vercel logs <deployment-url>

# 本地测试构建
pnpm build
```

### 数据库连接失败
```bash
# 测试数据库连接
pnpm prisma db pull

# 验证环境变量
vercel env ls
```

### Webhook 不工作
```bash
# 检查 Webhook 状态
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# 测试 Webhook 端点
curl https://your-app.vercel.app/api/webhook
```

### 认证失败
```bash
# 重新创建管理员
pnpm create-admin

# 检查环境变量
echo $NEXTAUTH_SECRET
```

---

**部署日期**: ___________  
**部署人员**: ___________  
**应用 URL**: ___________  
**备注**: ___________
