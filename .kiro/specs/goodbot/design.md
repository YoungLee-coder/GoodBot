# GoodBot 设计文档

## 概述

GoodBot 是一个基于 Next.js 14+ 的 Telegram Bot 管理系统，采用 App Router 架构。系统通过 Webhook 接收 Telegram 消息更新，使用 Neon PostgreSQL 存储数据，并提供 Web 界面进行管理。系统部署在 Vercel 平台，利用其无服务器架构实现自动扩展。

核心功能包括：
- Bot 配置和 Webhook 管理
- 双向消息通信（接收和发送）
- 群组管理和群组消息处理
- 基于会话的身份验证
- 消息历史查询和分页

## 架构

### 系统架构图

```mermaid
graph TB
    subgraph "Telegram"
        TG[Telegram Servers]
    end
    
    subgraph "Vercel 部署"
        subgraph "Next.js App"
            WH[Webhook API Route]
            API[Management API Routes]
            UI[Web UI Pages]
            AUTH[Auth Middleware]
        end
    end
    
    subgraph "数据层"
        DB[(Neon PostgreSQL)]
    end
    
    TG -->|Webhook POST| WH
    WH -->|存储消息| DB
    API -->|CRUD 操作| DB
    UI -->|调用| API
    AUTH -->|验证| UI
    API -->|发送消息| TG
    
    Admin[管理员] -->|访问| UI
```

### 技术栈

- **前端框架**: Next.js 15 (App Router)
- **UI 库**: React 19+
- **语言**: TypeScript
- **包管理**: pnpm
- **样式**: Tailwind CSS 4
- **UI 组件**: shadcn/ui
- **数据库**: Neon PostgreSQL
- **ORM**: Prisma
- **部署**: Vercel
- **认证**: NextAuth.js v5 (Auth.js)
- **Telegram SDK**: grammy

## 组件和接口

### 1. Webhook 处理器

**职责**: 接收 Telegram 服务器推送的消息更新

**接口**:
```typescript
// app/api/webhook/route.ts
POST /api/webhook
Request Body: TelegramUpdate
Response: { ok: boolean }
```

**核心逻辑**:
- 验证请求来自 Telegram（可选：使用 secret token）
- 解析消息类型（私聊消息、群组消息、Bot 加入群组等）
- 存储消息到数据库
- 返回 200 响应

### 2. Bot 配置服务

**职责**: 管理 Bot Token 和 Webhook 设置

**接口**:
```typescript
interface BotConfigService {
  saveBotToken(token: string): Promise<BotConfig>
  getBotInfo(): Promise<TelegramBotInfo>
  setupWebhook(url: string): Promise<boolean>
  deleteWebhook(): Promise<boolean>
}
```

**API 路由**:
```typescript
POST /api/bot/config - 保存 Bot 配置
GET /api/bot/info - 获取 Bot 信息
POST /api/bot/webhook - 设置 Webhook
```

### 3. 消息服务

**职责**: 处理消息的接收、存储、查询和发送

**接口**:
```typescript
interface MessageService {
  saveIncomingMessage(update: TelegramUpdate): Promise<Message>
  getMessages(filters: MessageFilters, pagination: Pagination): Promise<PaginatedMessages>
  getConversation(chatId: string, pagination: Pagination): Promise<PaginatedMessages>
  sendMessage(chatId: string, text: string): Promise<Message>
}
```

**API 路由**:
```typescript
GET /api/messages - 获取消息列表（支持分页和过滤）
GET /api/messages/[chatId] - 获取特定对话
POST /api/messages/send - 发送消息
```

### 4. 群组服务

**职责**: 管理 Bot 加入的群组

**接口**:
```typescript
interface GroupService {
  saveGroup(groupInfo: TelegramChat): Promise<Group>
  getGroups(): Promise<Group[]>
  getGroupDetails(groupId: string): Promise<GroupDetails>
  leaveGroup(groupId: string): Promise<boolean>
  updateGroupInfo(groupId: string): Promise<Group>
}
```

**API 路由**:
```typescript
GET /api/groups - 获取群组列表
GET /api/groups/[id] - 获取群组详情
POST /api/groups/[id]/leave - 退出群组
GET /api/groups/[id]/messages - 获取群组消息
```

