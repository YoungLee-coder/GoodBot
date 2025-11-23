import { Bot } from "grammy";
import { db } from "@/lib/db";
import { lotteries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scheduleDrawing } from "./lottery-handler";

// 恢复所有待开奖的定时任务
export async function restoreScheduledDrawings(bot: Bot) {
    try {
        console.log("Restoring scheduled lottery drawings...");
        
        // 获取所有进行中的抽奖
        const activeLotteries = await db
            .select()
            .from(lotteries)
            .where(eq(lotteries.status, "active"));

        let restoredCount = 0;
        const now = new Date();

        for (const lottery of activeLotteries) {
            if (lottery.scheduledEndTime) {
                if (lottery.scheduledEndTime > now) {
                    // 还未到开奖时间，恢复定时任务
                    scheduleDrawing(lottery.id, lottery.scheduledEndTime, bot);
                    restoredCount++;
                } else {
                    // 已过期，立即开奖
                    console.log(`Lottery ${lottery.id} is overdue, drawing now...`);
                    const { performDrawing } = await import("./lottery-handler");
                    await performDrawing(lottery.id, bot);
                }
            }
        }

        console.log(`Restored ${restoredCount} scheduled lottery drawings`);
    } catch (error) {
        console.error("Failed to restore scheduled drawings:", error);
    }
}
