import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { botConfigService } from "@/lib/bot-config-service";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  // 获取关键指标
  const [totalMessages, totalGroups, todayMessages, recentMessages, botInfo, botConfig] = await Promise.all([
    // 消息总数
    prisma.message.count(),
    
    // 活跃群组数量
    prisma.group.count({
      where: { isActive: true }
    }),
    
    // 今日消息数
    prisma.message.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    
    // 最近消息列表（最近10条）
    prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    
    // Bot 信息
    botConfigService.getBotInfo().catch(() => null),
    
    // Bot 配置
    botConfigService.getActiveConfig(),
  ]);

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* 欢迎信息 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          欢迎回来，{session?.user?.name || session?.user?.email}
        </h2>
        <p className="text-gray-600 mt-1">
          这是 GoodBot 管理系统的仪表板概览
        </p>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* 消息总数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">消息总数</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              所有接收和发送的消息
            </p>
          </CardContent>
        </Card>

        {/* 群组数量 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃群组</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGroups}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Bot 已加入的群组
            </p>
          </CardContent>
        </Card>

        {/* 今日消息 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日消息</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              今天接收的消息数量
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 最近消息列表 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>最近消息</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>暂无消息</p>
                <p className="text-sm mt-2">配置 Bot 后开始接收消息</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMessages.map((message) => (
                  <Link
                    key={message.id}
                    href={`/dashboard/messages/${message.chatId}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">
                            {message.senderFirstName || message.senderUsername || '未知用户'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            message.direction === 'incoming' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {message.direction === 'incoming' ? '接收' : '发送'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {message.chatType}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {message.text || '(无文本内容)'}
                        </p>
                      </div>
                      <div className="ml-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(message.createdAt).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </Link>
                ))}
                
                {recentMessages.length > 0 && (
                  <div className="pt-4 border-t">
                    <Link
                      href="/dashboard/messages"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      查看所有消息 →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bot 状态 */}
        <Card>
          <CardHeader>
            <CardTitle>Bot 状态</CardTitle>
          </CardHeader>
          <CardContent>
            {!botConfig ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">未配置</p>
                <p className="text-xs text-gray-500 mb-4">
                  请先配置 Bot Token
                </p>
                <Link
                  href="/dashboard/config"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  前往配置
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 mb-1">运行中</p>
                  <p className="text-xs text-gray-500">Bot 正常运行</p>
                </div>

                {botInfo && (
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">用户名</span>
                      <span className="font-medium text-gray-900">@{botInfo.username}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Bot ID</span>
                      <span className="font-medium text-gray-900">{botInfo.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Webhook</span>
                      <span className={`font-medium ${botConfig.webhookUrl ? 'text-green-600' : 'text-yellow-600'}`}>
                        {botConfig.webhookUrl ? '已设置' : '未设置'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Link
                    href="/dashboard/config"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    管理配置 →
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
