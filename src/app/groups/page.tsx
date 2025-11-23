import { db } from "@/lib/db";
import { groups, lotteries, lotteryParticipants } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { GroupsPageClient } from "./page-client";
import { isAppInitialized } from "@/lib/settings";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GroupsPage() {
    const initialized = await isAppInitialized();
    if (!initialized) {
        redirect("/setup");
    }

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

    return <GroupsPageClient groups={allGroups} lotteries={allLotteries} />;
}
