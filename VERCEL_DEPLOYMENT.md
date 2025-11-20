# GoodBot Vercel 部署指南

## 前置准备

### 1. 确保你有以下账号
- ✅ GitHub 账号
- ✅ Vercel 账号（可以用 GitHub 登录）
- ✅ Neon 数据库（已配置）
- ✅ Telegram Bot Token（已获取）

### 2. 准备工作
```bash
# 确保所有更改已保存
git status

# 如果有未提交的更改，先提交
git add .
git commit -m "Ready for deployment"
```

---

## 步骤 1: 推送代码到 GitHub

### 1.1 创建 GitHub 仓库
1. 访问 https://github.com/new
2. 仓库名称：`goodbot`（或你喜欢的名字）
3. 设置为 **Private**（推荐，因为包含配置）
4. **不要**初始化 README、.gitignore 或 license
5. 点击 "Create repository"

### 1.2 推送代码
```bash
# 如果还没有初始化 git
git init

# 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/goodbot.git

# 推送代码
git branch -M main
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## 步骤 2: 在 Vercel 创建项目

### 2.1 导入项目
1. 访问 https://vercel.com
2. 点击 "Add New..." → "Project"
3. 选择 "Import Git Repository"
4. 找到你的 `goodbot` 仓库，点击 "Import"

### 2.2 配置项目
**Framework Preset**: Next.js（自动检测）
**Root Directory**: `./`（默认）
**Build Command**: `pnpm build`（自动检测）
**Output Directory**: `.next`（自动检测）

---

## 步骤 3: 配置环境变量

在 Vercel 项目设置中，添加以下环境变量：

### 3.1 数据库配置
```bash
# 从你的 Neon 控制台复制
DATABASE_URL=postgresql://neondb_owner:npg_3dMJn5mgqcpb@ep-aged-hall-a192f0rb-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Direct URL（用于迁移）
DIRECT_URL=postgresql://neondb_owner:npg_3dMJn5mgqcpb@ep-aged-hall-a192f0rb.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### 3.2 Telegram Bot 配置
```bash
TELEGRAM_BOT_TOKEN=8570964953:AAFSA7eu7CfMDpbKfoei8_q7ZvtxBgKwuSk

# 生成一个随机密钥（用于 webhook 验证）
TELEGRAM_WEBHOOK_SECRET=your_random_secret_here
```

### 3.3 NextAuth 配置
```bash
# 你的 Vercel 部署 URL（部署后会知道）
# 先留空，部署后再填
NEXTAUTH_URL=https://your-project.vercel.app

# 生成一个随机密钥
# 在本地运行: openssl rand -base64 32
NEXTAUTH_SECRET=your_generated_secret_here

# 信任主机
AUTH_TRUST_HOST=true
```

### 3.4 管理员凭证
```bash
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
```

### 3.5 如何添加环境变量
1. 在 Vercel 项目页面，点击 "Settings"
2. 点击左侧 "Environment Variables"
3. 逐个添加上述变量
4. 确保选择 "Production", "Preview", "Development" 三个环境

---

## 步骤 4: 部署项目

### 4.1 首次部署
1. 添加完环境变量后，点击 "Deploy"
2. 等待构建完成（约 2-3 分钟）
3. 部署成功后，你会看到部署 URL

### 4.2 更新 NEXTAUTH_URL
1. 复制你的部署 URL（例如：`https://goodbot-abc123.vercel.app`）
2. 回到 "Settings" → "Environment Variables"
3. 找到 `NEXTAUTH_URL`，点击编辑
4. 填入你的部署 URL
5. 点击 "Save"
6. 触发重新部署：点击 "Deployments" → 最新部署旁的 "..." → "Redeploy"

---

## 步骤 5: 初始化数据库（自动）

### 🎉 新功能：自动初始化

部署完成后，首次访问应用时会**自动检测并初始化数据库**！

**使用方法：**
1. 部署完成后，访问 `https://your-project.vercel.app/setup`
2. 系统会自动：
   - ✅ 检测数据库是否已初始化
   - ✅ 创建所有必需的表
   - ✅ 创建默认管理员用户
3. 初始化完成后自动跳转到登录页面

**就这么简单！无需手动运行任何命令。**

---

### 手动初始化（可选）

如果你更喜欢手动控制，也可以使用以下方法：

## 步骤 5 (备选): 手动初始化数据库

### 选项 A: 新数据库（推荐 - 最简单）

如果你在 Vercel 使用**新的 Neon 数据库**：

1. **在 Neon 创建新数据库**
   - 访问 https://console.neon.tech
   - 创建新项目（或使用现有项目的新数据库）
   - 复制连接字符串

2. **在 Vercel 配置环境变量**
   - 使用新数据库的连接字符串
   - 确保 `DATABASE_URL` 和 `DIRECT_URL` 都已设置

