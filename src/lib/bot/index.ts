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
                // Copy message to Admin
                try {
                    const name = ctx.from.first_name + (ctx.from.last_name ? " " + ctx.from.last_name : "");
                    const username = ctx.from.username ? ` (@${ctx.from.username})` : "";
                    const caption = `📩 From: ${name}${username}\nID: ${senderId}`;

                    // Strategy: Send Copy.
                    const copyMsg = await ctx.copyMessage(adminChatId);

                    // Save mapping
                    await db.insert(messageMaps).values({
                        adminMessageId: copyMsg.message_id,
                        userMessageId: ctx.message.message_id,
                        userChatId: chatId,
                    });

                    // Send a small info message replying to the copy
                    await ctx.api.sendMessage(adminChatId, caption, { reply_to_message_id: copyMsg.message_id });

                } catch (e) {
                    console.error("Failed to forward to admin", e);
                }
            }
        }
    });

    return bot;
}
