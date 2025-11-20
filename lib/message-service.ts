import { prisma } from './prisma'
import { Message } from '@prisma/client'
import { Bot } from 'grammy'
import { botConfigService } from './bot-config-service'
import type { Update, Message as TelegramMessage } from 'grammy/types'

export interface SaveMessageParams {
  messageId: string
  chatId: string
  chatType: 'private' | 'group' | 'supergroup' | 'channel'
  senderId?: string
  senderUsername?: string
  senderFirstName?: string
  text?: string
  direction: 'incoming' | 'outgoing'
  status?: 'received' | 'sent' | 'failed'
}

export interface MessageFilters {
  chatId?: string
  chatType?: string
  direction?: 'incoming' | 'outgoing'
  status?: string
}

export interface Pagination {
  page?: number
  limit?: number
  cursor?: string
}

export interface PaginatedMessages {
  messages: Message[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  nextCursor?: string
  prevCursor?: string
}

export class MessageService {
  /**
   * 保存接收到的消息
   * 需求: 2.1, 2.2 - 接收并存储消息及完整信息
   */
  async saveIncomingMessage(update: Update): Promise<Message | null> {
    // 检查是否包含消息
    if (!update.message) {
      return null
    }

    const message = update.message as TelegramMessage.TextMessage
    
    // 提取消息信息
    const messageData: SaveMessageParams = {
      messageId: message.message_id.toString(),
      chatId: message.chat.id.toString(),
      chatType: message.chat.type,
      senderId: message.from?.id.toString(),
      senderUsername: message.from?.username,
      senderFirstName: message.from?.first_name,
      text: message.text || '',
      direction: 'incoming',
      status: 'received',
    }

    return this.saveMessage(messageData)
  }

  /**
   * 保存消息到数据库
   * 需求: 7.3 - 使用事务确保数据完整性
   */
  async saveMessage(params: SaveMessageParams): Promise<Message> {
    // 使用事务确保数据完整性
    return prisma.$transaction(async (tx) => {
      return tx.message.create({
        data: {
          messageId: params.messageId,
          chatId: params.chatId,
          chatType: params.chatType,
          senderId: params.senderId,
          senderUsername: params.senderUsername,
          senderFirstName: params.senderFirstName,
          text: params.text,
          direction: params.direction,
          status: params.status || 'received',
        },
      })
    })
  }

  /**
   * 获取消息列表（支持分页和过滤）
   * 需求: 2.3 - 显示消息列表按时间倒序
   * 需求: 2.4 - 实现分页功能
   * 需求: 7.4 - 使用游标分页优化大数据集查询
   */
  async getMessages(
    filters: MessageFilters = {},
    pagination: Pagination = {}
  ): Promise<PaginatedMessages> {
    const limit = pagination.limit || 50
    
    // 构建查询条件
    const where: any = {}
    
    if (filters.chatId) {
      where.chatId = filters.chatId
    }
    
    if (filters.chatType) {
      where.chatType = filters.chatType
    }
    
    if (filters.direction) {
      where.direction = filters.direction
    }
    
    if (filters.status) {
      where.status = filters.status
    }

    // 使用游标分页或传统分页
    if (pagination.cursor) {
      // 游标分页 - 更高效的大数据集查询
      const result = await prisma.$transaction(async (tx) => {
        // 获取总数（可选，对于游标分页可能不需要）
        const total = await tx.message.count({ where })

        // 使用游标获取消息列表（按时间倒序）
        const messages = await tx.message.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          cursor: { id: pagination.cursor },
          skip: 1, // 跳过游标本身
          take: limit,
        })

        return { messages, total }
      })

