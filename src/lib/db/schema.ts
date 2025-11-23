import { pgTable, serial, text, timestamp, boolean, jsonb, bigint, integer } from "drizzle-orm/pg-core";

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

export const lotteries = pgTable("lotteries", {
    id: serial("id").primaryKey(),
    groupId: bigint("group_id", { mode: "number" }).notNull(), // Telegram Chat ID
    title: text("title").notNull(), // 抽奖标题
    keyword: text("keyword").notNull(), // 参与关键词
    description: text("description"), // 抽奖描述
    prizes: jsonb("prizes"), // 奖品列表 [{name: string, count: number}]
    winnerCount: integer("winner_count").notNull().default(1), // 总中奖人数
    creatorId: bigint("creator_id", { mode: "number" }).notNull(), // 创建者 User ID
    messageId: bigint("message_id", { mode: "number" }), // 抽奖消息 ID
    status: text("status").notNull().default("active"), // active, ended, scheduled
    scheduledEndTime: timestamp("scheduled_end_time"), // 计划结束时间
    createdAt: timestamp("created_at").defaultNow(),
    endedAt: timestamp("ended_at"), // 实际结束时间
});

export const lotteryParticipants = pgTable("lottery_participants", {
    id: serial("id").primaryKey(),
    lotteryId: integer("lottery_id").notNull(), // 关联的抽奖 ID
    userId: bigint("user_id", { mode: "number" }).notNull(), // 参与者 User ID
    isWinner: boolean("is_winner").default(false), // 是否中奖
    prizeName: text("prize_name"), // 中奖奖品名称
    createdAt: timestamp("created_at").defaultNow(),
});
