import { NextRequest, NextResponse } from 'next/server'
import { groupService } from '@/lib/group-service'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit-middleware'

/**
 * GET /api/groups
 * 获取群组列表
 * 需求: 4.2 - 显示所有 Bot 已加入的群组列表
 * 需求: 4.3 - 展示群组名称、成员数量、加入时间和状态
 * 需求: 6.1, 6.2 - API 速率限制
 */
async function getGroupsHandler(request: NextRequest) {
  try {
    // 获取所有活跃的群组列表
    const groups = await groupService.getGroups()

    return NextResponse.json({
      success: true,
      data: groups,
    })
  } catch (error) {
    console.error('Get groups error:', error)

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve groups',
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
  return withRateLimit(rateLimitConfigs.lenient)(request, getGroupsHandler)
}
