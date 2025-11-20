import { NextRequest, NextResponse } from 'next/server'
import { messageService } from '@/lib/message-service'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit-middleware'

/**
 * GET /api/messages
 * 获取消息列表（支持分页和过滤）
 * 需求: 2.3 - 显示消息列表按时间倒序
 * 需求: 2.4 - 实现分页功能
 * 需求: 6.1, 6.2 - API 速率限制
 */
async function getMessagesHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 解析查询参数
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const cursor = searchParams.get('cursor') || undefined
    const chatId = searchParams.get('chatId') || undefined
    const chatType = searchParams.get('chatType') || undefined
    const direction = searchParams.get('direction') || undefined
    const status = searchParams.get('status') || undefined

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

    // 验证 direction 参数
    if (direction && direction !== 'incoming' && direction !== 'outgoing') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid direction parameter',
            details: 'Direction must be "incoming" or "outgoing"',
          },
        },
        { status: 400 }
      )
    }

    // 获取消息列表（支持游标分页）
    const result = await messageService.getMessages(
      {
        chatId,
        chatType,
        direction: direction as 'incoming' | 'outgoing' | undefined,
        status,
      },
      {
        page: cursor ? undefined : page,
        limit,
        cursor,
      }
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get messages error:', error)

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve messages',
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
export async function GET(request: NextRequest) {
  return withRateLimit(rateLimitConfigs.lenient)(request, getMessagesHandler)
}
