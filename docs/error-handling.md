# 错误处理和用户反馈系统

本文档描述 GoodBot 系统中的错误处理和用户反馈机制。

## 概述

系统实现了统一的错误处理和用户反馈机制，包括：

1. **统一的错误响应格式** - 所有 API 返回一致的错误格式
2. **API 错误处理中间件** - 自动捕获和处理 API 错误
3. **Toast 通知组件** - 显示操作结果和错误信息
4. **加载状态指示器** - 显示操作进行中的状态
5. **错误边界组件** - 捕获 React 组件错误

## 错误响应格式

### 统一格式

所有 API 响应遵循以下格式：

```typescript
// 成功响应
{
  success: true,
  message?: string,
  data?: T
}

// 错误响应
{
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### 错误代码

系统定义了以下错误代码：

- `VALIDATION_ERROR` - 输入验证错误
- `UNAUTHORIZED` - 未授权访问
- `FORBIDDEN` - 权限不足
- `SESSION_EXPIRED` - 会话过期
- `INVALID_TOKEN` - Bot Token 无效
- `NO_CONFIG` - Bot 未配置
- `WEBHOOK_ERROR` - Webhook 设置失败
- `SEND_FAILED` - 消息发送失败
- `CHAT_NOT_FOUND` - 聊天不存在
- `BOT_BLOCKED` - Bot 被屏蔽
- `RATE_LIMIT` - 请求频率限制
- `DATABASE_ERROR` - 数据库错误
- `CONNECTION_FAILED` - 连接失败
- `TRANSACTION_FAILED` - 事务失败
- `INTERNAL_ERROR` - 内部错误
- `NOT_FOUND` - 资源不存在
- `NETWORK_ERROR` - 网络错误

## API 错误处理

### 使用错误处理中间件

在 API 路由中使用 `withErrorHandler` 包装器：

```typescript
import { withErrorHandler } from '@/lib/api-error-handler'
import { createSuccessResponse } from '@/lib/errors'

export const POST = withErrorHandler(async (request: NextRequest) => {
  // 验证输入（Zod 错误会自动处理）
  const { data } = schema.parse(await request.json())
  
  // 执行业务逻辑（抛出的错误会自动处理）
  const result = await someService.doSomething(data)
  
  // 返回成功响应
  return NextResponse.json(
    createSuccessResponse(result, 'Operation successful')
  )
})
```

### 自动处理的错误类型

中间件自动处理以下错误：

1. **Zod 验证错误** - 返回 400 状态码
2. **Prisma 错误** - 根据错误类型返回适当状态码
3. **自定义 AppError** - 使用指定的状态码和消息
4. **标准 Error** - 根据消息内容推断错误类型

## 客户端 API 调用

### 使用 API 客户端

```typescript
import { get, post } from '@/lib/api-client'
import { handleApiResponse, toast } from '@/lib/use-toast'

// GET 请求
const response = await get<BotInfo>('/api/bot/info')
const data = handleApiResponse(response, {
  successMessage: '加载成功',
  showSuccess: false, // 不显示成功提示
})

// POST 请求
const response = await post('/api/bot/config', { token })
const data = handleApiResponse(response, {
  successMessage: 'Bot 配置保存成功！',
})

// 手动处理错误
if (isErrorResponse(response)) {
  toast.error(response.error.message)
}
```

### API 客户端特性

- 自动设置 Content-Type
- 超时控制（默认 30 秒）
- 自动处理网络错误
- 统一的错误格式

## Toast 通知

### 基本用法

```typescript
import { toast } from '@/lib/use-toast'

// 成功提示
toast.success('操作成功')

// 错误提示
toast.error('操作失败')

// 警告提示
toast.warning('请注意')

// 信息提示
toast.info('提示信息')

// 加载提示
const toastId = toast.loading('处理中...')
// 完成后关闭
toast.dismiss(toastId)
```

### Promise 提示

```typescript
toast.promise(
  someAsyncOperation(),
  {
    loading: '处理中...',
    success: '操作成功',
    error: '操作失败',
  }
)
```

### 自定义选项

```typescript
toast.success('操作成功', {
  title: '成功',
  description: '详细信息',
  duration: 5000, // 5 秒
})
```

## 加载状态

### Spinner 组件

```typescript
import { Spinner } from '@/components/ui/spinner'

// 小尺寸
<Spinner size="sm" />

// 中等尺寸（默认）
<Spinner size="md" />

// 大尺寸
<Spinner size="lg" />
```

### 加载覆盖层

```typescript
import { LoadingOverlay } from '@/components/ui/spinner'

{isLoading && <LoadingOverlay message="加载中..." />}
```

### 按钮加载状态

```typescript
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

<Button disabled={loading}>
  {loading && <Spinner size="sm" />}
  {loading ? '保存中...' : '保存'}
</Button>
```

## 错误边界

### 使用错误边界

错误边界已在根布局中配置，会自动捕获所有组件错误：

```typescript
// app/layout.tsx
<ErrorBoundary>
  {children}
</ErrorBoundary>
```

### 自定义错误显示

```typescript
import { ErrorDisplay } from '@/components/error-boundary'

<ErrorDisplay 
  error={error}
  onRetry={() => refetch()}
/>
```

### 页面级错误边界

```typescript
import { ErrorBoundary } from '@/components/error-boundary'

<ErrorBoundary
  fallback={<CustomErrorPage />}
  onError={(error, errorInfo) => {
    // 记录错误
    console.error(error, errorInfo)
  }}
>
  <YourComponent />
</ErrorBoundary>
```

## 最佳实践

### 1. API 路由

- 始终使用 `withErrorHandler` 包装 API 处理器
- 使用 Zod 进行输入验证
- 抛出有意义的错误消息
- 使用 `createSuccessResponse` 创建成功响应

### 2. 客户端调用

- 使用 `api-client` 进行 API 调用
- 使用 `handleApiResponse` 处理响应
- 显示适当的加载状态
- 使用 Toast 通知用户操作结果

### 3. 用户体验

- 始终显示加载状态
- 提供清晰的错误消息
- 允许用户重试失败的操作
- 使用 Toast 而不是 alert

### 4. 错误处理

- 捕获所有可能的错误
- 记录错误到控制台
- 不要向用户暴露敏感信息
- 提供有用的错误恢复选项

## 示例：完整的表单提交

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { toast, handleApiResponse } from '@/lib/use-toast'
import { post } from '@/lib/api-client'

export default function MyForm() {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await post('/api/my-endpoint', { value })
      
      const data = handleApiResponse(response, {
        successMessage: '提交成功！',
      })

      if (data) {
        setValue('') // 清空表单
      }
    } catch (err) {
      toast.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={loading}
      />
      <Button type="submit" disabled={loading || !value}>
        {loading && <Spinner size="sm" />}
        {loading ? '提交中...' : '提交'}
      </Button>
    </form>
  )
}
```

## 需求映射

本错误处理系统满足以下需求：

- **需求 1.3** - Token 验证失败时显示明确的错误信息
- **需求 3.4** - 消息发送失败时显示错误信息并保留内容
- **需求 7.2** - 数据库连接失败时显示警告
- **需求 7.5** - 数据库操作失败时返回明确错误并保持系统稳定

## 总结

GoodBot 的错误处理系统提供了：

✅ 统一的错误格式
✅ 自动错误处理
✅ 用户友好的提示
✅ 完善的加载状态
✅ 错误恢复机制
✅ 类型安全的 API

这确保了系统的稳定性和良好的用户体验。
