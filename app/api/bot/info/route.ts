import { NextResponse } from 'next/server'
import { botConfigService } from '@/lib/bot-config-service'

/**
 * GET /api/bot/info
 * 获取 Bot 信息
 * 需求: 1.5 - 显示当前 Bot 的基本信息包括用户名和状态
 */
export async function GET() {
  try {
    // 获取活跃的 Bot 配置
    const config = await botConfigService.getActiveConfig()

    if (!config) {
      return NextResponse.json(
        {
          error: {
            code: 'NO_CONFIG',
            message: 'No bot configuration found',
          },
        },
        { status: 404 }
      )
    }

    // 尝试获取 Bot 信息，如果失败则使用数据库中的信息
    try {
      const botInfo = await botConfigService.getBotInfo()

      if (botInfo) {
        // 需求: 1.5 - 返回包含用户名和状态的完整信息
        return NextResponse.json({
          success: true,
          data: {
            id: botInfo.id,
            username: botInfo.username,
            firstName: botInfo.firstName,
            isActive: config.isActive,
            webhookUrl: config.webhookUrl,
            canJoinGroups: botInfo.canJoinGroups,
            canReadAllGroupMessages: botInfo.canReadAllGroupMessages,
            supportsInlineQueries: botInfo.supportsInlineQueries,
          },
        })
      }
    } catch (error) {
      console.warn('Failed to fetch live bot info, using cached data:', error)
    }

    // 如果无法从 Telegram 获取信息，返回数据库中的基本信息
    return NextResponse.json({
      success: true,
      data: {
        id: parseInt(config.botId),
        username: config.username,
        firstName: config.username, // 使用 username 作为 fallback
        isActive: config.isActive,
        webhookUrl: config.webhookUrl,
        canJoinGroups: null,
        canReadAllGroupMessages: null,
        supportsInlineQueries: null,
        offline: true, // 标记为离线模式
      },
    })
  } catch (error) {
    console.error('Get bot info error:', error)

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get bot information',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }
}
