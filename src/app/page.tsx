import { isAppInitialized } from "@/lib/settings";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Activity } from "lucide-react";
import { db } from "@/lib/db";
import { users, groups, messages } from "@/lib/db/schema";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Dashboard() {
  const initialized = await isAppInitialized();
  if (!initialized) {
    redirect("/setup");
  }

  const [userCount] = await db.select({ count: count() }).from(users);
  const [groupCount] = await db.select({ count: count() }).from(groups);
  const [messageCount] = await db.select({ count: count() }).from(messages);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount?.count ?? 0}</div>
            <p className="text-xs text-muted-foreground">Active users interacting with bot</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupCount?.count ?? 0}</div>
            <p className="text-xs text-muted-foreground">Groups managed by bot</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Processed</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messageCount?.count ?? 0}</div>
            <p className="text-xs text-muted-foreground">Total messages handled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Bot Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Online</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
