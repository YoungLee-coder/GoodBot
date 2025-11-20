import { prisma } from './prisma'
import { Group } from '@prisma/client'
import { botConfigService } from './bot-config-service'
import type { Chat } from 'grammy/types'

export interface SaveGroupParams {
  chatId: string
  title: string
  type: 'group' | 'supergroup'
  memberCount?: number
}

export interface GroupDetails extends Group {
  messageCount?: number
  lastMessageAt?: Date | null
}

export class GroupService {
  /**
   * 保存群组信息到数据库
   * 需求: 4.1 - Bot 加入群组时自动存储群组信息
   */
  async saveGroup(params: SaveGroupParams): Promise<Group> {
    // 使用事务确保数据完整性
    return prisma.$transaction(async (tx) => {
      // 使用 upsert 避免重复插入
      return tx.group.upsert({
        where: { chatId: params.chatId },
        update: {
          title: params.title,
          type: params.type,
          memberCount: params.memberCount,
          isActive: true,
          leftAt: null, // 如果之前退出过，现在重新加入
          updatedAt: new Date(),
        },
        create: {
          chatId: params.chatId,
          title: params.title,
          type: params.type,
          memberCount: params.memberCount,
          isActive: true,
        },
      })
    })
  }

  /**
   * 从 Telegram Chat 对象保存群组
   * 需求: 4.1 - 自动检测并存储群组信息
   */
  async saveGroupFromChat(chat: Chat): Promise<Group | null> {
    // 只处理群组类型
    if (chat.type !== 'group' && chat.type !== 'supergroup') {
      return null
    }

    const params: SaveGroupParams = {
      chatId: chat.id.toString(),
      title: chat.title || 'Unknown Group',
      type: chat.type,
    }

    return this.saveGroup(params)
  }

  /**
   * 获取所有群组列表
   * 需求: 4.2 - 显示所有 Bot 已加入的群组列表
   * 需求: 4.3 - 展示群组名称、成员数量、加入时间和状态
   */
  async getGroups(): Promise<Group[]> {
    return prisma.group.findMany({
      where: { isActive: true },
      orderBy: { joinedAt: 'desc' },
    })
  }

  /**
   * 获取群组详情
   * 需求: 4.4 - 显示群组的消息历史和成员信息
   */
  async getGroupDetails(groupId: string): Promise<GroupDetails | null> {
    // 使用事务确保数据一致性
    return prisma.$transaction(async (tx) => {
      // 获取群组基本信息
      const group = await tx.group.findUnique({
        where: { id: groupId },
      })

      if (!group) {
        return null
      }

      // 获取该群组的消息统计
      const messageCount = await tx.message.count({
        where: { chatId: group.chatId },
      })

      // 获取最后一条消息的时间
      const lastMessage = await tx.message.findFirst({
        where: { chatId: group.chatId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      })

      return {
        ...group,
        messageCount,
        lastMessageAt: lastMessage?.createdAt || null,
      }
    })
  }

  /**
   * 通过 chatId 获取群组详情
   */
  async getGroupDetailsByChatId(chatId: string): Promise<GroupDetails | null> {
    // 使用事务确保数据一致性
    return prisma.$transaction(async (tx) => {
      // 获取群组基本信息
      const group = await tx.group.findUnique({
        where: { chatId },
      })

      if (!group) {
        return null
      }

      // 获取该群组的消息统计
      const messageCount = await tx.message.count({
        where: { chatId: group.chatId },
      })

      // 获取最后一条消息的时间
      const lastMessage = await tx.message.findFirst({
        where: { chatId: group.chatId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      })

      return {
        ...group,
        messageCount,
        lastMessageAt: lastMessage?.createdAt || null,
      }
    })
  }

  /**
   * 退出群组并更新数据库
   * 需求: 4.5 - 调用 Telegram API 退出群组并更新数据库状态
   */
  async leaveGroup(groupId: string): Promise<boolean> {
    // 获取群组信息
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    })

    if (!group) {
      throw new Error('Group not found')
    }

    // 获取 Bot 实例
    const bot = await botConfigService.createBotInstance()

    if (!bot) {
      throw new Error('Bot not configured')
    }

    try {
      // 使用事务确保 API 调用和数据库更新的一致性
      return await prisma.$transaction(async (tx) => {
        // 调用 Telegram API 退出群组
        await bot.api.leaveChat(group.chatId)

        // 更新数据库状态
        await tx.group.update({
          where: { id: groupId },
          data: {
            isActive: false,
            leftAt: new Date(),
            updatedAt: new Date(),
          },
        })

        return true
      })
    } catch (error) {
      throw new Error(
        `Failed to leave group: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * 更新群组信息（从 Telegram API 获取最新信息）
   */
  async updateGroupInfo(groupId: string): Promise<Group> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    })

    if (!group) {
      throw new Error('Group not found')
    }

    const bot = await botConfigService.createBotInstance()

    if (!bot) {
      throw new Error('Bot not configured')
    }

    try {
      // 获取最新的群组信息
      const chat = await bot.api.getChat(group.chatId)

      // 更新数据库
      return prisma.group.update({
        where: { id: groupId },
        data: {
          title: chat.title || group.title,
          updatedAt: new Date(),
        },
      })
    } catch (error) {
      throw new Error(
        `Failed to update group info: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

// 导出单例实例
export const groupService = new GroupService()
