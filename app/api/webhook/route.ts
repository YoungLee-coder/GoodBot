import { NextRequest, NextResponse } from 'next/server'
import { botConfigService } from '@/lib/bot-config-service'
import { messageService } from '@/lib/message-service'
import { groupService } from '@/lib/group-service'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit-middleware'
import { webhookUpdateSchema } from '@/lib/validation'
import type { Update } from 'grammy/types'

/**
 * Webhook 处理器
 * 需求: 2.1, 4.1, 5.1 - 接收 Telegram 消息更新
 * 需求: 6.1, 6.2, 6.3 - 安全措施（速率限制、输入验证、Token 验证）
 */
async function handleWebhook(request: NextRequest) {
  try {
    // 验证 Webhook 请求来源（使用 secret token）
    // 需求: 6.1, 6.2 - 验证请求来源
    const secretToken = request.headers.get('x-telegram-bot-api-secret-token')
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET

    if (expectedSecret && secretToken !== expectedSecret) {
      console.error('Invalid webhook secret token')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 获取并验证请求体
    const body = await request.json()
    
    // 需求: 6.3 - 验证所有用户输入
    const validationResult = webhookUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('Invalid webhook update format:', validationResult.error)
      return NextResponse.json(
        { error: 'Invalid update format' },
        { status: 400 }
      )
    }

    const update: Update = body

    // 获取活跃的 Bot 配置
    const config = await botConfigService.getActiveConfig()
    
    if (!config) {
      console.error('No active bot configuration found')
      return NextResponse.json(
        { error: 'Bot not configured' },
        { status: 500 }
      )
    }

    // 处理不同类型的更新
    await handleUpdate(update)

    // 返回成功响应
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST 路由处理器，带速率限制
 * 需求: 6.1, 6.2 - API 速率限制
 */
export async function POST(request: NextRequest) {
  return withRateLimit(rateLimitConfigs.webhook)(request, handleWebhook)
}

/**
 * 处理 Telegram 更新
 * 区分消息类型并调用相应的服务层方法
 */
async function handleUpdate(update: Update): Promise<void> {
  // 处理普通消息（私聊、群组消息）
  if (update.message) {
    const message = update.message
    const chatType = message.chat.type

    // 需求: 2.1 - 接收并存储消息
    await messageService.saveIncomingMessage(update)

    // 如果是群组消息，确保群组信息已保存
    // 需求: 5.1 - 接收群组消息
    if (chatType === 'group' || chatType === 'supergroup') {
      await groupService.saveGroup({
        chatId: message.chat.id.toString(),
        title: message.chat.title || 'Unknown Group',
        type: chatType,
      })
    }

    console.log(`Message received from ${chatType}: ${message.chat.id}`)
  }

  // 处理 Bot 加入/离开群组事件
  // 需求: 4.1 - Bot 加入群组时自动检测并存储
  if (update.my_chat_member) {
    const chatMember = update.my_chat_member
    const chat = chatMember.chat
    const newStatus = chatMember.new_chat_member.status
    
    // 检查 Bot 是否加入了群组
    if ((chat.type === 'group' || chat.type === 'supergroup') && 
        (newStatus === 'member' || newStatus === 'administrator')) {
      const result = await groupService.saveGroupFromChat(chat)
      
      if (result) {
        console.log(`Bot joined group: ${result.title} (${result.chatId})`)
      }
    }
  }

  // 处理群组成员变化事件（可选，用于更新成员数量）
  if (update.chat_member) {
    const chatMember = update.chat_member
    const chat = chatMember.chat

    if (chat.type === 'group' || chat.type === 'supergroup') {
      // 可以在这里更新群组成员数量
      console.log(`Chat member update in group: ${chat.id}`)
    }
  }
}

// 禁用 body parser，让 grammy 处理原始请求
export const runtime = 'nodejs'
