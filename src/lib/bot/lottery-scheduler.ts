import { Bot } from "grammy";
import { db } from "@/lib/db";
import { lotteries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scheduleDrawing, performDrawing } from "./lottery-handler";

/**
 * 恢复所有待开奖的定时任务
 * 
 * 注意：内存中的 setTimeout 在 Serverless 环境下不可靠，
 * 主要依赖 Vercel Cron Job (/api/cron/check-lotteries) 作为保底机制。
 * 这里的 setTimeout 仅作为活跃进程期间的优化。
 */
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
                    // 还未到开奖时间，恢复定时任务（作为优化，非必需）
                    scheduleDrawing(lottery.id, lottery.scheduledEndTime, bot);
                    restoredCount++;
                } else {
                    // 已过期，立即开奖
                    console.log(`Lottery ${lottery.id} is overdue, drawing now...`);
                    await performDrawing(lottery.id, bot);
                }
            }
        }

        console.log(`Restored ${restoredCount} scheduled lottery drawings`);
        console.log("Note: Vercel Cron Job serves as the primary mechanism for lottery drawing");
    } catch (error) {
        console.error("Failed to restore scheduled drawings:", error);
    }
}
