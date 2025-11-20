"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Group {
  id: string;
  chatId: string;
  title: string;
  type: string;
  memberCount: number | null;
  joinedAt: string;
  leftAt: string | null;
  isActive: boolean;
  updatedAt: string;
  messageCount?: number;
  lastMessageAt?: string | null;
}

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

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getGroupTypeLabel(type: string): string {
  switch (type) {
    case "group":
      return "群组";
    case "supergroup":
      return "超级群组";
    default:
      return type;
  }
}

export default function GroupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载群组详情
  const loadGroupDetails = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);

      if (!res.ok) {
        throw new Error("Failed to load group details");
      }

      const data = await res.json();
      setGroup(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载群组详情失败");
    }
  };

  // 加载消息
  const loadMessages = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/groups/${groupId}/messages?page=${pageNum}&limit=50`
      );

      if (!res.ok) {
        throw new Error("Failed to load messages");
      }

      const data = await res.json();
      const result: PaginatedMessages = data.data;

      setMessages(result.messages);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载消息失败");
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || sending || !group) {
      return;
    }

    try {
      setSending(true);
      setSendError(null);
      setSendSuccess(false);

      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: group.chatId,
          text: messageText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "发送失败");
      }

      // 发送成功
      setSendSuccess(true);
      setMessageText("");

      // 重新加载消息列表
      await loadMessages(page);

      // 3秒后清除成功提示
      setTimeout(() => {
        setSendSuccess(false);
      }, 3000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "发送消息失败");
    } finally {
      setSending(false);
    }
  };

  // 退出群组
  const handleLeaveGroup = async () => {
    if (leaving) return;

    try {
      setLeaving(true);

      const res = await fetch(`/api/groups/${groupId}/leave`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "退出群组失败");
      }

      // 退出成功，返回群组列表
      router.push("/dashboard/groups");
    } catch (err) {
      alert(err instanceof Error ? err.message : "退出群组失败");
      setLeaving(false);
      setShowLeaveDialog(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadGroupDetails();
    loadMessages(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading && !group) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">加载中...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button
                onClick={() => {
                  loadGroupDetails();
                  loadMessages(page);
                }}
                variant="outline"
                className="mt-4"
              >
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => router.push("/dashboard/groups")}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Button>
              <div>
                <CardTitle>{group?.title || "群组详情"}</CardTitle>
                {group && (
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span>
                      {group.memberCount !== null
                        ? `${group.memberCount} 成员`
                        : "未知成员数"}
                    </span>
                    <span>•</span>
                    <span>{getGroupTypeLabel(group.type)}</span>
                    <span>•</span>
                    <span>加入于 {formatDate(group.joinedAt)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {group?.isActive && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowLeaveDialog(true)}
              >
                退出群组
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* 消息列表 */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {loading && messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                加载中...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无消息
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.direction === "outgoing"
                        ? "flex-row-reverse"
                        : "flex-row"
                    }`}
                  >
                    {/* 头像 */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                          message.direction === "outgoing"
                            ? "bg-gradient-to-br from-green-400 to-green-600"
                            : "bg-gradient-to-br from-blue-400 to-blue-600"
                        }`}
                      >
                        {message.direction === "outgoing"
                          ? "我"
                          : message.senderFirstName?.[0] ||
                            message.senderUsername?.[0] ||
                            "U"}
                      </div>
                    </div>

                    {/* 消息内容 */}
                    <div
                      className={`flex-1 max-w-[70%] ${
                        message.direction === "outgoing"
                          ? "items-end"
                          : "items-start"
                      }`}
                    >
                      <div
                        className={`flex flex-col gap-1 ${
                          message.direction === "outgoing"
                            ? "items-end"
                            : "items-start"
                        }`}
                      >
                        {/* 发送者名称 */}
                        {message.direction === "incoming" && (
                          <div className="text-xs text-gray-600 px-1">
                            {message.senderFirstName ||
                              message.senderUsername ||
                              `用户 ${message.senderId}`}
                          </div>
                        )}

                        {/* 消息气泡 */}
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.direction === "outgoing"
                              ? message.status === "failed"
                                ? "bg-red-100 text-red-900"
                                : "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.text || "(无文本内容)"}
                          </p>
                        </div>

                        {/* 时间和状态 */}
                        <div
                          className={`text-xs text-gray-500 px-1 flex items-center gap-2 ${
                            message.direction === "outgoing"
                              ? "flex-row-reverse"
                              : "flex-row"
                          }`}
                        >
                          <span>{formatTime(message.createdAt)}</span>
                          {message.direction === "outgoing" && (
                            <span>
                              {message.status === "sent" && "✓"}
                              {message.status === "failed" && "✗ 失败"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* 分页控件 */}
          {total > 50 && (
            <div className="flex items-center justify-center gap-2 py-3 border-t bg-gray-50">
              {page > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadMessages(page - 1)}
                  disabled={loading}
                >
                  上一页
                </Button>
              )}
              <span className="text-sm text-gray-600">第 {page} 页</span>
              {hasMore && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadMessages(page + 1)}
                  disabled={loading}
                >
                  下一页
                </Button>
              )}
            </div>
          )}

          {/* 消息发送框 */}
          {group?.isActive && (
            <div className="border-t p-4 bg-white">
              {sendError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  {sendError}
                </div>
              )}

              {sendSuccess && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                  消息发送成功！
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="输入消息..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" disabled={sending || !messageText.trim()}>
                  {sending ? "发送中..." : "发送"}
                </Button>
              </form>
            </div>
          )}

          {!group?.isActive && (
            <div className="border-t p-4 bg-gray-50">
              <p className="text-center text-sm text-gray-500">
                Bot 已退出此群组，无法发送消息
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 退出群组确认对话框 */}
      {showLeaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">确认退出群组</h3>
            <p className="text-gray-600 mb-6">
              确定要让 Bot 退出群组 &ldquo;{group?.title}&rdquo; 吗？此操作无法撤销。
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowLeaveDialog(false)}
                disabled={leaving}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleLeaveGroup}
                disabled={leaving}
              >
                {leaving ? "退出中..." : "确认退出"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