### 5. 认证中间件

**职责**: 保护管理界面和 API 路由

**实现**:
```typescript
// 使用 NextAuth.js
// middleware.ts
export { default } from "next-auth/middleware"
export const config = { 
  matcher: ["/dashboard/:path*", "/api/bot/:path*", "/api/messages/:path*", "/api/groups/:path*"] 
}
```

### 6. Web UI 页面

**页面结构**:
```
/login - 登录页面
/dashboard - 仪表板（概览）
/dashboard/config - Bot 配置
/dashboard/messages - 消息列表
/dashboard/messages/[chatId] - 对话详情
/dashboard/groups - 群组列表
/dashboard/groups/[id] - 群组详情
```

## 数据模型

### Prisma Schema

```prisma
// prisma/schema.prisma

model BotConfig {
  id        String   @id @default(cuid())
  token     String   @unique
  username  String
  botId     String   @unique
  webhookUrl String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Message {
  id          String   @id @default(cuid())
  messageId   String   // Telegram message ID
  chatId      String   // Telegram chat ID
  chatType    String   // 'private' | 'group' | 'supergroup'
  senderId    String?  // Telegram user ID (null for sent messages)
  senderUsername String?
  senderFirstName String?
  text        String?
  direction   String   // 'incoming' | 'outgoing'
  status      String   @default("received") // 'received' | 'sent' | 'failed'
  createdAt   DateTime @default(now())
  
  @@index([chatId, createdAt])
  @@index([direction])
}

model Group {
  id          String   @id @default(cuid())
  chatId      String   @unique // Telegram chat ID
  title       String
  type        String   // 'group' | 'supergroup'
  memberCount Int?
  joinedAt    DateTime @default(now())
  leftAt      DateTime?
  isActive    Boolean  @default(true)
  updatedAt   DateTime @updatedAt
  
  @@index([isActive])
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // hashed
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 正确性属性

*属性是指在系统所有有效执行中都应该成立的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*


### 属性反思

在编写具体属性之前，我需要识别和消除冗余：

**识别的冗余：**
- 属性 2.1（接收并存储消息）和 2.2（记录完整字段）可以合并为一个综合属性
- 属性 3.2（发送消息）和 3.3（存储已发送消息）可以合并
- 属性 5.1（接收群组消息）和 5.2（记录群组消息字段）可以合并
- 属性 4.2（显示群组列表）和 4.3（展示群组字段）可以合并

**合并后的属性集：**
通过合并，我们将 35+ 个可测试标准简化为约 25 个独特的属性，每个属性提供独特的验证价值。

### 正确性属性列表

**属性 1: Bot Token 验证和存储**
*对于任何*有效的 Telegram Bot Token，当保存配置时，系统应该验证 Token 有效性并将其存储到数据库中
**验证需求: 1.2**

**属性 2: 无效 Token 拒绝**
*对于任何*无效的 Bot Token，系统应该拒绝保存并保持当前配置不变
**验证需求: 1.3**

**属性 3: Webhook 自动设置**
*对于任何*成功的 Bot 配置，系统应该自动设置 Webhook 到指定的端点
**验证需求: 1.4**

**属性 4: 配置信息完整性**
*对于任何*已保存的 Bot 配置，查询时应该返回包含用户名和状态的完整信息
**验证需求: 1.5**

**属性 5: 消息接收和完整存储**
*对于任何*通过 Webhook 接收的 Telegram 消息，系统应该将其存储到数据库并包含发送者信息、消息内容、时间戳和聊天类型
**验证需求: 2.1, 2.2**

**属性 6: 消息列表时间倒序**
*对于任何*消息集合，查询消息列表时应该按时间戳倒序返回
**验证需求: 2.3**

**属性 7: 消息详情完整性**
*对于任何*消息，查询详情时应该包含发送者头像、用户名、消息内容和时间
**验证需求: 2.5**

**属性 8: 回复 UI 状态更新**
*对于任何*消息，点击回复按钮后，UI 应该显示输入框并预填充接收者信息
**验证需求: 3.1**

**属性 9: 消息发送和存储**
*对于任何*有效的消息内容和接收者，发送成功后应该通过 Telegram API 发送并存储到数据库标记为已发送
**验证需求: 3.2, 3.3**

**属性 10: 发送失败错误处理**
*对于任何*发送失败的消息，系统应该显示错误信息并保留消息内容
**验证需求: 3.4**

**属性 11: 对话历史时间排序**
*对于任何*对话（chatId），查询历史时应该按时间顺序返回所有接收和发送的消息
**验证需求: 3.5**

**属性 12: 群组加入自动存储**
*对于任何*Bot 加入群组的事件，系统应该自动检测并将群组信息存储到数据库
**验证需求: 4.1**

**属性 13: 群组列表完整性**
*对于任何*已加入的群组集合，查询时应该返回包含群组名称、成员数量、加入时间和状态的列表
**验证需求: 4.2, 4.3**

**属性 14: 群组详情查询**
*对于任何*群组 ID，查询详情时应该返回该群组的消息历史和成员信息
**验证需求: 4.4**

**属性 15: 群组退出同步更新**
*对于任何*群组，执行退出操作时应该调用 Telegram API 并同步更新数据库状态
**验证需求: 4.5**

**属性 16: 群组消息完整存储**
*对于任何*群组中的消息，系统应该接收并存储包含群组 ID、发送者信息、消息内容和时间戳
**验证需求: 5.1, 5.2**

**属性 17: 群组消息查询过滤**
*对于任何*群组 ID，查询消息时应该只返回该群组的消息历史
**验证需求: 5.3**

**属性 18: 群组消息发送和显示**
*对于任何*群组和消息内容，发送成功后应该通过 Bot 发送并在消息历史中显示
**验证需求: 5.4, 5.5**

**属性 19: 未认证访问重定向**
*对于任何*未认证的用户访问管理页面，系统应该重定向到登录页面
**验证需求: 6.1**

**属性 20: 认证成功会话创建**
*对于任何*有效的登录凭证，系统应该创建会话并允许访问管理功能
**验证需求: 6.2**

**属性 21: 认证失败访问拒绝**
*对于任何*无效的登录凭证，系统应该显示错误提示并阻止访问
**验证需求: 6.4**

**属性 22: 登出会话清除**
*对于任何*登出操作，系统应该清除会话并返回登录页面
**验证需求: 6.5**

**属性 23: 数据库连接失败处理**
*对于任何*数据库连接失败，系统应该记录错误并在管理界面显示警告
**验证需求: 7.2**

**属性 24: 数据存储事务性**
*对于任何*消息数据存储操作，系统应该使用事务确保数据完整性
**验证需求: 7.3**

**属性 25: 数据库错误优雅处理**
*对于任何*数据库操作失败，系统应该返回明确的错误信息并保持系统稳定运行
**验证需求: 7.5**

**属性 26: 环境变量配置读取**
*对于任何*敏感配置信息，系统应该从环境变量中读取而不是硬编码
**验证需求: 8.5**

## 错误处理

### 错误类型和处理策略

1. **Telegram API 错误**
   - Token 无效: 返回 401，提示重新配置
   - 网络超时: 重试 3 次，指数退避
   - 速率限制: 返回 429，显示等待时间
   - Bot 被封禁: 记录错误，通知管理员

2. **数据库错误**
   - 连接失败: 重试连接，显示维护页面
   - 查询超时: 返回 504，建议缩小查询范围
   - 唯一约束冲突: 返回 409，提示数据已存在
   - 事务失败: 回滚并返回 500

3. **认证错误**
   - 会话过期: 重定向到登录页面
   - 无效凭证: 返回 401，显示错误提示
   - CSRF 攻击: 返回 403，拒绝请求

4. **验证错误**
   - 无效输入: 返回 400，显示具体字段错误
   - 缺少必填字段: 返回 422，列出缺失字段

### 错误响应格式

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
  }
}
```

