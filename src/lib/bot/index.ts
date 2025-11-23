import { Bot, InlineKeyboard } from "grammy";
import { getSetting, setSetting } from "@/lib/settings";
import { db } from "@/lib/db";
import { users, messages, messageMaps, groups, lotteries, lotteryParticipants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

let bot: Bot | null = null;

export async function getBot() {
    if (bot) return bot;

    const token = await getSetting("bot_token");
    if (!token) return null;

    bot = new Bot(token);

    // 设置 Bot 命令菜单
    await bot.api.setMyCommands([
        { command: "start", description: "开始使用 Bot" },
        { command: "help", description: "查看帮助信息" },
        { command: "login", description: "管理员登录" },
        { command: "lottery", description: "创建抽奖活动（仅管理员）" },
    ]);

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

    // Command: /login <password>
    bot.command("login", async (ctx) => {
        const password = ctx.match;
        if (!password) return ctx.reply("Usage: /login <password>");

        const adminPasswordHash = await getSetting("admin_password");
        if (!adminPasswordHash) return ctx.reply("Admin password not set in WebUI.");

        const isValid = await bcrypt.compare(password, adminPasswordHash);
        if (isValid) {
            await setSetting("admin_chat_id", ctx.chat.id.toString());
            await ctx.reply("✅ Login successful! You are now the Admin. Messages will be forwarded here.");
        } else {
            await ctx.reply("❌ Invalid password.");
        }
    });

    // Command: /lottery - 创建抽奖（仅 Bot Admin）
    bot.command("lottery", async (ctx) => {
        // 检查是否在群组中
        if (ctx.chat.type === "private") {
            return ctx.reply("❌ 抽奖功能仅在群组中可用。");
        }

        // 检查是否是 Bot Admin（通过 /login 登录的管理员）
        const adminChatIdStr = await getSetting("admin_chat_id");
        const adminChatId = adminChatIdStr ? parseInt(adminChatIdStr) : null;
        
        if (!adminChatId || ctx.from!.id !== adminChatId) {
            return ctx.reply("❌ 只有 Bot 管理员可以创建抽奖。请先使用 /login 命令登录。");
        }

        // 解析参数: /lottery <标题> | <描述> | <中奖人数>
        const args = ctx.match.trim();
        if (!args) {
            return ctx.reply(
                "📝 *创建抽奖*\n\n" +
                "*用法:*\n" +
                "`/lottery <标题> | <描述> | <中奖人数>`\n\n" +
                "*示例:*\n" +
                "`/lottery 新年抽奖 | 参与即有机会获得奖品 | 3`\n\n" +
                "中奖人数默认为 1",
                { parse_mode: "Markdown" }
            );
        }

        const parts = args.split("|").map(p => p.trim());
        const title = parts[0];
        const description = parts[1] || "点击下方按钮参与抽奖";
        const winnerCount = parts[2] ? parseInt(parts[2]) : 1;

        if (!title) {
            return ctx.reply("❌ 请提供抽奖标题。");
        }

        if (isNaN(winnerCount) || winnerCount < 1) {
            return ctx.reply("❌ 中奖人数必须是大于 0 的数字。");
        }

        // 创建抽奖记录
        const [lottery] = await db.insert(lotteries).values({
            groupId: ctx.chat.id,
            title,
            description,
            winnerCount,
            creatorId: ctx.from!.id,
            status: "active",
        }).returning();

        // 发送抽奖消息
        const keyboard = new InlineKeyboard()
            .text("🎉 参与抽奖", `join_lottery_${lottery.id}`)
            .row()
            .text("📊 查看参与者", `view_lottery_${lottery.id}`)
            .text("🏁 结束抽奖", `end_lottery_${lottery.id}`);

        const message = await ctx.reply(
            `🎊 *${title}*\n\n` +
            `${description}\n\n` +
            `👥 中奖人数: ${winnerCount}\n` +
            `👤 发起人: ${ctx.from!.first_name}\n` +
            `📅 创建时间: ${new Date().toLocaleString("zh-CN")}\n\n` +
            `当前参与人数: 0`,
            {
                parse_mode: "Markdown",
                reply_markup: keyboard,
            }
        );

        // 更新消息 ID
        await db.update(lotteries)
            .set({ messageId: message.message_id })
            .where(eq(lotteries.id, lottery.id));
    });

    // 处理抽奖按钮回调
    bot.on("callback_query:data", async (ctx) => {
        const data = ctx.callbackQuery.data;

        // 参与抽奖
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

            // 获取参与者信息
            const userIds = participants.map(p => p.userId);
            const participantUsers = await db.select().from(users).where(
                eq(users.id, userIds[0]) // 简化查询，实际应该用 IN
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
            raw: ctx.message as any,
        });

        if (adminChatId && senderId === adminChatId) {
            // IS ADMIN
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
                            raw: ctx.message as any,
                        });

                        await ctx.reply("✅ Sent.");
                    } catch (e) {
                        console.error(e);
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
}