3. **部署后自动初始化**
   - 首次访问应用时，运行初始化脚本
   - 或者使用 Vercel 的 Serverless Function

4. **创建数据库表和管理员**
   ```bash
   # 方法 1: 使用 Vercel CLI
   npm i -g vercel
   vercel login
   vercel link
   
   # 拉取生产环境变量
   vercel env pull .env.production
   
   # 运行初始化脚本
   pnpm tsx scripts/run-migration.ts
   pnpm tsx scripts/create-admin.ts
   ```
   
   ```bash
   # 方法 2: 直接在本地运行（连接生产数据库）
   # 临时设置环境变量
   $env:DIRECT_URL="your_production_direct_url"
   
   # 初始化数据库
   pnpm tsx scripts/run-migration.ts
   pnpm tsx scripts/create-admin.ts
   ```

### 选项 B: 使用现有数据库

如果你想使用**本地开发时的数据库**（已有数据）：

```bash
# 不需要做任何事情！
# 只需在 Vercel 配置相同的 DATABASE_URL
# 所有表和数据都已经存在
```

### 选项 C: 使用 Prisma Migrate（传统方式）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并链接项目
vercel login
vercel link

# 拉取环境变量
vercel env pull .env.production

# 运行迁移
pnpm prisma migrate deploy

# 创建管理员用户
pnpm tsx scripts/create-admin.ts
```

---

## 步骤 6: 配置 Telegram Webhook

### 6.1 访问你的应用
1. 打开 `https://your-project.vercel.app`
2. 使用管理员账号登录
3. 进入 "Bot 配置" 页面

### 6.2 保存 Bot Token
1. 输入你的 Telegram Bot Token
2. 点击 "保存配置"
3. 系统会自动设置 Webhook 到 `https://your-project.vercel.app/api/webhook`

### 6.3 验证 Webhook
在浏览器访问：
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

应该看到：
```json
{
  "ok": true,
  "result": {
    "url": "https://your-project.vercel.app/api/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

---

## 步骤 7: 测试 Bot

### 7.1 发送测试消息
1. 在 Telegram 中找到你的 Bot
2. 发送 `/start` 或任何消息
3. 在 Dashboard 的 "消息列表" 中应该能看到

### 7.2 测试群组功能
1. 将 Bot 添加到一个测试群组
2. 在 Dashboard 的 "群组管理" 中应该能看到

---

## 常见问题

### Q1: 部署失败，显示构建错误
**A**: 检查以下内容：
- 所有环境变量是否正确设置
- `package.json` 中的依赖是否完整
- 运行 `pnpm install` 确保本地也能构建

### Q2: 登录后显示 404
**A**: 确保 `NEXTAUTH_URL` 设置正确，并重新部署

### Q3: Bot 收不到消息
**A**: 检查：
1. Webhook 是否正确设置（使用 getWebhookInfo）
2. `TELEGRAM_WEBHOOK_SECRET` 是否在环境变量中
3. 查看 Vercel 的 Functions 日志

### Q4: 数据库连接错误
**A**: 
1. 确认 `DATABASE_URL` 格式正确
2. 确认 Neon 数据库允许外部连接
3. 检查是否运行了数据库迁移

### Q5: 如何查看日志
**A**: 
1. 在 Vercel 项目页面
2. 点击 "Deployments" → 选择部署
3. 点击 "Functions" 查看运行日志

---

## 部署后的维护

### 更新代码
```bash
# 本地修改代码后
git add .
git commit -m "Update feature"
git push

# Vercel 会自动检测并重新部署
```

### 查看实时日志
```bash
# 使用 Vercel CLI
vercel logs --follow
```

### 回滚到之前的版本
1. 在 Vercel Dashboard 的 "Deployments" 页面
2. 找到之前的成功部署
3. 点击 "..." → "Promote to Production"

---

## 安全建议

1. ✅ 使用强密码作为 `ADMIN_PASSWORD`
2. ✅ 定期更换 `NEXTAUTH_SECRET`
3. ✅ 不要在公开仓库中提交 `.env.local`
4. ✅ 使用 Vercel 的环境变量管理
5. ✅ 定期检查 Vercel 的安全日志

---

## 成功部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] Vercel 项目已创建
- [ ] 所有环境变量已配置
- [ ] 首次部署成功
- [ ] `NEXTAUTH_URL` 已更新
- [ ] 数据库迁移已运行
- [ ] 管理员用户已创建
- [ ] 可以成功登录
- [ ] Bot Token 已保存
- [ ] Webhook 已设置
- [ ] 可以接收 Telegram 消息

---

## 需要帮助？

如果遇到问题：
1. 查看 Vercel 部署日志
2. 查看 Vercel Functions 日志
3. 检查环境变量配置
4. 确认数据库连接正常

祝部署顺利！🚀