## 测试策略

### 单元测试

使用 **Vitest** 作为测试框架，测试以下内容：

1. **服务层测试**
   - Bot 配置服务的 Token 验证逻辑
   - 消息服务的数据转换和过滤
   - 群组服务的状态管理

2. **API 路由测试**
   - Webhook 处理器的消息解析
   - 认证中间件的访问控制
   - 错误处理的响应格式

3. **数据库操作测试**
   - Prisma 查询的正确性
   - 事务的原子性
   - 索引的使用

### 属性测试

使用 **fast-check** 作为属性测试库，测试以下属性：

**配置要求：**
- 每个属性测试运行至少 100 次迭代
- 每个属性测试必须使用注释标签明确引用设计文档中的正确性属性
- 标签格式: `// Feature: goodbot, Property X: [属性描述]`
- 每个正确性属性必须由单个属性测试实现

**测试覆盖：**

1. **消息处理属性**
   - 属性 5: 任何接收的消息都应该完整存储
   - 属性 6: 消息列表总是按时间倒序
   - 属性 11: 对话历史总是按时间排序

2. **群组管理属性**
   - 属性 12: 任何群组加入事件都应该被存储
   - 属性 15: 退出操作应该同步更新 API 和数据库

3. **认证属性**
   - 属性 19: 未认证访问总是被重定向
   - 属性 20: 有效凭证总是创建会话

