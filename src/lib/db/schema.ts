import { pgTable, serial, text, timestamp, boolean, jsonb, bigint } from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
});

export const users = pgTable("users", {
    id: bigint("id", { mode: "number" }).primaryKey(), // Telegram User ID
    username: text("username"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    isAdmin: boolean("is_admin").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

export const groups = pgTable("groups", {
    id: bigint("id", { mode: "number" }).primaryKey(), // Telegram Chat ID
    title: text("title"),
    type: text("type"), // group, supergroup, channel
    createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
    id: serial("id").primaryKey(),
    messageId: bigint("message_id", { mode: "number" }).notNull(),
    chatId: bigint("chat_id", { mode: "number" }),
    userId: bigint("user_id", { mode: "number" }),
    replyToId: bigint("reply_to_id", { mode: "number" }), // ID of the message being replied to
    text: text("text"),
    raw: jsonb("raw"), // Store full raw message object
    createdAt: timestamp("created_at").defaultNow(),
});

export const messageMaps = pgTable("message_maps", {
    id: serial("id").primaryKey(),
    adminMessageId: bigint("admin_message_id", { mode: "number" }).notNull(), // ID of the message sent TO Admin
    userMessageId: bigint("user_message_id", { mode: "number" }).notNull(), // ID of the original message FROM User
    userChatId: bigint("user_chat_id", { mode: "number" }).notNull(), // The User's Chat ID
    createdAt: timestamp("created_at").defaultNow(),
});
