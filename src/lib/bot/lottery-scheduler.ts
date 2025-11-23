import { Bot } from "grammy";
import { db } from "@/lib/db";
import { lotteries } from "@/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { scheduleDrawing, performDrawing } from "./lottery-handler";

// 定期检查的间隔（1分钟）
const CHECK_INTERVAL = 1 * 60 * 1000;
let checkInterval: NodeJS.Timeout | null = null;

// 检查并处理到期的抽奖
async function checkExpiredLotteries(bot: Bot) {
    try {
        const now = new Date();
        
        // 查找所有已到期但仍处于活跃状态的抽奖
        const expiredLotteries = await db
            .select()
            .from(lotteries)
            .where(
                and(
                    eq(lotteries.status, "active"),
                    lt(lotteries.scheduledEndTime, now)
                )
            );

        if (expiredLotteries.length > 0) {
            console.log(`Found ${expiredLotteries.length} expired lotteries, drawing now...`);
            
            for (const lottery of expiredLotteries) {
                console.log(`Drawing lottery ${lottery.id}: ${lottery.title}`);
                await performDrawing(lottery.id, bot);
            }
        }
    } catch (error) {
        console.error("Failed to check expired lotteries:", error);
    }
}

// 启动定期检查
export function startLotteryChecker(bot: Bot) {
    // 清除已存在的定时器
    if (checkInterval) {
        clearInterval(checkInterval);
    }

    // 立即检查一次
    checkExpiredLotteries(bot).catch(err => 
        console.error("Failed to check expired lotteries:", err)
    );

    // 设置定期检查
    checkInterval = setInterval(() => {
        checkExpiredLotteries(bot).catch(err => 
            console.error("Failed to check expired lotteries:", err)
        );
    }, CHECK_INTERVAL);

    console.log(`Lottery checker started, checking every ${CHECK_INTERVAL / 60000} minute(s)`);
}

// 停止定期检查
export function stopLotteryChecker() {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
        console.log("Lottery checker stopped");
    }
}

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
                    await performDrawing(lottery.id, bot);
                }
            }
        }

        console.log(`Restored ${restoredCount} scheduled lottery drawings`);
        
        // 启动定期检查器
        startLotteryChecker(bot);
    } catch (error) {
        console.error("Failed to restore scheduled drawings:", error);
    }
}
