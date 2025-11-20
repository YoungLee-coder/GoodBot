import { Bot, webhookCallback } from 'grammy'
import { prisma } from './prisma'
import { BotConfig } from '@prisma/client'

export interface TelegramBotInfo {
  id: number
  username: string
  firstName: string
  canJoinGroups: boolean
  canReadAllGroupMessages: boolean
  supportsInlineQueries: boolean
}

export class BotConfigService {
  /**
   * 验证并保存 Bot Token
   * 需求: 1.2 - 验证 Token 有效性并存储到数据库
   */
  async saveBotToken(token: string): Promise<BotConfig> {
    // 验证 token 格式 (应该是 botId:hash 格式)
    const tokenParts = token.split(':')
    if (tokenParts.length !== 2 || !tokenParts[0] || !tokenParts[1]) {
      throw new Error('Invalid Bot Token: Token format should be botId:hash')
    }
    
    const botId = tokenParts[0]
    if (isNaN(Number(botId))) {
      throw new Error('Invalid Bot Token: Bot ID should be numeric')
    }
    
    // 创建 Bot 实例验证 Token
    const bot = new Bot(token)
    
    try {
      // 尝试获取 Bot 信息以验证 Token
      const botInfo = await bot.api.getMe()
      
      // 保存或更新 Bot 配置
      const config = await prisma.botConfig.upsert({
        where: { token },
        update: {
          username: botInfo.username,
          botId: botInfo.id.toString(),
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          token,
          username: botInfo.username,
          botId: botInfo.id.toString(),
          isActive: true,
        },
      })
      
      return config
    } catch (error) {
      // 如果是网络错误，尝试保存基本配置（离线模式）
      if (error instanceof Error && error.message.includes('Network request')) {
        console.warn('Network error, saving token in offline mode')
        
        // 保存或更新 Bot 配置（使用 botId 作为临时 username）
        const config = await prisma.botConfig.upsert({
          where: { token },
          update: {
            username: `bot_${botId}`,
            botId: botId,
            isActive: true,
            updatedAt: new Date(),
          },
          create: {
            token,
            username: `bot_${botId}`,
            botId: botId,
            isActive: true,
          },
        })
        
        return config
      }
      
      throw new Error(`Invalid Bot Token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取 Bot 信息
   * 需求: 1.5 - 显示 Bot 基本信息
   */
  async getBotInfo(): Promise<TelegramBotInfo | null> {
    // 获取当前活跃的 Bot 配置
    const config = await prisma.botConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    
    if (!config) {
      return null
    }
    
    try {
      const bot = new Bot(config.token)
      const botInfo = await bot.api.getMe()
      
      return {
        id: botInfo.id,
        username: botInfo.username,
        firstName: botInfo.first_name,
        canJoinGroups: botInfo.can_join_groups ?? false,
        canReadAllGroupMessages: botInfo.can_read_all_group_messages ?? false,
        supportsInlineQueries: botInfo.supports_inline_queries ?? false,
      }
    } catch (error) {
      throw new Error(`Failed to get bot info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 设置 Webhook
   * 需求: 1.4 - 自动设置 Webhook 到 Vercel 端点
   */
  async setupWebhook(url: string, secretToken?: string): Promise<boolean> {
    const config = await prisma.botConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    
    if (!config) {
      throw new Error('No active bot configuration found')
    }
    
    try {
      const bot = new Bot(config.token)
      
      // 设置 Webhook
      await bot.api.setWebhook(url, {
        secret_token: secretToken,
        allowed_updates: ['message', 'my_chat_member', 'chat_member'],
      })
      
      // 更新数据库中的 Webhook URL
      await prisma.botConfig.update({
        where: { id: config.id },
        data: { webhookUrl: url },
      })
      
      return true
    } catch (error) {
      throw new Error(`Failed to setup webhook: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 删除 Webhook
   */
  async deleteWebhook(): Promise<boolean> {
    const config = await prisma.botConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    
    if (!config) {
      throw new Error('No active bot configuration found')
    }
    
    try {
      const bot = new Bot(config.token)
      
      // 删除 Webhook
      await bot.api.deleteWebhook()
      
      // 更新数据库
      await prisma.botConfig.update({
        where: { id: config.id },
        data: { webhookUrl: null },
      })
      
      return true
    } catch (error) {
      throw new Error(`Failed to delete webhook: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取当前活跃的 Bot 配置
   */
  async getActiveConfig(): Promise<BotConfig | null> {
    return prisma.botConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * 创建 Bot 实例
   */
  async createBotInstance(): Promise<Bot | null> {
    const config = await this.getActiveConfig()
    
    if (!config) {
      return null
    }
    
    return new Bot(config.token)
  }
}

// 导出单例实例
export const botConfigService = new BotConfigService()