      return {
        messages: result.messages,
        total: result.total,
        page: 0, // 游标分页不使用页码
        limit,
        hasMore: result.messages.length === limit,
        nextCursor: result.messages.length > 0 ? result.messages[result.messages.length - 1].id : undefined,
        prevCursor: pagination.cursor,
      }
    } else {
      // 传统偏移分页 - 向后兼容
      const page = pagination.page || 1
      const skip = (page - 1) * limit

      const result = await prisma.$transaction(async (tx) => {
        // 获取总数
        const total = await tx.message.count({ where })

        // 获取消息列表（按时间倒序）
        const messages = await tx.message.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        })

        return { messages, total }
      })

      return {
        messages: result.messages,
        total: result.total,
        page,
        limit,
        hasMore: skip + result.messages.length < result.total,
        nextCursor: result.messages.length > 0 ? result.messages[result.messages.length - 1].id : undefined,
      }
    }
  }

  /**
   * 获取特定对话的消息历史
   * 需求: 3.5 - 按时间顺序显示对话历史
   * 需求: 7.4 - 使用游标分页优化大数据集查询
   */
  async getConversation(
    chatId: string,
    pagination: Pagination = {}
  ): Promise<PaginatedMessages> {
    const limit = pagination.limit || 50

    // 使用游标分页或传统分页
    if (pagination.cursor) {
      // 游标分页 - 更高效的大数据集查询
      const result = await prisma.$transaction(async (tx) => {
        // 获取该对话的总消息数
        const total = await tx.message.count({
          where: { chatId },
        })

        // 使用游标获取消息（按时间正序，显示对话历史）
        const messages = await tx.message.findMany({
          where: { chatId },
          orderBy: { createdAt: 'asc' },
          cursor: { id: pagination.cursor },
          skip: 1, // 跳过游标本身
          take: limit,
        })

        return { messages, total }
      })

      return {
        messages: result.messages,
        total: result.total,
        page: 0, // 游标分页不使用页码
        limit,
        hasMore: result.messages.length === limit,
        nextCursor: result.messages.length > 0 ? result.messages[result.messages.length - 1].id : undefined,
        prevCursor: pagination.cursor,
      }
    } else {
      // 传统偏移分页 - 向后兼容
      const page = pagination.page || 1
      const skip = (page - 1) * limit

      const result = await prisma.$transaction(async (tx) => {
        // 获取该对话的总消息数
        const total = await tx.message.count({
          where: { chatId },
        })

        // 获取消息（按时间正序，显示对话历史）
        const messages = await tx.message.findMany({
          where: { chatId },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit,
        })

        return { messages, total }
      })

      return {
        messages: result.messages,
        total: result.total,
        page,
        limit,
        hasMore: skip + result.messages.length < result.total,
        nextCursor: result.messages.length > 0 ? result.messages[result.messages.length - 1].id : undefined,
      }
    }
  }

  /**
   * 通过 Telegram API 发送消息
   * 需求: 3.2 - 通过 Telegram Bot API 发送消息
   * 需求: 3.3 - 将发送的消息存储到数据库
   */
  async sendMessage(chatId: string, text: string): Promise<Message> {
    // 获取 Bot 实例
    const bot = await botConfigService.createBotInstance()
    
    if (!bot) {
      throw new Error('Bot not configured')
    }

    try {
      // 使用事务确保发送和存储的原子性
      return await prisma.$transaction(async (tx) => {
        // 发送消息到 Telegram
        const sentMessage = await bot.api.sendMessage(chatId, text)

        // 存储发送的消息到数据库
        const message = await tx.message.create({
          data: {
            messageId: sentMessage.message_id.toString(),
            chatId: chatId,
            chatType: sentMessage.chat.type,
            senderId: null, // 发送的消息没有 senderId
            senderUsername: null,
            senderFirstName: null,
            text: text,
            direction: 'outgoing',
            status: 'sent',
          },
        })

        return message
      })
    } catch (error) {
      // 如果发送失败，仍然保存消息但标记为失败
      const failedMessage = await prisma.message.create({
        data: {
          messageId: `failed-${Date.now()}`,
          chatId: chatId,
          chatType: 'private', // 默认类型
          senderId: null,
          senderUsername: null,
          senderFirstName: null,
          text: text,
          direction: 'outgoing',
          status: 'failed',
        },
      })

      throw new Error(
        `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

// 导出单例实例
export const messageService = new MessageService()
