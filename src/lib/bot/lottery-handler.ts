import { Bot, InlineKeyboard, Context } from "grammy";
import { db } from "@/lib/db";
import { lotteries, lotteryParticipants, groups, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// 处理抽奖创建流程中的消息
export async function handleLotteryCreationMessage(
    ctx: Context,
    session: any,
    lotteryCreationSessions: Map<number, any>
) {
    const userId = ctx.from!.id;
    const text = ctx.message?.text?.trim();

    if (!text) return false;

    const now = Date.now();
    if (now - session.timestamp > 120000) {
        lotteryCreationSessions.delete(userId);
        await ctx.reply(
            "⏱️ 创建超时，请重新使用 /create_lottery 命令。\n" +
            "⏱️ Creation timeout. Please use /create_lottery again."
        );
        return true;
    }

    // 更新时间戳
    session.timestamp = now;

    if (session.step === "waiting_title") {
        session.title = text;
        session.step = "waiting_keyword";
        await ctx.reply(
            "✅ 活动名称已设置\n\n" +
            "🔑 请输入参与关键词\n" +
            "⏱️ 你有 120 秒的时间输入\n\n" +
            "💡 用户需要在群组中发送此关键词来参与抽奖"
        );
        return true;
    }

    if (session.step === "waiting_keyword") {
        session.keyword = text;
        session.step = "waiting_duration";
        
        const keyboard = new InlineKeyboard()
            .text("1 小时", "lottery_duration_1h")
            .text("1 天", "lottery_duration_1d")
            .text("3 天", "lottery_duration_3d");

        await ctx.reply(
            "✅ 参与关键词已设置\n\n" +
            "⏰ 请选择开奖时间\n" +
            "⏱️ 你有 120 秒的时间选择",
            { reply_markup: keyboard }
        );
        return true;
    }

    return false;
}

// 处理抽奖时长选择
export async function handleLotteryDurationCallback(
    ctx: Context,
    duration: string,
    lotteryCreationSessions: Map<number, any>,
    bot: Bot
) {
    const userId = ctx.from!.id;
    const session = lotteryCreationSessions.get(userId);

    if (!session || session.step !== "waiting_duration") {
        return ctx.answerCallbackQuery({ text: "会话已过期", show_alert: true });
    }

    // 计算结束时间
    const now = new Date();
    let scheduledEndTime: Date;
    let durationText: string;

    switch (duration) {
        case "1h":
            scheduledEndTime = new Date(now.getTime() + 60 * 60 * 1000);
            durationText = "1 小时";
            break;
        case "1d":
            scheduledEndTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            durationText = "1 天";
            break;
        case "3d":
            scheduledEndTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
            durationText = "3 天";
            break;
        default:
            return ctx.answerCallbackQuery({ text: "无效的时长", show_alert: true });
    }

    // 创建抽奖记录
    const [lottery] = await db.insert(lotteries).values({
        groupId: session.groupId,
        title: session.title,
        keyword: session.keyword,
        description: `发送关键词 "${session.keyword}" 参与抽奖`,
        winnerCount: 1,
        creatorId: userId,
        status: "active",
        scheduledEndTime,
    }).returning();

    // 在群组中发送抽奖消息
    try {
        const message = await ctx.api.sendMessage(
            session.groupId,
            `🎊 *${session.title}*\n\n` +
            `🔑 参与方式：发送关键词 *${session.keyword}*\n` +
            `⏰ 开奖时间：${scheduledEndTime.toLocaleString("zh-CN")}\n` +
            `⏱️ 剩余时间：${durationText}\n` +
            `👤 发起人：${ctx.from!.first_name}\n\n` +
            `当前参与人数：0`,
            { parse_mode: "Markdown" }
        );

        // 更新消息 ID
        await db.update(lotteries)
            .set({ messageId: message.message_id })
            .where(eq(lotteries.id, lottery.id));

        // 通知管理员
        await ctx.editMessageText(
            `✅ *抽奖创建成功！*\n\n` +
            `📝 活动名称：${session.title}\n` +
            `🔑 参与关键词：${session.keyword}\n` +
            `⏰ 开奖时间：${scheduledEndTime.toLocaleString("zh-CN")}\n\n` +
            `抽奖消息已发送到群组`,
            { parse_mode: "Markdown" }
        );

        // 清理会话
        lotteryCreationSessions.delete(userId);

        // 设置定时开奖
        scheduleDrawing(lottery.id, scheduledEndTime, bot);

        await ctx.answerCallbackQuery({ text: "✅ 创建成功！" });
    } catch (error) {
        console.error("Failed to create lottery:", error);
        await ctx.answerCallbackQuery({ text: "❌ 创建失败", show_alert: true });
        lotteryCreationSessions.delete(userId);
    }
}

// 处理用户参与抽奖（通过关键词）
export async function handleLotteryParticipation(
    ctx: Context,
    keyword: string
) {
    if (!ctx.from || !ctx.chat) return false;
    
    const userId = ctx.from.id;
    const groupId = ctx.chat.id;

    console.log(`Checking lottery participation: keyword="${keyword}", groupId=${groupId}`);

    // 查找匹配关键词的活跃抽奖
    const matchingLotteries = await db
        .select()
        .from(lotteries)
        .where(
            and(
                eq(lotteries.groupId, groupId),
                eq(lotteries.keyword, keyword),
                eq(lotteries.status, "active")
            )
        );

    console.log(`Found ${matchingLotteries.length} matching lotteries`);

    if (matchingLotteries.length === 0) {
        return false; // 不是抽奖关键词
    }

    const lottery = matchingLotteries[0];

    // 检查是否已参与
    const existing = await db
        .select()
        .from(lotteryParticipants)
        .where(
            and(
                eq(lotteryParticipants.lotteryId, lottery.id),
                eq(lotteryParticipants.userId, userId)
            )
        );

    if (existing.length > 0) {
        // 已参与，私聊提醒
        try {
            await ctx.api.sendMessage(
                userId,
                `ℹ️ 你已经参与过抽奖活动「${lottery.title}」了\n\n` +
                `⏰ 开奖时间：${lottery.scheduledEndTime?.toLocaleString("zh-CN")}`
            );
        } catch (e) {
            // 无法发送私聊，忽略
        }
        return true;
    }

    // 添加参与者
    await db.insert(lotteryParticipants).values({
        lotteryId: lottery.id,
        userId,
    });

    // 更新群组消息的参与人数
    const participants = await db
        .select()
        .from(lotteryParticipants)
        .where(eq(lotteryParticipants.lotteryId, lottery.id));

    if (lottery.messageId) {
        try {
            const timeLeft = getTimeLeft(lottery.scheduledEndTime!);
            await ctx.api.editMessageText(
                groupId,
                lottery.messageId,
                `🎊 *${lottery.title}*\n\n` +
                `🔑 参与方式：发送关键词 *${lottery.keyword}*\n` +
                `⏰ 开奖时间：${lottery.scheduledEndTime?.toLocaleString("zh-CN")}\n` +
                `⏱️ 剩余时间：${timeLeft}\n` +
                `👤 发起人：${ctx.from!.first_name}\n\n` +
                `当前参与人数：${participants.length}`,
                { parse_mode: "Markdown" }
            );
        } catch (e) {
            // 消息可能被删除，忽略
        }
    }

    // 私聊通知参与成功
    try {
        await ctx.api.sendMessage(
            userId,
            `✅ *参与成功！*\n\n` +
            `🎊 活动：${lottery.title}\n` +
            `⏰ 开奖时间：${lottery.scheduledEndTime?.toLocaleString("zh-CN")}\n\n` +
            `祝你好运！🍀`,
            { parse_mode: "Markdown" }
        );
    } catch (e) {
        // 无法发送私聊，忽略
    }

    return true;
}

// 计算剩余时间
function getTimeLeft(endTime: Date): string {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) return "已结束";

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) return `${days}天${hours}小时`;
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
}

