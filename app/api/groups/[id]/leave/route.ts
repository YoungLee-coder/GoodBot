import { NextRequest, NextResponse } from 'next/server'
import { groupService } from '@/lib/group-service'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit-middleware'
import { groupIdSchema } from '@/lib/validation'

/**
 * POST /api/groups/[id]/leave
 * 退出群组
 * 需求: 4.5 - 调用 Telegram API 退出群组并更新数据库状态
 * 需求: 6.1, 6.2, 6.3 - 安全措施（速率限制、输入验证）
 */
async function leaveGroupHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 需求: 6.3 - 验证所有用户输入
    const validationResult = groupIdSchema.safeParse({ id })
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid group ID format',
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      )
    }

    // 退出群组
    const success = await groupService.leaveGroup(id)

    if (!success) {
      return NextResponse.json(
        {
          error: {
            code: 'OPERATION_FAILED',
            message: 'Failed to leave group',
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully left the group',
    })
  } catch (error) {
    console.error('Leave group error:', error)

    // 检查是否是群组不存在的错误
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Group not found',
            details: error.message,
          },
        },
        { status: 404 }
      )
    }

    // 检查是否是 Bot 未配置的错误
    if (error instanceof Error && error.message.includes('not configured')) {
      return NextResponse.json(
        {
          error: {
            code: 'BOT_NOT_CONFIGURED',
            message: 'Bot is not configured',
            details: error.message,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to leave group',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * POST 路由处理器，带速率限制
 * 需求: 6.1, 6.2 - API 速率限制
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withRateLimit(rateLimitConfigs.moderate)(request, (req) =>
    leaveGroupHandler(req, context)
  )
}
