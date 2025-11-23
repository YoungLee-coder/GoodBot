"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Activity, UserCheck, AlertCircle } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type AdminInfo = {
  isLinked: boolean;
  chatId?: number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export default function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ users: 0, groups: 0, messages: 0 });
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [unbinding, setUnbinding] = useState(false);

  useEffect(() => {
    // 获取统计数据和管理员信息
    async function fetchData() {
      try {
        const adminRes = await fetch("/api/admin-info");
        const adminData = await adminRes.json();
        setAdminInfo(adminData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getAdminDisplayName = () => {
    if (!adminInfo?.isLinked) return null;
    
    const parts = [];
    if (adminInfo.firstName) parts.push(adminInfo.firstName);
    if (adminInfo.lastName) parts.push(adminInfo.lastName);
    
    return parts.length > 0 ? parts.join(" ") : null;
  };

  const handleUnbind = async () => {
    if (!confirm(t.dashboard.unbindConfirm)) return;

    setUnbinding(true);
    try {
      const res = await fetch("/api/admin-info/unbind", { method: "POST" });
      if (res.ok) {
        alert(t.dashboard.unbindSuccess);
        // 刷新管理员信息
        const adminRes = await fetch("/api/admin-info");
        const adminData = await adminRes.json();
        setAdminInfo(adminData);
      } else {
        alert(t.dashboard.unbindFailed);
      }
    } catch (error) {
      console.error("Failed to unbind admin:", error);
      alert(t.dashboard.unbindFailed);
    } finally {
      setUnbinding(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">{t.dashboard.title}</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.dashboard.totalUsers}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-muted-foreground">{t.dashboard.activeUsersDesc}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.dashboard.activeGroups}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.groups}</div>
            <p className="text-xs text-muted-foreground">{t.dashboard.groupsDesc}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.dashboard.messagesProcessed}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messages}</div>
            <p className="text-xs text-muted-foreground">{t.dashboard.messagesDesc}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{t.dashboard.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t.dashboard.noActivity}</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t.dashboard.botStatus}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">{t.dashboard.online}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            {t.dashboard.adminInfo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t.common.loading}</p>
          ) : adminInfo?.isLinked ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {t.dashboard.adminLinked}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleUnbind}
                  disabled={unbinding}
                >
                  {unbinding ? t.common.loading : t.dashboard.unbindAdmin}
                </Button>
              </div>
              <div className="grid gap-2 text-sm">
                {getAdminDisplayName() && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground">{t.dashboard.name}:</span>
                    <span className="font-medium">{getAdminDisplayName()}</span>
                  </div>
                )}
                {adminInfo.username && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground">{t.dashboard.username}:</span>
                    <span className="font-mono">@{adminInfo.username}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-muted-foreground">{t.dashboard.telegramId}:</span>
                  <span className="font-mono">{adminInfo.chatId}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mb-2">
                  {t.dashboard.adminNotLinked}
                </span>
                <p className="text-sm text-muted-foreground mt-2">
                  {t.dashboard.adminNotLinkedDesc}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
