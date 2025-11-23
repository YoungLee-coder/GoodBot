import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lotteries } from "@/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { getBot } from "@/lib/bot";
import { performDrawing } from "@/lib/bot/lottery-handler";

// 这个 API 会被 Vercel Cron 定期调用
export async function GET(request: Request) {
    try {
        // 验证请求来自 Vercel Cron（可选，增加安全性）
        const authHeader = request.headers.get("authorization");
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const bot = await getBot();
        if (!bot) {
            return NextResponse.json({ error: "Bot not initialized" }, { status: 500 });
        }

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

        const results = [];
        for (const lottery of expiredLotteries) {
            console.log(`[Cron] Drawing lottery ${lottery.id}: ${lottery.title}`);
            await performDrawing(lottery.id, bot);
            results.push({ id: lottery.id, title: lottery.title });
        }

        return NextResponse.json({
            success: true,
            checked: new Date().toISOString(),
            expired: results.length,
            lotteries: results,
        });
    } catch (error) {
        console.error("[Cron] Failed to check lotteries:", error);
        return NextResponse.json(
            { error: "Failed to check lotteries" },
            { status: 500 }
        );
    }
}
