import { Bot, InlineKeyboard } from "grammy";
import { getSetting, setSetting } from "@/lib/settings";
import { db } from "@/lib/db";
import { users, messages, messageMaps, groups, lotteries, lotteryParticipants } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
    handleLotteryCreationMessage,
    handleLotteryDurationCallback,
    handleLotteryParticipation,
    showLotteryManagement,
    delayLottery,
    endLotteryNow,
} from "./lottery-handler";
import { restoreScheduledDrawings } from "./lottery-scheduler";

let bot: Bot | null = null;
let isInitializing = false;
let lastCommandsUpdate = 0;

// 存储等待密码输入的用户会话
const pendingLogins = new Map<number, { timestamp: number }>();

// 存储抽奖创建会话
type LotteryCreationStep = "waiting_title" | "waiting_prize_name" | "waiting_prize_count" | "waiting_keyword" | "waiting_duration";
type Prize = { name: string; count: number };
type LotteryCreationSession = {
    step: LotteryCreationStep;
    groupId: number;
    title?: string;
    prizes?: Prize[];
    currentPrizeName?: string; // 当前正在添加的奖品名称
    keyword?: string;
    timestamp: number;
};
const lotteryCreationSessions = new Map<number, LotteryCreationSession>();

// 清理过期的登录会话（60秒）
function cleanupExpiredLogins() {
    const now = Date.now();
    for (const [userId, session] of pendingLogins.entries()) {
        if (now - session.timestamp > 60000) {
            pendingLogins.delete(userId);
        }
    }
}

// 清理过期的抽奖创建会话（120秒）
function cleanupExpiredLotteryCreations() {
    const now = Date.now();
    for (const [userId, session] of lotteryCreationSessions.entries()) {
        if (now - session.timestamp > 120000) {
            lotteryCreationSessions.delete(userId);
        }
    }
}

// 更新命令菜单（带缓存，避免频繁更新）
async function updateBotCommands(hasAdmin: boolean) {
    const now = Date.now();
    // 5分钟内不重复更新
    if (now - lastCommandsUpdate < 300000) {
        return;
    }

    if (!bot) return;

    try {
        if (hasAdmin) {
            await bot.api.setMyCommands([
                { command: "start", description: "开始使用 Bot" },
                { command: "help", description: "查看帮助信息" },
                { command: "create_lottery", description: "创建抽奖（群组中使用）" },
                { command: "viewlottery", description: "查看和管理抽奖（私聊中使用）" },
            ]);
        } else {
            await bot.api.setMyCommands([
                { command: "start", description: "开始使用 Bot" },
                { command: "help", description: "查看帮助信息" },
                { command: "login", description: "管理员登录" },
            ]);
        }
        lastCommandsUpdate = now;
    } catch (error) {
        console.error("Failed to update bot commands:", error);
    }
}

// 强制更新命令菜单（用于登录/解绑时）
export async function forceUpdateBotCommands(hasAdmin: boolean) {
    lastCommandsUpdate = 0;
    await updateBotCommands(hasAdmin);
}

// 重置 bot 实例（用于更新 token 后）
export function resetBot() {
    bot = null;
    isInitializing = false;
    lastCommandsUpdate = 0;
}

