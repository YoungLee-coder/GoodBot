"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载消息
  const loadMessages = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/messages/${chatId}?page=${pageNum}&limit=50`);

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

    if (!replyText.trim() || sending) {
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
          chatId,
          text: replyText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "发送失败");
      }

      // 发送成功
      setSendSuccess(true);
      setReplyText("");

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

  // 初始加载
  useEffect(() => {
    loadMessages(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading && messages.length === 0) {
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

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button
                onClick={() => loadMessages(page)}
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

  const chatName =
    messages.length > 0 ? getChatDisplayName(messages[0]) : `对话 ${chatId}`;

  return (
    <div className="px-4 py-6 sm:px-0">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => router.push("/dashboard/messages")}
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
                <CardTitle>{chatName}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  共 {total} 条消息
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* 消息列表 */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
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
                          : message.chatType === "private"
                          ? message.senderFirstName?.[0] ||
                            message.senderUsername?.[0] ||
                            "U"
                          : "G"}
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

          {/* 回复输入框 */}
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
                ref={inputRef}
                type="text"
                placeholder="输入消息..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={sending}
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !replyText.trim()}>
                {sending ? "发送中..." : "发送"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
