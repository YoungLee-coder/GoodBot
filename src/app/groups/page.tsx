import { db } from "@/lib/db";
import { groups, lotteries, lotteryParticipants } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Gift, Trophy } from "lucide-react";
import { eq, desc, count, sql } from "drizzle-orm";

export default async function GroupsPage() {
    const allGroups = await db.select().from(groups);

    // 获取所有抽奖及其参与人数
    const allLotteries = await db
        .select({
            id: lotteries.id,
            groupId: lotteries.groupId,
            title: lotteries.title,
            description: lotteries.description,
            winnerCount: lotteries.winnerCount,
            status: lotteries.status,
            createdAt: lotteries.createdAt,
            endedAt: lotteries.endedAt,
            participantCount: count(lotteryParticipants.id),
        })
        .from(lotteries)
        .leftJoin(lotteryParticipants, eq(lotteries.id, lotteryParticipants.lotteryId))
        .groupBy(lotteries.id)
        .orderBy(desc(lotteries.createdAt));

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">群组管理</h1>
                <div className="text-sm text-muted-foreground">
                    总计: {allGroups.length} 个群组
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>已加入的群组</CardTitle>
                    <CardDescription>Bot 当前管理的所有群组</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>群组 ID</TableHead>
                                <TableHead>群组名称</TableHead>
                                <TableHead>类型</TableHead>
                                <TableHead>加入时间</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allGroups.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                        暂无群组。将 Bot 添加到群组后即可在此查看。
                                    </TableCell>
                                </TableRow>
                            ) : (
                                allGroups.map((group) => (
                                    <TableRow key={group.id}>
                                        <TableCell className="font-mono text-xs">{group.id}</TableCell>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            {group.title}
                                        </TableCell>
                                        <TableCell className="capitalize">{group.type}</TableCell>
                                        <TableCell>{group.createdAt?.toLocaleDateString("zh-CN")}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5" />
                        抽奖活动
                    </CardTitle>
                    <CardDescription>所有群组的抽奖活动记录</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>抽奖标题</TableHead>
                                <TableHead>所属群组</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead>参与人数</TableHead>
                                <TableHead>中奖人数</TableHead>
                                <TableHead>创建时间</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allLotteries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                        暂无抽奖活动。在群组中使用 /lottery 命令创建抽奖。
                                    </TableCell>
                                </TableRow>
                            ) : (
                                allLotteries.map((lottery) => {
                                    const group = allGroups.find(g => g.id === lottery.groupId);
                                    return (
                                        <TableRow key={lottery.id}>
                                            <TableCell className="font-medium">
                                                {lottery.title}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    {group?.title || "未知群组"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {lottery.status === "active" ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        进行中
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        已结束
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>{lottery.participantCount}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                                    {lottery.winnerCount}
                                                </div>
                                            </TableCell>
                                            <TableCell>{lottery.createdAt?.toLocaleDateString("zh-CN")}</TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
