import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

interface Message {
  id: string;
  messageId: string;
  chatId: string;
  chatType: string;
  senderId: string | null;
  senderUsername: string | null;
  senderFirstName: string | null;
  text: string | null;
  direction: string;
  status: string;
  createdAt: string;
}

interface PaginatedMessages {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

async function getMessages(page: number = 1): Promise<PaginatedMessages> {
  const limit = 50;
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.message.count(),
  ]);

  return {
    messages: messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
    hasMore: skip + messages.length < total,
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getChatDisplayName(message: Message): string {
  if (message.chatType === "private") {
    return (
      message.senderFirstName ||
      message.senderUsername ||
      `用户 ${message.senderId}`
    );
  }
  return `群组 ${message.chatId}`;
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1", 10);
  const data = await getMessages(currentPage);

  // 按 chatId 分组消息，只显示每个对话的最新消息
  const conversationMap = new Map<string, Message>();
  
  for (const message of data.messages) {
    const existing = conversationMap.get(message.chatId);
    if (!existing || new Date(message.createdAt) > new Date(existing.createdAt)) {
      conversationMap.set(message.chatId, message);
    }
  }

  const conversations = Array.from(conversationMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="px-4 py-6 sm:px-0">
      <Card>
        <CardHeader>
          <CardTitle>消息列表</CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>暂无消息</p>
              <p className="text-sm mt-2">等待用户向 Bot 发送消息</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((message) => (
                <Link
                  key={message.chatId}
                  href={`/dashboard/messages/${message.chatId}`}
                  className="block"
                >
                  <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                    {/* 头像 */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                        {message.chatType === "private"
                          ? (message.senderFirstName?.[0] ||
                              message.senderUsername?.[0] ||
                              "U")
                          : "G"}
                      </div>
                    </div>

                    {/* 消息内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {getChatDisplayName(message)}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {message.direction === "outgoing" && (
                          <span className="text-xs text-blue-600 flex-shrink-0">
                            我:
                          </span>
                        )}
                        <p className="text-sm text-gray-600 truncate">
                          {message.text || "(无文本内容)"}
                        </p>
                      </div>
                      {message.status === "failed" && (
                        <span className="inline-block mt-1 text-xs text-red-600">
                          发送失败
                        </span>
                      )}
                    </div>

                    {/* 未读标识（可选，暂时不实现） */}
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* 分页控件 */}
          {data.total > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600">
                共 {data.total} 条消息
              </div>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link href={`/dashboard/messages?page=${currentPage - 1}`}>
                    <Button variant="outline" size="sm">
                      上一页
                    </Button>
                  </Link>
                )}
                <span className="inline-flex items-center px-3 text-sm text-gray-700">
                  第 {currentPage} 页
                </span>
                {data.hasMore && (
                  <Link href={`/dashboard/messages?page=${currentPage + 1}`}>
                    <Button variant="outline" size="sm">
                      下一页
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