// 存储定时任务
const scheduledDrawings = new Map<number, NodeJS.Timeout>();

// 定时开奖
export function scheduleDrawing(lotteryId: number, endTime: Date, bot: Bot) {
    // 清除已存在的定时任务
    const existing = scheduledDrawings.get(lotteryId);
    if (existing) {
        clearTimeout(existing);
    }

    const delay = endTime.getTime() - Date.now();
    if (delay > 0) {
        const timeout = setTimeout(async () => {
            await performDrawing(lotteryId, bot);
            scheduledDrawings.delete(lotteryId);
        }, delay);
        scheduledDrawings.set(lotteryId, timeout);
    }
}

// 取消定时开奖
export function cancelScheduledDrawing(lotteryId: number) {
    const existing = scheduledDrawings.get(lotteryId);
    if (existing) {
        clearTimeout(existing);
        scheduledDrawings.delete(lotteryId);
    }
}

// 执行开奖
export async function performDrawing(lotteryId: number, bot: Bot) {
    try {
        const [lottery] = await db
            .select()
            .from(lotteries)
            .where(eq(lotteries.id, lotteryId));

        if (!lottery || lottery.status !== "active") return;

        // 获取所有参与者
        const participants = await db
            .select()
            .from(lotteryParticipants)
            .where(eq(lotteryParticipants.lotteryId, lotteryId));

        if (participants.length === 0) {
            // 没有参与者
            await db.update(lotteries)
                .set({ status: "ended", endedAt: new Date() })
                .where(eq(lotteries.id, lotteryId));

            // 更新群组消息
            if (lottery.messageId) {
                try {
                    await bot.api.editMessageText(
                        lottery.groupId,
                        lottery.messageId,
                        `🎊 *${lottery.title}* (已结束)\n\n` +
                        `🔑 参与关键词：${lottery.keyword}\n` +
                        `⏰ 开奖时间：${lottery.scheduledEndTime?.toLocaleString("zh-CN")}\n\n` +
                        `❌ 没有参与者，抽奖已取消`,
                        { parse_mode: "Markdown" }
                    );
                } catch (e) {
                    console.error("Failed to update message:", e);
                }
            }
            return;
        }

        // 随机抽取中奖者
        const winnerCount = Math.min(lottery.winnerCount, participants.length);
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        const winners = shuffled.slice(0, winnerCount);

        // 更新中奖者
        for (const winner of winners) {
            await db.update(lotteryParticipants)
                .set({ isWinner: true })
                .where(eq(lotteryParticipants.id, winner.id));
        }

        // 更新抽奖状态
        await db.update(lotteries)
            .set({ status: "ended", endedAt: new Date() })
            .where(eq(lotteries.id, lotteryId));

        // 获取中奖者信息
        let winnerText = "";
        for (const winner of winners) {
            const [user] = await db.select().from(users).where(eq(users.id, winner.userId));
            const name = user?.firstName || "Unknown";
            const username = user?.username ? `@${user.username}` : "";
            winnerText += `🏆 ${name} ${username}\n`;

            // 私聊通知中奖者
            try {
                await bot.api.sendMessage(
                    winner.userId,
                    `🎉 *恭喜中奖！*\n\n` +
                    `🎊 活动：${lottery.title}\n` +
                    `🏆 你在抽奖中获胜了！\n\n` +
                    `请联系活动发起人领取奖品。`,
                    { parse_mode: "Markdown" }
                );
            } catch (e) {
                console.error("Failed to notify winner:", e);
            }
        }

        // 更新群组消息
        if (lottery.messageId) {
            try {
                await bot.api.editMessageText(
                    lottery.groupId,
                    lottery.messageId,
                    `🎊 *${lottery.title}* (已结束)\n\n` +
                    `🔑 参与关键词：${lottery.keyword}\n` +
                    `⏰ 开奖时间：${lottery.scheduledEndTime?.toLocaleString("zh-CN")}\n` +
                    `🏁 实际结束：${new Date().toLocaleString("zh-CN")}\n\n` +
                    `总参与人数：${participants.length}\n\n` +
                    `*🎉 中奖名单：*\n${winnerText}`,
                    { parse_mode: "Markdown" }
                );
            } catch (e) {
                console.error("Failed to update message:", e);
            }
        }
    } catch (error) {
        console.error("Failed to perform drawing:", error);
    }
}

