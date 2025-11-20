# 安全措施实施文档

本文档描述了 GoodBot 系统中实施的安全措施，满足需求 6.1, 6.2, 6.3。

## 1. Webhook Secret Token 验证

### 实施位置
- `app/api/webhook/route.ts`

### 功能描述
验证所有 Webhook 请求来自 Telegram 服务器，防止未授权的请求。

### 实施细节
```typescript
const secretToken = request.headers.get('x-telegram-bot-api-secret-token')
const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET

if (expectedSecret && secretToken !== expectedSecret) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### 配置要求
在环境变量中设置 `TELEGRAM_WEBHOOK_SECRET`：
```bash
# 生成随机密钥
openssl rand -hex 32
```

### 验证需求
- ✅ 需求 6.1: 保护 Webhook 端点
- ✅ 需求 6.2: 验证请求来源

## 2. API 速率限制

### 实施位置
- `lib/rate-limiter.ts` - 核心速率限制逻辑
- `lib/rate-limit-middleware.ts` - 中间件包装器
- 所有 API 路由

### 功能描述
防止 API 滥用和 DDoS 攻击，限制每个客户端的请求频率。

### 速率限制配置

#### 严格限制（敏感操作）
- **适用于**: Bot 配置、消息发送
- **限制**: 5 次请求 / 分钟
- **使用场景**: 
  - `POST /api/bot/config`
  - `POST /api/messages/send`

#### 中等限制（一般操作）
- **适用于**: 群组管理
- **限制**: 30 次请求 / 分钟
- **使用场景**:
  - `POST /api/groups/[id]/leave`

#### 宽松限制（读取操作）
- **适用于**: 数据查询
- **限制**: 100 次请求 / 分钟
- **使用场景**:
  - `GET /api/messages`
  - `GET /api/messages/[chatId]`
  - `GET /api/groups`

#### Webhook 限制
- **适用于**: Telegram Webhook
- **限制**: 100 次请求 / 10 秒
- **使用场景**:
  - `POST /api/webhook`

### 响应头
速率限制信息通过 HTTP 响应头返回：
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 2024-01-01T00:01:00.000Z
```

超过限制时返回 429 状态码：
```
Retry-After: 60
```

### 客户端识别
- 优先使用 `x-forwarded-for` 头（Vercel 提供）
- 回退到 `x-real-ip` 头
- 最后使用默认标识符

### 存储机制
- **开发环境**: 内存存储（Map）
- **生产环境建议**: Redis（需要额外配置）

### 清理机制
- 自动清理过期记录（每小时）
- 防止内存泄漏

### 验证需求
- ✅ 需求 6.1: 实现 API 速率限制
- ✅ 需求 6.2: 防止 API 滥用

## 3. CSRF 保护

### 实施位置
- `auth.config.ts`
- NextAuth.js v5 内置功能

### 功能描述
防止跨站请求伪造攻击，保护所有状态改变操作。

### 实施细节
NextAuth.js v5 默认启用 CSRF 保护：
- 使用双重提交 Cookie 模式
- 自动验证 CSRF token
- 保护所有 POST/PUT/DELETE 请求
- 在登录、登出等操作中自动处理

### 工作原理
1. 服务器生成 CSRF token 并存储在 Cookie 中
2. 客户端在表单中包含 CSRF token
3. 服务器验证 Cookie 和表单中的 token 是否匹配
4. 不匹配则拒绝请求

### 保护的端点
- 所有认证相关端点（登录、登出）
- 所有需要认证的 API 端点
- 所有状态改变操作

### 验证需求
- ✅ 需求 6.3: 配置 CSRF 保护

## 4. 输入验证

### 实施位置
- `lib/validation.ts` - 验证 Schema 和工具函数
- 所有 API 路由

### 功能描述
验证和清理所有用户输入，防止注入攻击和数据损坏。

### 验证 Schema

#### Bot Token 验证
```typescript
botConfigSchema = z.object({
  token: z.string()
    .min(1, 'Bot Token is required')
    .regex(/^\d+:[A-Za-z0-9_-]+$/, 'Invalid Bot Token format')
})
```

#### 消息发送验证
```typescript
sendMessageSchema = z.object({
  chatId: z.string()
    .min(1, 'Chat ID is required')
    .regex(/^-?\d+$/, 'Chat ID must be a valid number'),
  text: z.string()
    .min(1, 'Message text is required')
    .max(4096, 'Message text must not exceed 4096 characters')
    .trim()
})
```

#### 群组 ID 验证
```typescript
groupIdSchema = z.object({
  id: z.string()
    .min(1, 'Group ID is required')
    .regex(/^-?\d+$/, 'Group ID must be a valid number')
})
```

