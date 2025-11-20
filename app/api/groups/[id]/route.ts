import { NextRequest, NextResponse } from 'next/server'
import { groupService } from '@/lib/group-service'

/**
 * GET /api/groups/[id]
 * 获取群组详情
 * 需求: 4.4 - 显示群组的消息历史和成员信息
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

    // 获取群组详情
    const groupDetails = await groupService.getGroupDetails(id)

    if (!groupDetails) {
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

    return NextResponse.json({
      success: true,
      data: groupDetails,
    })
  } catch (error) {
    console.error('Get group details error:', error)

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve group details',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }
}
