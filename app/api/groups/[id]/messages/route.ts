import { NextRequest, NextResponse } from 'next/server'
import { groupService } from '@/lib/group-service'
import { messageService } from '@/lib/message-service'

/**
 * GET /api/groups/[id]/messages
 * 获取群组消息
 * 需求: 5.3 - 显示该群组的消息历史
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Group ID is required',
          },
        },
        { status: 400 }
      )
    }

    // 首先获取群组信息以获取 chatId
    const group = await groupService.getGroupDetails(id)

    if (!group) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Group not found',
          },
        },
        { status: 404 }
      )
    }

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

    // 获取该群组的消息（使用 chatId 过滤，支持游标分页）
    const result = await messageService.getMessages(
      {
        chatId: group.chatId,
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
    console.error('Get group messages error:', error)

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve group messages',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }
}
