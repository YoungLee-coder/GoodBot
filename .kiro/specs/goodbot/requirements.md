# 需求文档

## 简介

GoodBot 是一个基于 Next.js 的 Telegram Bot 管理系统，提供 Web UI 界面来管理 Telegram Bot 的消息和群组。系统使用 Vercel 部署，Neon 作为数据库，pnpm 作为包管理器。初期版本专注于双向消息功能和群组管理，为后续功能扩展奠定基础。

## 术语表

- **GoodBot系统**: 基于 Next.js 的 Telegram Bot 管理平台
- **Telegram Bot**: 通过 Telegram Bot API 创建的自动化账号
- **Web管理界面**: 基于浏览器的管理控制台
- **双向消息**: Bot 可以接收用户消息并发送回复消息
- **群组**: Telegram 中的群聊环境
- **Webhook**: Telegram 用于推送消息更新的 HTTP 回调接口
- **Neon数据库**: 无服务器 PostgreSQL 数据库服务
- **消息记录**: 系统存储的 Telegram 消息历史数据

## 需求

### 需求 1

**用户故事:** 作为管理员，我想通过 Web 界面配置 Telegram Bot，以便快速启动和管理 Bot 服务

#### 验收标准

1. WHEN 管理员首次访问 Web管理界面 THEN GoodBot系统 SHALL 显示 Bot Token 配置页面
2. WHEN 管理员输入有效的 Bot Token 并保存 THEN GoodBot系统 SHALL 验证 Token 有效性并存储到 Neon数据库
3. WHEN Bot Token 验证失败 THEN GoodBot系统 SHALL 显示明确的错误信息并保持当前配置不变
4. WHEN Bot 配置成功 THEN GoodBot系统 SHALL 自动设置 Webhook 到 Vercel 部署的端点
5. WHEN 管理员查看配置页面 THEN GoodBot系统 SHALL 显示当前 Bot 的基本信息包括用户名和状态

### 需求 2

**用户故事:** 作为管理员，我想接收并查看用户发送给 Bot 的消息，以便了解用户需求和互动情况

#### 验收标准

1. WHEN Telegram 用户向 Bot 发送消息 THEN GoodBot系统 SHALL 通过 Webhook 接收消息并存储到 Neon数据库
2. WHEN 消息被接收 THEN GoodBot系统 SHALL 记录发送者信息、消息内容、时间戳和聊天类型
3. WHEN 管理员打开消息列表页面 THEN GoodBot系统 SHALL 显示所有接收到的消息按时间倒序排列
4. WHEN 消息列表包含超过50条消息 THEN GoodBot系统 SHALL 实现分页功能每页显示50条消息
5. WHEN 管理员查看单条消息 THEN GoodBot系统 SHALL 显示完整的消息详情包括发送者头像、用户名、消息内容和时间

### 需求 3

**用户故事:** 作为管理员，我想通过 Web 界面向 Telegram 用户发送消息，以便回复用户咨询或推送通知

#### 验收标准

1. WHEN 管理员在消息详情页点击回复按钮 THEN GoodBot系统 SHALL 显示消息输入框并预填充接收者信息
2. WHEN 管理员输入消息内容并点击发送 THEN GoodBot系统 SHALL 通过 Telegram Bot API 发送消息到指定用户
3. WHEN 消息发送成功 THEN GoodBot系统 SHALL 将发送的消息存储到 Neon数据库 并标记为已发送
4. WHEN 消息发送失败 THEN GoodBot系统 SHALL 显示错误信息并保留消息内容供重试
5. WHEN 管理员查看对话历史 THEN GoodBot系统 SHALL 按时间顺序显示接收和发送的所有消息

### 需求 4

**用户故事:** 作为管理员，我想查看和管理 Bot 加入的群组，以便控制 Bot 的服务范围

#### 验收标准

1. WHEN Bot 被添加到新群组 THEN GoodBot系统 SHALL 自动检测并将群组信息存储到 Neon数据库
2. WHEN 管理员访问群组管理页面 THEN GoodBot系统 SHALL 显示所有 Bot 已加入的群组列表
3. WHEN 显示群组列表 THEN GoodBot系统 SHALL 展示群组名称、成员数量、加入时间和状态
4. WHEN 管理员点击群组详情 THEN GoodBot系统 SHALL 显示该群组的消息历史和成员信息
5. WHEN 管理员选择让 Bot 退出群组 THEN GoodBot系统 SHALL 调用 Telegram API 退出群组并更新数据库状态

### 需求 5

**用户故事:** 作为管理员，我想在群组中接收和发送消息，以便管理群组互动和发布公告

#### 验收标准

1. WHEN 群组成员在 Bot 所在群组发送消息 THEN GoodBot系统 SHALL 接收并存储消息到 Neon数据库
2. WHEN 存储群组消息 THEN GoodBot系统 SHALL 记录群组ID、发送者信息、消息内容和时间戳
3. WHEN 管理员选择特定群组 THEN GoodBot系统 SHALL 显示该群组的消息历史
4. WHEN 管理员在群组详情页输入消息并发送 THEN GoodBot系统 SHALL 通过 Bot 向该群组发送消息
5. WHEN 群组消息发送成功 THEN GoodBot系统 SHALL 在消息历史中显示已发送的消息

### 需求 6

**用户故事:** 作为管理员，我想通过安全的身份验证访问管理界面，以便保护 Bot 配置和消息数据

#### 验收标准

1. WHEN 未认证用户访问管理页面 THEN GoodBot系统 SHALL 重定向到登录页面
2. WHEN 管理员输入正确的凭证 THEN GoodBot系统 SHALL 创建会话并允许访问管理功能
3. WHEN 管理员会话超过30分钟无活动 THEN GoodBot系统 SHALL 自动注销会话
4. WHEN 登录凭证错误 THEN GoodBot系统 SHALL 显示错误提示并阻止访问
5. WHEN 管理员点击登出 THEN GoodBot系统 SHALL 清除会话并返回登录页面

### 需求 7

**用户故事:** 作为系统，我需要可靠地存储和检索数据，以便保证消息和配置的持久性

#### 验收标准

1. WHEN GoodBot系统 启动 THEN GoodBot系统 SHALL 建立与 Neon数据库 的连接
2. WHEN 数据库连接失败 THEN GoodBot系统 SHALL 记录错误并在管理界面显示数据库状态警告
3. WHEN 存储消息数据 THEN GoodBot系统 SHALL 使用事务确保数据完整性
4. WHEN 查询历史消息 THEN GoodBot系统 SHALL 使用索引优化查询性能
5. WHEN 数据库操作失败 THEN GoodBot系统 SHALL 返回明确的错误信息并保持系统稳定运行

### 需求 8

**用户故事:** 作为开发者，我想使用现代化的技术栈和最佳实践，以便确保系统的可维护性和可扩展性

#### 验收标准

1. THE GoodBot系统 SHALL 使用 Next.js App Router 架构
2. THE GoodBot系统 SHALL 使用 TypeScript 提供类型安全
3. THE GoodBot系统 SHALL 使用 pnpm 作为包管理器
4. THE GoodBot系统 SHALL 实现 API 路由处理 Webhook 和管理接口
5. THE GoodBot系统 SHALL 使用环境变量管理敏感配置信息