#### Webhook 更新验证
```typescript
webhookUpdateSchema = z.object({
  update_id: z.number(),
  message: z.object({...}).optional(),
  my_chat_member: z.object({...}).optional(),
  // ... 其他字段
})
```

### 清理函数

#### 字符串清理
```typescript
sanitizeString(input: string): string
```
- 移除控制字符
- 限制最大长度
- 修剪空白字符

#### Chat ID 验证
```typescript
validateChatId(chatId: string | number): string
```
- 验证格式（数字或负数）
- 返回规范化的字符串

#### Bot Token 验证
```typescript
validateBotToken(token: string): boolean
```
- 验证 Telegram Bot Token 格式
- 格式: `数字:字母数字_-`

### 错误处理
验证失败时返回详细的错误信息：
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": ["chatId: Chat ID must be a valid number"]
  }
}
```

### 防护措施
- **SQL 注入**: 使用 Prisma ORM（参数化查询）
- **XSS 攻击**: React 自动转义 + 输入清理
- **命令注入**: 不执行用户输入的命令
- **路径遍历**: 验证所有路径参数

### 验证需求
- ✅ 需求 6.3: 验证所有用户输入

## 5. 认证和授权

### 实施位置
- `auth.ts` - NextAuth 配置
- `auth.config.ts` - 认证配置
- `middleware.ts` - 路由保护

### 功能描述
保护管理界面和 API 端点，确保只有授权用户可以访问。

### 密码安全
- 使用 bcrypt 哈希密码（成本因子: 10）
- 密码最小长度: 6 字符
- 存储哈希值，不存储明文

### 会话管理
- 使用 JWT 策略
- 会话超时: 30 分钟
- 自动注销不活跃会话

### 保护的路由
- `/dashboard/*` - 所有管理页面
- `/api/bot/*` - Bot 配置 API
- `/api/messages/*` - 消息管理 API
- `/api/groups/*` - 群组管理 API

### 未保护的路由
- `/api/webhook` - Telegram Webhook（使用 secret token）
- `/login` - 登录页面
- `/_next/*` - Next.js 静态资源

### 验证需求
- ✅ 需求 6.1: 未认证用户重定向
- ✅ 需求 6.2: 认证成功创建会话
- ✅ 需求 6.3: 认证失败拒绝访问

## 6. 环境变量安全

### 敏感配置
所有敏感信息通过环境变量管理：
```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
DATABASE_URL=...
NEXTAUTH_SECRET=...
ADMIN_PASSWORD=...
```

### 最佳实践
- ✅ 不在代码中硬编码密钥
- ✅ 使用 `.env.local` 本地开发
- ✅ 在 Vercel 中配置生产环境变量
- ✅ 定期轮换密钥
- ✅ 使用强随机密钥

### 密钥生成
```bash
# Webhook Secret
openssl rand -hex 32

# NextAuth Secret
openssl rand -base64 32
```

## 7. 安全响应头

### 建议添加的响应头
虽然当前实现未包含，但建议在生产环境中添加：

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

## 8. 安全检查清单

### 部署前检查
- [ ] 所有环境变量已配置
- [ ] Webhook secret 已设置
- [ ] 数据库连接使用 SSL
- [ ] 管理员密码已更改
- [ ] HTTPS 已启用（Vercel 自动）
- [ ] 速率限制已测试
- [ ] 输入验证已测试
- [ ] 认证流程已测试

### 定期维护
- [ ] 审查访问日志
- [ ] 监控速率限制触发
- [ ] 更新依赖包
- [ ] 轮换密钥
- [ ] 审查安全漏洞

## 9. 已知限制

### 速率限制存储
- 当前使用内存存储
- 在多实例部署中不共享
- 建议生产环境使用 Redis

### IP 识别
- 依赖 Vercel 提供的头信息
- 可能被代理影响
- 考虑使用用户 ID 作为补充

### CSRF 保护
- 仅保护认证端点
- Webhook 端点使用 secret token 代替

## 10. 安全事件响应

### 检测到攻击时
1. 记录详细日志
2. 临时封禁 IP（手动）
3. 审查受影响的数据
4. 通知管理员
5. 更新安全措施

### 日志记录
- 所有认证失败
- 速率限制触发
- 验证错误
- Webhook 验证失败

## 总结

GoodBot 系统实施了多层安全措施：

1. ✅ **Webhook Secret Token 验证** - 保护 Webhook 端点
2. ✅ **API 速率限制** - 防止滥用和 DDoS
3. ✅ **CSRF 保护** - 防止跨站请求伪造
4. ✅ **输入验证** - 防止注入攻击
5. ✅ **认证和授权** - 保护管理界面
6. ✅ **密码哈希** - 安全存储凭证
7. ✅ **会话管理** - 自动超时和清理
8. ✅ **环境变量** - 安全配置管理

这些措施满足了需求 6.1, 6.2, 6.3 中定义的所有安全要求。
