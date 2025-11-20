import { NextRequest, NextResponse } from 'next/server'
import { messageService } from '@/lib/message-service'
import { withErrorHandler } from '@/lib/api-error-handler'
import { createSuccessResponse } from '@/lib/errors'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit-middleware'
import { sendMessageSchema } from '@/lib/validation'

/**
 * POST /api/messages/send
 * 发送消息到 Telegram
 * 需求: 3.2 - 通过 Telegram Bot API 发送消息
 * 需求: 3.3 - 将发送的消息存储到数据库
 * 需求: 3.4 - 发送失败时显示错误信息
 * 需求: 6.1, 6.2, 6.3 - 安全措施（速率限制、输入验证）
 */
const postHandler = withErrorHandler(async (request: NextRequest) => {
  // 解析请求体
  const body = await request.json()

  // 需求: 6.3 - 验证所有用户输入
  const { chatId, text } = sendMessageSchema.parse(body)

  // 发送消息（带重试逻辑）
  let lastError: Error | null = null
  const maxRetries = 3
  const retryDelay = 1000 // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const message = await messageService.sendMessage(chatId, text)

      return NextResponse.json(
        createSuccessResponse(message, 'Message sent successfully')
      )
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // 如果是最后一次尝试，不再重试
      if (attempt === maxRetries) {
        break
      }

      // 检查是否是可重试的错误
      const errorMessage = lastError.message.toLowerCase()
      const isRetryable = 
        errorMessage.includes('timeout') ||
        errorMessage.includes('network') ||
        errorMessage.includes('econnreset') ||
        errorMessage.includes('enotfound')

      if (!isRetryable) {
        // 不可重试的错误，直接退出
        break
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
    }
  }

  // 所有重试都失败了，抛出错误让 withErrorHandler 处理
  throw lastError || new Error('Failed to send message after multiple attempts')
})

/**
 * POST 路由处理器，带速率限制
 * 需求: 6.1, 6.2 - API 速率限制
 */
export async function POST(request: NextRequest) {
  return withRateLimit(rateLimitConfigs.strict)(request, postHandler)
}