4. **数据完整性属性**
   - 属性 24: 存储操作总是使用事务
   - 属性 25: 数据库错误总是被优雅处理

### 集成测试

1. **端到端流程**
   - Bot 配置 → Webhook 设置 → 消息接收 → 消息发送
   - 群组加入 → 消息接收 → 群组消息发送 → 退出群组

2. **数据库集成**
   - 使用测试数据库（Neon 分支或本地 PostgreSQL）
   - 测试前清理数据，测试后恢复

3. **Telegram API 模拟**
   - 使用 MSW (Mock Service Worker) 模拟 Telegram API
   - 测试各种响应场景（成功、失败、超时）

### 测试数据生成

使用 **@faker-js/faker** 生成测试数据：
- 随机用户信息
- 随机消息内容
- 随机群组信息
- 随机时间戳

## 部署和配置

### 环境变量

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_SECRET=random_secret_string

# Database
DATABASE_URL=postgresql://user:password@host/database

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=random_secret_for_jwt

# Admin Credentials (初始设置)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=hashed_password
```

### Vercel 部署配置

```json
{
  "buildCommand": "pnpm prisma generate && pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@database-url",
    "TELEGRAM_BOT_TOKEN": "@telegram-bot-token",
    "NEXTAUTH_SECRET": "@nextauth-secret"
  }
}
```

### 数据库迁移

```bash
# 开发环境
pnpm prisma migrate dev

# 生产环境（通过 Vercel 部署钩子）
pnpm prisma migrate deploy
```

## 性能考虑

1. **数据库查询优化**
   - 在 chatId 和 createdAt 上创建复合索引
   - 使用游标分页而不是偏移分页
   - 限制单次查询返回的记录数

2. **Webhook 处理**
   - 异步处理消息存储
   - 快速返回 200 响应给 Telegram
   - 使用队列处理大量消息（可选，后期优化）

3. **缓存策略**
   - Bot 配置缓存（很少变化）
   - 群组列表缓存（定期刷新）
   - 使用 Next.js 的 revalidate 机制

4. **API 速率限制**
   - 实现请求速率限制防止滥用
   - 对 Telegram API 调用实施退避策略

## 安全考虑

1. **Webhook 验证**
   - 验证请求来自 Telegram（使用 secret token）
   - 检查请求签名

2. **认证和授权**
   - 使用 bcrypt 哈希密码
   - 实施 CSRF 保护
   - 会话超时设置

3. **数据保护**
   - 敏感数据加密存储
   - 使用环境变量管理密钥
   - 定期备份数据库

4. **输入验证**
   - 验证所有用户输入
   - 防止 SQL 注入（使用 Prisma）
   - 防止 XSS 攻击（React 自动转义）

## 扩展性设计

系统设计考虑了未来扩展：

1. **消息类型扩展**
   - 当前支持文本消息
   - 预留字段支持图片、文件、语音等

2. **功能模块化**
   - 服务层独立，易于添加新功能
   - API 路由遵循 RESTful 设计

3. **多 Bot 支持**
   - 数据模型支持多个 Bot 配置
   - 通过 botId 隔离数据

4. **插件系统**
   - 预留 webhook 事件处理器扩展点
   - 支持自定义命令处理器
