import { Bot } from "grammy";
import { getSetting, setSetting } from "@/lib/settings";
import { db } from "@/lib/db";
import { users, messages, messageMaps, groups } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

let bot: Bot | null = null;

export async function getBot() {
    if (bot) return bot;

    const token = await getSetting("bot_token");
    if (!token) return null;

    bot = new Bot(token);

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
