import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
}

async function getGroups(): Promise<Group[]> {
  const { prisma } = await import("@/lib/prisma");
  
  const groups = await prisma.group.findMany({
    orderBy: { joinedAt: "desc" },
  });

  return groups.map((g) => ({
    ...g,
    joinedAt: g.joinedAt.toISOString(),
    leftAt: g.leftAt?.toISOString() || null,
    updatedAt: g.updatedAt.toISOString(),
  }));
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

export default async function GroupsPage() {
  const groups = await getGroups();

  return (
    <div className="px-4 py-6 sm:px-0">
      <Card>
        <CardHeader>
          <CardTitle>群组管理</CardTitle>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>暂无群组</p>
              <p className="text-sm mt-2">将 Bot 添加到群组后会自动显示在这里</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/dashboard/groups/${group.id}`}
                  className="block"
                >
                  <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                    {/* 群组图标 */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                        {group.title[0]?.toUpperCase() || "G"}
                      </div>
                    </div>

                    {/* 群组信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {group.title}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatDate(group.joinedAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          {group.memberCount !== null
                            ? `${group.memberCount} 成员`
                            : "未知"}
                        </span>
                        
                        <span className="text-gray-400">•</span>
                        
                        <span>{getGroupTypeLabel(group.type)}</span>
                        
                        <span className="text-gray-400">•</span>
                        
                        <span
                          className={`inline-flex items-center gap-1 ${
                            group.isActive ? "text-green-600" : "text-gray-400"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              group.isActive ? "bg-green-600" : "bg-gray-400"
                            }`}
                          />
                          {group.isActive ? "活跃" : "已退出"}
                        </span>
                      </div>
                    </div>

                    {/* 箭头图标 */}
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
        </CardContent>
      </Card>
    </div>
  );
}