// 显示抽奖管理界面
export async function showLotteryManagement(ctx: Context, lotteryId: number) {
    const [lottery] = await db.select().from(lotteries).where(eq(lotteries.id, lotteryId));
    
    if (!lottery) {
        return ctx.answerCallbackQuery({ text: "抽奖不存在", show_alert: true });
    }

    const participants = await db.select()
        .from(lotteryParticipants)
        .where(eq(lotteryParticipants.lotteryId, lotteryId));

    const [group] = await db.select().from(groups).where(eq(groups.id, lottery.groupId));
    const groupName = group?.title || "未知群组";

    const keyboard = new InlineKeyboard()
        .text("⏰ 延迟 1 小时", `delay_lottery_${lotteryId}_1h`)
        .row()
        .text("⏰ 延迟 1 天", `delay_lottery_${lotteryId}_1d`)
        .row()
        .text("🏁 立即结束", `end_lottery_now_${lotteryId}`)
        .row()
        .text("« 返回列表", "back_to_lottery_list");

    const timeLeft = lottery.scheduledEndTime ? getTimeLeft(lottery.scheduledEndTime) : "未知";

    await ctx.editMessageText(
        `🎊 *${lottery.title}*\n\n` +
        `📍 群组：${groupName}\n` +
        `🔑 关键词：${lottery.keyword}\n` +
        `👥 参与人数：${participants.length}\n` +
        `⏰ 计划开奖：${lottery.scheduledEndTime?.toLocaleString("zh-CN")}\n` +
        `⏱️ 剩余时间：${timeLeft}\n` +
        `📊 状态：${lottery.status === "active" ? "进行中" : "已结束"}`,
        {
            parse_mode: "Markdown",
            reply_markup: keyboard,
        }
    );

    await ctx.answerCallbackQuery();
}

