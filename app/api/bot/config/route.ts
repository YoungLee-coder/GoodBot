import { NextRequest, NextResponse } from 'next/server'
import { botConfigService } from '@/lib/bot-config-service'
import { withErrorHandler } from '@/lib/api-error-handler'
import { createSuccessResponse } from '@/lib/errors'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit-middleware'
import { botConfigSchema } from '@/lib/validation'

/**
 * POST /api/bot/config
 * 保存 Bot 配置
 * 需求: 1.2 - 验证 Token 有效性并存储到数据库
 * 需求: 1.3 - Token 验证失败时显示错误信息
 * 需求: 6.1, 6.2, 6.3 - 安全措施（速率限制、输入验证）
 */
const postHandler = withErrorHandler(async (request: NextRequest) => {
  // 解析请求体
  const body = await request.json()

  // 需求: 6.3 - 验证所有用户输入
  const { token } = botConfigSchema.parse(body)

  // 保存 Bot Token
  // 需求: 1.2 - 验证并存储 Token
  const config = await botConfigService.saveBotToken(token)

  // 需求: 1.4 - 自动设置 Webhook
  // 获取 Webhook URL（从环境变量或构建 URL）
  const webhookUrl = process.env.NEXTAUTH_URL 
    ? `${process.env.NEXTAUTH_URL}/api/webhook`
    : `${request.nextUrl.origin}/api/webhook`
  
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET

  try {
    await botConfigService.setupWebhook(webhookUrl, webhookSecret)
  } catch (webhookError) {
    // Webhook 设置失败不应该阻止配置保存
    console.error('Failed to setup webhook:', webhookError)
  }

  return NextResponse.json(
    createSuccessResponse({
      id: config.id,
      username: config.username,
      botId: config.botId,
      isActive: config.isActive,
      webhookUrl: config.webhookUrl,
    })
  )
})

/**
 * POST 路由处理器，带速率限制
 * 需求: 6.1, 6.2 - API 速率限制
 */
export async function POST(request: NextRequest) {
  return withRateLimit(rateLimitConfigs.strict)(request, postHandler)
}
