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
        session.step = "waiting_prize_name";
        session.prizes = [];
        await ctx.reply(
            "✅ 活动名称已设置\n\n" +
            "🎁 开始设置奖品\n" +
            "⏱️ 你有 120 秒的时间\n\n" +
            "📝 请发送第一个奖品的名称\n\n" +
            "💡 示例：一等奖、iPhone 15、现金红包等"
        );
        return true;
    }

    if (session.step === "waiting_prize_name") {
        // 保存奖品名称
        session.currentPrizeName = text;
        session.step = "waiting_prize_count";
        await ctx.reply(
            `✅ 奖品名称：${text}\n\n` +
            "🔢 请发送该奖品的数量\n\n" +
            "💡 示例：1、3、10 等"
        );
        return true;
    }

    if (session.step === "waiting_prize_count") {
        const count = parseInt(text);
        
        if (isNaN(count) || count < 1) {
            await ctx.reply(
                "❌ 数量必须是大于 0 的整数\n\n" +
                "请重新输入数量"
            );
            return true;
        }

        // 添加奖品到列表
        if (!session.prizes) session.prizes = [];
        session.prizes.push({
            name: session.currentPrizeName!,
            count: count
        });

        // 显示当前奖品列表
        const totalCount = session.prizes.reduce((sum: number, p: { name: string; count: number }) => sum + p.count, 0);
        const prizesSummary = session.prizes.map((p: { name: string; count: number }, i: number) => `  ${i + 1}. ${p.name} × ${p.count}`).join('\n');

        session.step = "waiting_prize_name";
        session.currentPrizeName = undefined;

        await ctx.reply(
            `✅ 已添加：${session.currentPrizeName} × ${count}\n\n` +
            "📋 当前奖品列表：\n" +
            prizesSummary + "\n" +
            `📊 总计：${totalCount} 个名额\n\n` +
            "➕ 继续添加奖品：发送奖品名称\n" +
            "✔️ 完成设置：发送 /next"
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

    // 计算总中奖人数
    const totalWinners = session.prizes?.reduce((sum: number, p: { name: string; count: number }) => sum + p.count, 0) || 1;

    // 创建抽奖记录
    const [lottery] = await db.insert(lotteries).values({
        groupId: session.groupId,
        title: session.title,
        keyword: session.keyword,
        description: `发送关键词 "${session.keyword}" 参与抽奖`,
        prizes: session.prizes as any,
        winnerCount: totalWinners,
        creatorId: userId,
        status: "active",
        scheduledEndTime,
    }).returning();

    // 在群组中发送抽奖消息
    try {
        // 生成奖品列表文本
        let prizesText = "";
        if (session.prizes && session.prizes.length > 0) {
            prizesText = "\n🎁 奖品设置：\n";
            for (const prize of session.prizes) {
                prizesText += `  • ${prize.name} × ${prize.count}\n`;
            }
        }

        const message = await ctx.api.sendMessage(
            session.groupId,
            `🎊 *${session.title}*\n\n` +
            `🔑 参与方式：发送关键词 \`${session.keyword}\`\n` +
            `💡 点击关键词可复制\n` +
            `⏰ 开奖时间：${scheduledEndTime.toLocaleString("zh-CN")}\n` +
            `⏱️ 剩余时间：${durationText}\n` +
            `👤 发起人：${ctx.from!.first_name}` +
            prizesText + "\n" +
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
            
            // 生成奖品列表文本
            let prizesText = "";
            const prizes = (lottery.prizes as any);
            if (prizes && prizes.length > 0) {
                prizesText = "\n🎁 奖品设置：\n";
                for (const prize of prizes) {
                    prizesText += `  • ${prize.name} × ${prize.count}\n`;
                }
            }

            await ctx.api.editMessageText(
                groupId,
                lottery.messageId,
                `🎊 *${lottery.title}*\n\n` +
                `🔑 参与方式：发送关键词 \`${lottery.keyword}\`\n` +
                `💡 点击关键词可复制\n` +
                `⏰ 开奖时间：${lottery.scheduledEndTime?.toLocaleString("zh-CN")}\n` +
                `⏱️ 剩余时间：${timeLeft}` +
                prizesText + "\n" +
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

                    // 发送取消通知
                    await bot.api.sendMessage(
                        lottery.groupId,
                        `😔 抽奖活动「*${lottery.title}*」因无人参与已取消`,
                        { 
                            parse_mode: "Markdown",
                            reply_to_message_id: lottery.messageId
                        }
                    );
                } catch (e) {
                    console.error("Failed to update message:", e);
                }
            }
            return;
        }

        // 随机抽取中奖者（按奖品分配）
        const prizes = (lottery.prizes as any) || [{ name: "中奖", count: lottery.winnerCount }];
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        const winners: Array<{ participant: any; prizeName: string }> = [];

        let currentIndex = 0;
        for (const prize of prizes) {
            const prizeWinnerCount = Math.min(prize.count, shuffled.length - currentIndex);
            for (let i = 0; i < prizeWinnerCount; i++) {
                if (currentIndex < shuffled.length) {
                    winners.push({
                        participant: shuffled[currentIndex],
                        prizeName: prize.name
                    });
                    currentIndex++;
                }
            }
        }

        // 更新中奖者
        for (const winner of winners) {
            await db.update(lotteryParticipants)
                .set({ 
                    isWinner: true,
                    prizeName: winner.prizeName
                })
                .where(eq(lotteryParticipants.id, winner.participant.id));
        }

        // 更新抽奖状态
        await db.update(lotteries)
            .set({ status: "ended", endedAt: new Date() })
            .where(eq(lotteries.id, lotteryId));

        // 获取中奖者信息并按奖品分组
        const winnersByPrize = new Map<string, Array<{ name: string; username: string; userId: number }>>();
        
        for (const winner of winners) {
            const [user] = await db.select().from(users).where(eq(users.id, winner.participant.userId));
            const name = user?.firstName || "Unknown";
            const username = user?.username ? `@${user.username}` : "";
            
            if (!winnersByPrize.has(winner.prizeName)) {
                winnersByPrize.set(winner.prizeName, []);
            }
            winnersByPrize.get(winner.prizeName)!.push({ 
                name, 
                username, 
                userId: winner.participant.userId 
            });

            // 私聊通知中奖者
            try {
                await bot.api.sendMessage(
                    winner.participant.userId,
                    `🎉 *恭喜中奖！*\n\n` +
                    `🎊 活动：${lottery.title}\n` +
                    `🎁 奖品：${winner.prizeName}\n\n` +
                    `请联系活动发起人领取奖品。`,
                    { parse_mode: "Markdown" }
                );
            } catch (e) {
                console.error("Failed to notify winner:", e);
            }
        }

        // 生成中奖名单文本
        let winnerText = "";
        const lotteryPrizes = (lottery.prizes as any) || [];
        
        for (const [prizeName, prizeWinners] of winnersByPrize) {
            // 找到对应奖品的数量
            const prizeInfo = lotteryPrizes.find((p: any) => p.name === prizeName);
            const prizeCount = prizeInfo ? prizeInfo.count : prizeWinners.length;
            
            winnerText += `\n*${prizeName}（共 ${prizeCount} 份）：*\n`;
            for (const w of prizeWinners) {
                winnerText += `🏆 ${w.name} ${w.username}\n`;
            }
        }

        // 更新原消息为已结束
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
                    `查看下方消息了解中奖结果 👇`,
                    { parse_mode: "Markdown" }
                );
            } catch (e) {
                console.error("Failed to update message:", e);
            }
        }

        // 发送新消息公布中奖结果并 @ 中奖用户
        try {
            // 构建 @ 中奖用户的文本
            let mentionText = "";
            const allWinners: Array<{ name: string; username: string; userId: number }> = [];
            
            for (const [prizeName, prizeWinners] of winnersByPrize) {
                allWinners.push(...prizeWinners);
            }

            // 使用 text mention 格式 @ 用户
            const mentions = allWinners.map(w => {
                return `[${w.name}](tg://user?id=${w.userId})`;
            }).join(" ");

            await bot.api.sendMessage(
                lottery.groupId,
                `🎉🎉🎉 *开奖啦！* 🎉🎉🎉\n\n` +
                `🎊 活动：*${lottery.title}*\n` +
                `👥 参与人数：${participants.length}\n\n` +
                `*🏆 中奖名单：*${winnerText}\n` +
                `恭喜以上中奖者！🎊\n\n` +
                `${mentions}\n\n` +
                `请中奖者联系活动发起人领取奖品！`,
                { 
                    parse_mode: "Markdown",
                    reply_to_message_id: lottery.messageId || undefined
                }
            );
        } catch (e) {
            console.error("Failed to send winner announcement:", e);
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

    // 生成奖品列表文本
    let prizesText = "";
    const prizes = (lottery.prizes as any);
    if (prizes && prizes.length > 0) {
        prizesText = "\n🎁 奖品设置：\n";
        for (const prize of prizes) {
            prizesText += `  • ${prize.name} × ${prize.count}\n`;
        }
    }

    await ctx.editMessageText(
        `🎊 *${lottery.title}*\n\n` +
        `📍 群组：${groupName}\n` +
        `🔑 关键词：${lottery.keyword}` +
        prizesText +
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

            // 生成奖品列表文本
            let prizesText = "";
            const prizes = (lottery.prizes as any);
            if (prizes && prizes.length > 0) {
                prizesText = "\n🎁 奖品设置：\n";
                for (const prize of prizes) {
                    prizesText += `  • ${prize.name} × ${prize.count}\n`;
                }
            }

            await ctx.api.editMessageText(
                lottery.groupId,
                lottery.messageId,
                `🎊 *${lottery.title}*\n\n` +
                `🔑 参与方式：发送关键词 \`${lottery.keyword}\`\n` +
                `💡 点击关键词可复制\n` +
                `⏰ 开奖时间：${newEndTime.toLocaleString("zh-CN")} ⏱️ (已延迟)\n` +
                `⏱️ 剩余时间：${timeLeft}` +
                prizesText + "\n" +
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
