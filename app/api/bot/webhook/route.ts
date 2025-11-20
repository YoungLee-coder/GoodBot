import { NextRequest, NextResponse } from 'next/server'
import { botConfigService } from '@/lib/bot-config-service'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-error-handler'
import { createSuccessResponse } from '@/lib/errors'

/**
 * POST /api/bot/webhook
 * 设置 Webhook
 * 需求: 1.4 - 自动设置 Webhook 到 Vercel 端点
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // 解析请求体
  const body = await request.json()

  // 验证输入
  const schema = z.object({
    url: z.string().url('Invalid webhook URL'),
    secretToken: z.string().optional(),
  })

  const { url, secretToken } = schema.parse(body)

  // 设置 Webhook
  // 需求: 1.4 - 设置 Webhook 到指定端点
  await botConfigService.setupWebhook(url, secretToken)

  return NextResponse.json(
    createSuccessResponse(
      { webhookUrl: url },
      'Webhook configured successfully'
    )
  )
})

/**
 * DELETE /api/bot/webhook
 * 删除 Webhook
 */
export const DELETE = withErrorHandler(async () => {
  await botConfigService.deleteWebhook()

  return NextResponse.json(
    createSuccessResponse(undefined, 'Webhook deleted successfully')
  )
})