// 延迟抽奖
export async function delayLottery(ctx: Context, lotteryId: number, delayDuration: string, bot: Bot) {
    const [lottery] = await db.select().from(lotteries).where(eq(lotteries.id, lotteryId));
    
    if (!lottery || lottery.status !== "active") {
        return ctx.answerCallbackQuery({ text: "抽奖不存在或已结束", show_alert: true });
    }

    let newEndTime: Date;
    let delayText: string;

    const currentEndTime = lottery.scheduledEndTime || new Date();

    switch (delayDuration) {
        case "1h":
            newEndTime = new Date(currentEndTime.getTime() + 60 * 60 * 1000);
            delayText = "1 小时";
            break;
        case "1d":
            newEndTime = new Date(currentEndTime.getTime() + 24 * 60 * 60 * 1000);
            delayText = "1 天";
            break;
        default:
            return ctx.answerCallbackQuery({ text: "无效的延迟时长", show_alert: true });
    }

    // 更新数据库
    await db.update(lotteries)
        .set({ scheduledEndTime: newEndTime })
        .where(eq(lotteries.id, lotteryId));

    // 重新安排定时任务
    scheduleDrawing(lotteryId, newEndTime, bot);

    // 更新群组消息
    if (lottery.messageId) {
        try {
            const participants = await db.select()
                .from(lotteryParticipants)
                .where(eq(lotteryParticipants.lotteryId, lotteryId));

            const timeLeft = getTimeLeft(newEndTime);

            await ctx.api.editMessageText(
                lottery.groupId,
                lottery.messageId,
                `🎊 *${lottery.title}*\n\n` +
                `🔑 参与方式：发送关键词 *${lottery.keyword}*\n` +
                `⏰ 开奖时间：${newEndTime.toLocaleString("zh-CN")} ⏱️ (已延迟)\n` +
                `⏱️ 剩余时间：${timeLeft}\n\n` +
                `当前参与人数：${participants.length}`,
                { parse_mode: "Markdown" }
            );
        } catch (e) {
            console.error("Failed to update message:", e);
        }
    }

    await ctx.answerCallbackQuery({ text: `✅ 已延迟 ${delayText}` });
    await showLotteryManagement(ctx, lotteryId);
}

// 立即结束抽奖
export async function endLotteryNow(ctx: Context, lotteryId: number, bot: Bot) {
    const [lottery] = await db.select().from(lotteries).where(eq(lotteries.id, lotteryId));
    
    if (!lottery || lottery.status !== "active") {
        return ctx.answerCallbackQuery({ text: "抽奖不存在或已结束", show_alert: true });
    }

    await performDrawing(lotteryId, bot);
    await ctx.answerCallbackQuery({ text: "✅ 抽奖已结束" });

    // 返回列表
    await ctx.editMessageText(
        "✅ 抽奖已结束并公布结果\n\n" +
        "使用 /viewlottery 查看其他抽奖"
    );
}