export async function getBot() {
    if (bot) return bot;

    // 防止并发初始化
    if (isInitializing) {
        // 等待初始化完成
        while (isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return bot;
    }

    isInitializing = true;

    try {
        const token = await getSetting("bot_token");
        if (!token) {
            isInitializing = false;
            return null;
        }

        bot = new Bot(token);

        // 异步更新命令菜单，不阻塞初始化
        const adminChatIdStr = await getSetting("admin_chat_id");
        const hasAdmin = !!adminChatIdStr;
        updateBotCommands(hasAdmin).catch(err => 
            console.error("Failed to update commands:", err)
        );

        // 恢复定时抽奖任务
        restoreScheduledDrawings(bot).catch(err =>
            console.error("Failed to restore scheduled drawings:", err)
        );

    // Command: /start
    bot.command("start", async (ctx) => {
        const adminChatIdStr = await getSetting("admin_chat_id");
        const isAdmin = adminChatIdStr && parseInt(adminChatIdStr) === ctx.from?.id;

        if (isAdmin) {
            await ctx.reply(
                "👋 Welcome back, Admin!\n\n" +
                "You are already logged in. All messages from users will be forwarded to you.\n\n" +
                "Reply to any forwarded message to respond to the user."
            );
        } else {
            await ctx.reply(
                "👋 Hello! I'm GoodBot.\n\n" +
                "Send me a message and I'll forward it to my owner. " +
                "You'll receive a reply if they respond.\n\n" +
                "Feel free to send text, photos, or any media!"
            );
        }
    });

    // Command: /help
    bot.command("help", async (ctx) => {
        const adminChatIdStr = await getSetting("admin_chat_id");
        const isAdmin = adminChatIdStr && parseInt(adminChatIdStr) === ctx.from?.id;

        if (isAdmin) {
            await ctx.reply(
                "📚 *Admin Help*\n\n" +
                "*Commands:*\n" +
                "/start - Show welcome message\n" +
                "/help - Show this help message\n" +
                "/login <password> - Re-authenticate as admin\n\n" +
                "*Usage:*\n" +
                "• Reply to forwarded messages to respond to users\n" +
                "• All user messages are automatically forwarded to you\n" +
                "• Your replies are sent back to the original sender",
                { parse_mode: "Markdown" }
            );
        } else {
            await ctx.reply(
                "📚 *Help*\n\n" +
                "*How to use:*\n" +
                "1. Send me any message\n" +
                "2. Your message will be forwarded to the owner\n" +
                "3. Wait for a response\n\n" +
                "*Privacy:*\n" +
                "The owner can see your name and message content, but your Telegram account remains private.",
                { parse_mode: "Markdown" }
            );
        }
    });

    // Command: /login [password]
    bot.command("login", async (ctx) => {
        // 检查是否已经绑定了 admin
        const existingAdminChatIdStr = await getSetting("admin_chat_id");
        if (existingAdminChatIdStr) {
            return ctx.reply(
                "⚠️ 管理员已绑定。如需更换管理员，请先在 WebUI 中解绑。\n" +
                "⚠️ Admin already linked. To change admin, please unbind in WebUI first."
            );
        }

        const password = ctx.match.trim();
        
        const adminPasswordHash = await getSetting("admin_password");
        if (!adminPasswordHash) {
            return ctx.reply("❌ 管理员密码未在 WebUI 中设置。\n❌ Admin password not set in WebUI.");
        }

        // 如果提供了密码，直接验证
        if (password) {
            const isValid = await bcrypt.compare(password, adminPasswordHash);
            if (isValid) {
                await setSetting("admin_chat_id", ctx.chat.id.toString());
                pendingLogins.delete(ctx.from!.id);
                
                // 强制更新命令菜单，移除 login 命令
                await forceUpdateBotCommands(true);
                
                await ctx.reply(
                    "✅ 登录成功！你现在是管理员。用户消息将转发到这里。\n" +
                    "✅ Login successful! You are now the Admin. Messages will be forwarded here."
                );
            } else {
                await ctx.reply("❌ 密码错误。\n❌ Invalid password.");
            }
        } else {
            // 没有提供密码，进入等待密码模式
            pendingLogins.set(ctx.from!.id, { timestamp: Date.now() });
            await ctx.reply(
                "🔐 请在 60 秒内发送你的管理员密码。\n" +
                "🔐 Please send your admin password within 60 seconds.\n\n" +
                "💡 提示：为了安全，建议发送后立即删除密码消息。\n" +
                "💡 Tip: For security, delete your password message immediately after sending."
            );
        }
    });

    // Command: /create-lottery - 创建抽奖（仅 Bot Admin，仅群组）
    bot.command("create_lottery", async (ctx) => {
        // 检查是否在群组中
        if (ctx.chat.type === "private") {
            return ctx.reply(
                "❌ 抽奖功能仅在群组中可用。\n" +
                "❌ Lottery feature is only available in groups."
            );
        }

        // 检查是否是 Bot Admin
        const adminChatIdStr = await getSetting("admin_chat_id");
        const adminChatId = adminChatIdStr ? parseInt(adminChatIdStr) : null;
        
        if (!adminChatId || ctx.from!.id !== adminChatId) {
            return ctx.reply(
                "❌ 只有 Bot 管理员可以创建抽奖。\n" +
                "❌ Only Bot admin can create lottery."
            );
        }

        // 开始创建流程，私聊管理员
        lotteryCreationSessions.set(ctx.from!.id, {
            step: "waiting_title",
            groupId: ctx.chat.id,
            timestamp: Date.now(),
        });

        try {
            await ctx.api.sendMessage(
                adminChatId,
                "🎊 *创建抽奖活动*\n\n" +
                "📝 请输入活动名称\n" +
                "⏱️ 你有 120 秒的时间输入\n\n" +
                "💡 提示：输入 /cancel 可以取消创建",
                { parse_mode: "Markdown" }
            );

            await ctx.reply(
                "✅ 已在私聊中开始创建抽奖流程，请查看与 Bot 的私聊。\n" +
                "✅ Lottery creation started in private chat."
            );
        } catch {
            lotteryCreationSessions.delete(ctx.from!.id);
            await ctx.reply(
                "❌ 无法发送私聊消息。请先在 Bot 私聊中发送 /start。\n" +
                "❌ Cannot send private message. Please send /start to bot first."
            );
        }
    });

    // Command: /cancel - 取消创建抽奖
    bot.command("cancel", async (ctx) => {
        if (lotteryCreationSessions.has(ctx.from!.id)) {
            lotteryCreationSessions.delete(ctx.from!.id);
            await ctx.reply(
                "❌ 已取消创建抽奖。\n" +
                "❌ Lottery creation cancelled."
            );
        }
    });

    // Command: /next - 完成奖品设置，进入下一步
    bot.command("next", async (ctx) => {
        const session = lotteryCreationSessions.get(ctx.from!.id);
        if (!session) return;

        if (session.step === "waiting_prize_name" || session.step === "waiting_prize_count") {
            // 检查是否至少添加了一个奖品
            if (!session.prizes || session.prizes.length === 0) {
                await ctx.reply(
                    "❌ 请至少添加一个奖品\n\n" +
                    "💡 发送奖品名称开始添加"
                );
                return;
            }

            // 进入下一步：输入关键词
            session.step = "waiting_keyword";
            session.currentPrizeName = undefined;
            session.timestamp = Date.now();

            // 显示奖品摘要
            const totalCount = session.prizes.reduce((sum: number, p) => sum + p.count, 0);
            const prizesSummary = session.prizes.map(p => `  • ${p.name} × ${p.count}`).join('\n');
            
            await ctx.reply(
                "✅ 奖品设置完成\n\n" +
                "🎁 奖品列表：\n" +
                prizesSummary + "\n" +
                `📊 总计：${totalCount} 个名额\n\n` +
                "🔑 请输入参与关键词\n" +
                "⏱️ 你有 120 秒的时间输入\n\n" +
                "💡 用户需要在群组中发送此关键词来参与抽奖"
            );
        }
    });

    // Command: /viewlottery - 查看当前抽奖活动
    bot.command("viewlottery", async (ctx) => {
        // 只在私聊中可用
        if (ctx.chat.type !== "private") {
            return ctx.reply(
                "💡 请在与 Bot 的私聊中使用此命令。\n" +
                "💡 Please use this command in private chat."
            );
        }

        // 检查是否是管理员
        const adminChatIdStr = await getSetting("admin_chat_id");
        const adminChatId = adminChatIdStr ? parseInt(adminChatIdStr) : null;
        
        if (!adminChatId || ctx.from!.id !== adminChatId) {
            return ctx.reply(
                "❌ 只有 Bot 管理员可以查看抽奖活动。\n" +
                "❌ Only Bot admin can view lotteries."
            );
        }

        // 获取所有进行中的抽奖
        const activeLotteries = await db
            .select()
            .from(lotteries)
            .where(eq(lotteries.status, "active"));

        if (activeLotteries.length === 0) {
            return ctx.reply(
                "📭 当前没有进行中的抽奖活动。\n" +
                "📭 No active lotteries at the moment."
            );
        }

        // 为每个抽奖创建按钮
        const keyboard = new InlineKeyboard();
        for (const lottery of activeLotteries) {
            const group = await db.select().from(groups).where(eq(groups.id, lottery.groupId));
            const groupName = group[0]?.title || "未知群组";
            keyboard.text(
                `${lottery.title} (${groupName})`,
                `manage_lottery_${lottery.id}`
            ).row();
        }

        await ctx.reply(
            "🎊 *当前进行中的抽奖活动*\n\n" +
            "点击下方按钮查看详情和管理",
            {
                parse_mode: "Markdown",
                reply_markup: keyboard,
            }
        );
    });

    // 处理回调查询
    bot.on("callback_query:data", async (ctx) => {
        const data = ctx.callbackQuery.data;

        // 处理抽奖时长选择
        if (data.startsWith("lottery_duration_")) {
            const duration = data.replace("lottery_duration_", "");
            await handleLotteryDurationCallback(ctx, duration, lotteryCreationSessions, bot!);
            return;
        }

        // 处理抽奖管理
        if (data.startsWith("manage_lottery_")) {
            const lotteryId = parseInt(data.replace("manage_lottery_", ""));
            await showLotteryManagement(ctx, lotteryId);
            return;
        }

        // 延迟抽奖
        if (data.startsWith("delay_lottery_")) {
            const parts = data.replace("delay_lottery_", "").split("_");
            const lotteryId = parseInt(parts[0]);
            const duration = parts[1];
            await delayLottery(ctx, lotteryId, duration, bot!);
            return;
        }

        // 立即结束抽奖
        if (data.startsWith("end_lottery_now_")) {
            const lotteryId = parseInt(data.replace("end_lottery_now_", ""));
            await endLotteryNow(ctx, lotteryId, bot!);
            return;
        }

        // 返回抽奖列表
        if (data === "back_to_lottery_list") {
            // 重新获取抽奖列表
            const activeLotteries = await db
                .select()
                .from(lotteries)
                .where(eq(lotteries.status, "active"));

            if (activeLotteries.length === 0) {
                await ctx.editMessageText(
                    "📭 当前没有进行中的抽奖活动。\n" +
                    "📭 No active lotteries at the moment."
                );
                await ctx.answerCallbackQuery();
                return;
            }

            const keyboard = new InlineKeyboard();
            for (const lottery of activeLotteries) {
                const group = await db.select().from(groups).where(eq(groups.id, lottery.groupId));
                const groupName = group[0]?.title || "未知群组";
                keyboard.text(
                    `${lottery.title} (${groupName})`,
                    `manage_lottery_${lottery.id}`
                ).row();
            }

            await ctx.editMessageText(
                "🎊 *当前进行中的抽奖活动*\n\n" +
                "点击下方按钮查看详情和管理",
                {
                    parse_mode: "Markdown",
                    reply_markup: keyboard,
                }
            );
            await ctx.answerCallbackQuery();
            return;
        }

        // 旧的抽奖按钮（保留兼容性）
        if (data.startsWith("join_lottery_")) {
            const lotteryId = parseInt(data.replace("join_lottery_", ""));
            
            // 检查抽奖是否存在且活跃
            const [lottery] = await db.select().from(lotteries).where(eq(lotteries.id, lotteryId));
            
            if (!lottery) {
                return ctx.answerCallbackQuery({ text: "❌ 抽奖不存在", show_alert: true });
            }

            if (lottery.status !== "active") {
                return ctx.answerCallbackQuery({ text: "❌ 抽奖已结束", show_alert: true });
            }

            // 检查是否已参与
            const existing = await db.select()
                .from(lotteryParticipants)
                .where(
                    and(
                        eq(lotteryParticipants.lotteryId, lotteryId),
                        eq(lotteryParticipants.userId, ctx.from.id)
                    )
                );

            if (existing.length > 0) {
                return ctx.answerCallbackQuery({ text: "✅ 你已经参与过了", show_alert: false });
            }

            // 添加参与者
            await db.insert(lotteryParticipants).values({
                lotteryId,
                userId: ctx.from.id,
            });

            // 更新消息显示参与人数
            const participants = await db.select().from(lotteryParticipants).where(eq(lotteryParticipants.lotteryId, lotteryId));
            
            const keyboard = new InlineKeyboard()
                .text("🎉 参与抽奖", `join_lottery_${lottery.id}`)
                .row()
                .text("📊 查看参与者", `view_lottery_${lottery.id}`)
                .text("🏁 结束抽奖", `end_lottery_${lottery.id}`);

            await ctx.editMessageText(
                `🎊 *${lottery.title}*\n\n` +
                `${lottery.description}\n\n` +
                `👥 中奖人数: ${lottery.winnerCount}\n` +
                `👤 发起人: ${ctx.from.first_name}\n` +
                `📅 创建时间: ${lottery.createdAt?.toLocaleString("zh-CN")}\n\n` +
                `当前参与人数: ${participants.length}`,
                {
                    parse_mode: "Markdown",
                    reply_markup: keyboard,
                }
            );

            return ctx.answerCallbackQuery({ text: "✅ 参与成功！", show_alert: false });
        }

        // 查看参与者
        if (data.startsWith("view_lottery_")) {
            const lotteryId = parseInt(data.replace("view_lottery_", ""));
            
            const participants = await db.select()
                .from(lotteryParticipants)
                .where(eq(lotteryParticipants.lotteryId, lotteryId));

            if (participants.length === 0) {
                return ctx.answerCallbackQuery({ text: "暂无参与者", show_alert: true });
            }

            // 获取参与者信息（批量查询）
            const userIds = participants.map(p => p.userId);
            const participantUsers = await db.select().from(users).where(
                inArray(users.id, userIds)
            );

            let message = `📊 *参与者列表* (${participants.length}人)\n\n`;
            for (const p of participants) {
                const user = participantUsers.find(u => u.id === p.userId);
                const name = user?.firstName || "Unknown";
                const winner = p.isWinner ? " 🏆" : "";
                message += `• ${name}${winner}\n`;
            }

            return ctx.answerCallbackQuery({ text: message, show_alert: true });
        }

        // 结束抽奖
        if (data.startsWith("end_lottery_")) {
            const lotteryId = parseInt(data.replace("end_lottery_", ""));
            
            const [lottery] = await db.select().from(lotteries).where(eq(lotteries.id, lotteryId));
            
            if (!lottery) {
                return ctx.answerCallbackQuery({ text: "❌ 抽奖不存在", show_alert: true });
            }

            // 检查权限（只有 Bot Admin 可以结束）
            const adminChatIdStr = await getSetting("admin_chat_id");
            const adminChatId = adminChatIdStr ? parseInt(adminChatIdStr) : null;
            
            if (!adminChatId || ctx.from.id !== adminChatId) {
                return ctx.answerCallbackQuery({ text: "❌ 只有 Bot 管理员可以结束抽奖", show_alert: true });
            }

            if (lottery.status !== "active") {
                return ctx.answerCallbackQuery({ text: "❌ 抽奖已结束", show_alert: true });
            }

            // 获取所有参与者
            const participants = await db.select()
                .from(lotteryParticipants)
                .where(eq(lotteryParticipants.lotteryId, lotteryId));

            if (participants.length === 0) {
                return ctx.answerCallbackQuery({ text: "❌ 没有参与者，无法开奖", show_alert: true });
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
            }

            // 更新消息
            await ctx.editMessageText(
                `🎊 *${lottery.title}* (已结束)\n\n` +
                `${lottery.description}\n\n` +
                `👥 中奖人数: ${lottery.winnerCount}\n` +
                `📅 创建时间: ${lottery.createdAt?.toLocaleString("zh-CN")}\n` +
                `🏁 结束时间: ${new Date().toLocaleString("zh-CN")}\n\n` +
                `总参与人数: ${participants.length}\n\n` +
                `*🎉 中奖名单:*\n${winnerText}`,
                { parse_mode: "Markdown" }
            );

            return ctx.answerCallbackQuery({ text: "🎉 抽奖已结束！", show_alert: false });
        }

        await ctx.answerCallbackQuery();
    });

    // Handle group status changes
    bot.on("my_chat_member", async (ctx) => {
        const status = ctx.myChatMember.new_chat_member.status;
        const chat = ctx.chat;

        if (status === "member" || status === "administrator") {
            // Bot added to group
            await db.insert(groups).values({
                id: chat.id,
                title: chat.title || "Untitled Group",
                type: chat.type,
            }).onConflictDoUpdate({
                target: groups.id,
                set: {
                    title: chat.title || "Untitled Group",
                    type: chat.type,
                }
            });
        } else if (status === "left" || status === "kicked") {
            // Bot removed from group
            await db.delete(groups).where(eq(groups.id, chat.id));
        }
    });

    // Handle all text messages
    bot.on("message", async (ctx) => {
        if (!ctx.message || !ctx.from) return;

        const adminChatIdStr = await getSetting("admin_chat_id");
        const adminChatId = adminChatIdStr ? parseInt(adminChatIdStr) : null;
        const senderId = ctx.from.id;
        const chatId = ctx.chat.id;

        // 清理过期的会话
        cleanupExpiredLogins();
        cleanupExpiredLotteryCreations();

        // 检查是否在抽奖创建流程中（私聊）
        const lotterySession = lotteryCreationSessions.get(senderId);
        if (lotterySession && ctx.message.text && ctx.chat.type === "private") {
            const handled = await handleLotteryCreationMessage(ctx, lotterySession, lotteryCreationSessions);
            if (handled) return;
        }

        // 检查是否在等待密码输入
        const pendingLogin = pendingLogins.get(senderId);
        if (pendingLogin && ctx.message.text && ctx.chat.type === "private") {
            const now = Date.now();
            if (now - pendingLogin.timestamp <= 60000) {
                // 在60秒内，验证密码
                const password = ctx.message.text.trim();
                const adminPasswordHash = await getSetting("admin_password");
                
                if (adminPasswordHash) {
                    const isValid = await bcrypt.compare(password, adminPasswordHash);
                    if (isValid) {
                        await setSetting("admin_chat_id", chatId.toString());
                        pendingLogins.delete(senderId);
                        
                        // 强制更新命令菜单，移除 login 命令
                        await forceUpdateBotCommands(true);
                        
                        // 尝试删除用户的密码消息（为了安全）
                        try {
                            await ctx.deleteMessage();
                        } catch {
                            // 如果无法删除，忽略错误
                        }
                        
                        await ctx.reply(
                            "✅ 登录成功！你现在是管理员。用户消息将转发到这里。\n" +
                            "✅ Login successful! You are now the Admin. Messages will be forwarded here."
                        );
                        return;
                    } else {
                        pendingLogins.delete(senderId);
                        await ctx.reply("❌ 密码错误。请重新使用 /login 命令。\n❌ Invalid password. Please use /login command again.");
                        return;
                    }
                }
            } else {
                // 超时
                pendingLogins.delete(senderId);
                await ctx.reply("⏱️ 登录超时。请重新使用 /login 命令。\n⏱️ Login timeout. Please use /login command again.");
                return;
            }
        }

        // 1. Save User
        await db.insert(users).values({
            id: senderId,
            username: ctx.from.username,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name,
        }).onConflictDoUpdate({
            target: users.id,
            set: {
                username: ctx.from.username,
                firstName: ctx.from.first_name,
                lastName: ctx.from.last_name,
            }
        });

        // 2. Save Message
        await db.insert(messages).values({
            messageId: ctx.message.message_id,
            chatId: chatId,
            userId: senderId,
            text: ctx.message.text || "[Media/Other]",
            raw: ctx.message as unknown as Record<string, unknown>,
        });

        // 3. 检查是否是抽奖参与关键词（群组消息）
        if (ctx.message.text && ctx.chat.type !== "private") {
            const handled = await handleLotteryParticipation(ctx, ctx.message.text.trim());
            if (handled) return; // 是抽奖关键词，已处理
        }

        // 4. 群组消息不转发给管理员，只处理私聊消息
        if (ctx.chat.type !== "private") {
            return; // 群组消息已处理完毕（抽奖关键词检查）
        }

        if (adminChatId && senderId === adminChatId) {
            // IS ADMIN (私聊)
            const replyTo = ctx.message.reply_to_message;
            if (replyTo) {
                // Find the original message mapping
                const mapping = await db.select().from(messageMaps).where(eq(messageMaps.adminMessageId, replyTo.message_id));

                if (mapping.length > 0) {
                    const targetChatId = mapping[0].userChatId;
                    // Send reply to user
                    try {
                        const sentMsg = await ctx.copyMessage(targetChatId);

                        // Save Admin's reply to DB so it shows in WebUI
                        await db.insert(messages).values({
                            messageId: sentMsg.message_id,
                            chatId: targetChatId,
                            userId: senderId, // Admin's ID
                            text: ctx.message.text || "[Media]",
                            raw: ctx.message as unknown as Record<string, unknown>,
                        });

                        await ctx.reply("✅ Sent.");
                    } catch (error) {
                        console.error("Failed to send message:", error);
                        await ctx.reply("❌ Failed to send. User might have blocked the bot.");
                    }
                } else {
                    await ctx.reply("⚠️ Could not find the original sender for this message. It might be too old or not tracked.");
                }
            }

        } else {
            // IS STRANGER
            if (adminChatId) {
                // Send message to Admin with user info
                try {
                    const name = ctx.from.first_name + (ctx.from.last_name ? " " + ctx.from.last_name : "");
                    const username = ctx.from.username ? ` (@${ctx.from.username})` : "";
                    const userInfo = `👤 ${name}${username} (ID: ${senderId})`;

                    // For text messages, send with user info prefix
                    let sentMsg;
                    if (ctx.message.text) {
                        sentMsg = await ctx.api.sendMessage(
                            adminChatId,
                            `${userInfo}\n${"─".repeat(40)}\n${ctx.message.text}`
                        );
                    } else {
                        // For media, copy then add info as a reply
                        sentMsg = await ctx.copyMessage(adminChatId);
                        await ctx.api.sendMessage(adminChatId, userInfo, {
                            reply_to_message_id: sentMsg.message_id
                        });
                    }

                    // Save mapping
                    await db.insert(messageMaps).values({
                        adminMessageId: sentMsg.message_id,
                        userMessageId: ctx.message.message_id,
                        userChatId: chatId,
                    });

                    // Send confirmation to user
                    await ctx.reply("✅ Your message has been forwarded to the owner. Please wait for a response.");

                } catch (e) {
                    console.error("Failed to forward to admin", e);
                    await ctx.reply("❌ Sorry, I couldn't forward your message. Please try again later.");
                }
            } else {
                // Admin not set up yet
                await ctx.reply("⚠️ The bot is not fully configured yet. Please ask the owner to set up the admin account first.");
            }
        }
    });

        return bot;
    } finally {
        isInitializing = false;
    }
}
