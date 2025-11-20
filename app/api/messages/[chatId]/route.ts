import { NextRequest, NextResponse } from 'next/server'
import { messageService } from '@/lib/message-service'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit-middleware'
import { validateChatId } from '@/lib/validation'

/**
 * GET /api/messages/[chatId]
 * 获取特定对话的消息历史
 * 需求: 3.5 - 按时间顺序显示对话历史
 * 需求: 6.1, 6.2, 6.3 - 安全措施（速率限制、输入验证）
 */
async function getConversationHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId: rawChatId } = await params

    // 需求: 6.3 - 验证所有用户输入
    if (!rawChatId) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Chat ID is required',
          },
        },
        { status: 400 }
      )
    }

    // 验证 Chat ID 格式
    try {
      validateChatId(rawChatId)
    } catch (error) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid chat ID format',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        { status: 400 }
      )
    }

    const chatId = rawChatId

    const { searchParams } = new URL(request.url)

    // 解析分页参数
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const cursor = searchParams.get('cursor') || undefined

    // 验证分页参数
    if (!cursor && (page < 1 || limit < 1 || limit > 100)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid pagination parameters',
            details: 'Page must be >= 1, limit must be between 1 and 100',
          },
        },
        { status: 400 }
      )
    }

    if (cursor && (limit < 1 || limit > 100)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid pagination parameters',
            details: 'Limit must be between 1 and 100',
          },
        },
        { status: 400 }
      )
    }

    // 获取对话历史（支持游标分页）
    const result = await messageService.getConversation(chatId, {
      page: cursor ? undefined : page,
      limit,
      cursor,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get conversation error:', error)

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve conversation',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET 路由处理器，带速率限制
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ chatId: string }> }
) {
  return withRateLimit(rateLimitConfigs.lenient)(request, (req) =>
    getConversationHandler(req, context)
  )
}
