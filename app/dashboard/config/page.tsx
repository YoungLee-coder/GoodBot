'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { toast, handleApiResponse } from '@/lib/use-toast'
import { get, post } from '@/lib/api-client'

interface BotInfo {
  id: number
  username: string
  firstName: string
  isActive: boolean
  webhookUrl: string | null
  canJoinGroups: boolean
  canReadAllGroupMessages: boolean
  supportsInlineQueries: boolean
}

export default function BotConfigPage() {
  const [token, setToken] = useState('')
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingInfo, setLoadingInfo] = useState(true)

  // 需求: 1.5 - 显示当前 Bot 的基本信息
  useEffect(() => {
    fetchBotInfo()
  }, [])

  const fetchBotInfo = async () => {
    try {
      setLoadingInfo(true)
      const response = await get<BotInfo>('/api/bot/info')
      
      // 检查是否是认证错误
      if ('error' in response && response.error?.code === 'UNAUTHORIZED') {
        window.location.href = '/login?session=expired'
        return
      }
      
      const data = handleApiResponse(response, { showSuccess: false })
      if (data) {
        setBotInfo(data)
      } else {
        // 没有配置，这是正常的
        setBotInfo(null)
      }
    } catch (err) {
      console.error('Error fetching bot info:', err)
    } finally {
      setLoadingInfo(false)
    }
  }

  // 需求: 1.2 - 验证 Token 有效性并存储
  // 需求: 1.3 - Token 验证失败时显示错误信息
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await post('/api/bot/config', { token })
      
      const data = handleApiResponse(response, {
        successMessage: 'Bot 配置保存成功！',
      })

      if (data) {
        setToken('')
        // 刷新 Bot 信息
        await fetchBotInfo()
      }
    } catch (err) {
      toast.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0 space-y-6">
      {/* 需求: 1.1 - 显示 Bot Token 配置页面 */}
      <Card>
        <CardHeader>
          <CardTitle>Bot 配置</CardTitle>
          <CardDescription>
            输入您的 Telegram Bot Token 来配置 Bot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Bot Token</Label>
              <Input
                id="token"
                type="text"
                placeholder="输入您的 Bot Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-sm text-gray-500">
                从 @BotFather 获取您的 Bot Token
              </p>
            </div>

            <Button type="submit" disabled={loading || !token}>
              {loading && <Spinner size="sm" />}
              {loading ? '保存中...' : '保存配置'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 需求: 1.5 - 显示 Bot 信息（用户名、状态） */}
      <Card>
        <CardHeader>
          <CardTitle>Bot 信息</CardTitle>
          <CardDescription>
            当前 Bot 的基本信息和状态
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInfo ? (
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <p className="text-sm text-gray-500">加载中...</p>
            </div>
          ) : botInfo ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">用户名</p>
                  <p className="text-base font-semibold">@{botInfo.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">名称</p>
                  <p className="text-base font-semibold">{botInfo.firstName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Bot ID</p>
                  <p className="text-base font-mono">{botInfo.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">状态</p>
                  <p className="text-base">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        botInfo.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {botInfo.isActive ? '活跃' : '未激活'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-sm font-medium text-gray-500 mb-2">功能</p>
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <span className={botInfo.canJoinGroups ? 'text-green-600' : 'text-gray-400'}>
                      {botInfo.canJoinGroups ? '✓' : '✗'}
                    </span>
                    <span className="ml-2">可以加入群组</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className={botInfo.canReadAllGroupMessages ? 'text-green-600' : 'text-gray-400'}>
                      {botInfo.canReadAllGroupMessages ? '✓' : '✗'}
                    </span>
                    <span className="ml-2">可以读取所有群组消息</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className={botInfo.supportsInlineQueries ? 'text-green-600' : 'text-gray-400'}>
                      {botInfo.supportsInlineQueries ? '✓' : '✗'}
                    </span>
                    <span className="ml-2">支持内联查询</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              尚未配置 Bot。请在上方输入 Bot Token 进行配置。
            </p>
          )}
        </CardContent>
      </Card>

      {/* 显示 Webhook 状态 */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook 状态</CardTitle>
          <CardDescription>
            Telegram Webhook 配置信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInfo ? (
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <p className="text-sm text-gray-500">加载中...</p>
            </div>
          ) : botInfo ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Webhook URL</p>
                <p className="text-sm font-mono mt-1 break-all">
                  {botInfo.webhookUrl || '未设置'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">状态</p>
                <p className="text-sm mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      botInfo.webhookUrl
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {botInfo.webhookUrl ? '已配置' : '未配置'}
                  </span>
                </p>
              </div>
              {botInfo.webhookUrl && (
                <p className="text-xs text-gray-500 mt-2">
                  Webhook 在保存 Bot 配置时自动设置
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              配置 Bot 后将自动设置 Webhook
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
