# 抽奖功能重构实现方案

## 已完成

✅ 数据库 Schema 更新
- 添加 `keyword` 字段（参与关键词）
- 添加 `scheduledEndTime` 字段（计划结束时间）
- 状态支持 `active`, `ended`, `scheduled`

✅ 创建抽奖命令框架
- `/create_lottery` - 在群组中触发创建
- `/cancel` - 取消创建流程
- `/viewlottery` - 查看当前抽奖

✅ 会话管理
- `lotteryCreationSessions` - 管理创建流程状态
- 120秒超时机制
- 状态机：waiting_title → waiting_keyword → waiting_duration

✅ 辅助函数文件
- `src/lib/bot/lottery-handler.ts` - 抽奖逻辑处理

## 待完成

### 1. 完善 bot/index.ts 中的消息处理

需要在消息处理中添加：

```typescript
// 在 bot.on("message") 中
// 1. 检查是否在抽奖创建流程中
if (lotteryCreationSessions.has(senderId) && ctx.chat.type === "private") {
    const session = lotteryCreationSessions.get(senderId)!;
    const handled = await handleLotteryCreationMessage(ctx, session, lotteryCreationSessions);
    if (handled) return;
}

// 2. 检查是否是抽奖参与关键词
if (ctx.message.text && ctx.chat.type !== "private") {
    const handled = await handleLotteryParticipation(ctx, ctx.message.text);
    if (handled) return;
}
```

### 2. 添加回调查询处理

```typescript
bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;

    // 处理时长选择
    if (data.startsWith("lottery_duration_")) {
        const duration = data.replace("lottery_duration_", "");
        await handleLotteryDurationCallback(ctx, duration, lotteryCreationSessions);
        return;
    }

    // 处理抽奖管理
    if (data.startsWith("manage_lottery_")) {
        const lotteryId = parseInt(data.replace("manage_lottery_", ""));
        await showLotteryManagement(ctx, lotteryId);
        return;
    }

    // 延迟开奖
    if (data.startsWith("delay_lottery_")) {
        // 实现延迟逻辑
    }

    // 提前结束
    if (data.startsWith("end_lottery_now_")) {
        // 实现提前结束逻辑
    }
});
```

### 3. 实现抽奖管理界面

```typescript
async function showLotteryManagement(ctx: Context, lotteryId: number) {
    const [lottery] = await db.select().from(lotteries).where(eq(lotteries.id, lotteryId));
    
    if (!lottery) {
        return ctx.answerCallbackQuery({ text: "抽奖不存在", show_alert: true });
    }

    const participants = await db.select()
        .from(lotteryParticipants)
        .where(eq(lotteryParticipants.lotteryId, lotteryId));

    const keyboard = new InlineKeyboard()
        .text("⏰ 延迟 1 小时", `delay_lottery_${lotteryId}_1h`)
        .row()
        .text("⏰ 延迟 1 天", `delay_lottery_${lotteryId}_1d`)
        .row()
        .text("🏁 立即结束", `end_lottery_now_${lotteryId}`)
        .row()
        .text("« 返回", "viewlottery");

    await ctx.editMessageText(
        `🎊 *${lottery.title}*\n\n` +
        `🔑 关键词：${lottery.keyword}\n` +
        `👥 参与人数：${participants.length}\n` +
        `⏰ 计划开奖：${lottery.scheduledEndTime?.toLocaleString("zh-CN")}\n` +
        `📊 状态：${lottery.status === "active" ? "进行中" : "已结束"}`,
        {
            parse_mode: "Markdown",
            reply_markup: keyboard,
        }
    );
}
```

### 4. 更新命令菜单

```typescript
// 在 updateBotCommands 中
if (hasAdmin) {
    await bot.api.setMyCommands([
        { command: "start", description: "开始使用 Bot" },
        { command: "help", description: "查看帮助信息" },
        { command: "create_lottery", description: "创建抽奖活动（群组中使用）" },
        { command: "viewlottery", description: "查看和管理抽奖（私聊中使用）" },
    ]);
}
```

### 5. 数据库迁移

需要运行：
```bash
pnpm db:push
```

### 6. 完善定时任务

- 实现定时开奖的持久化（重启后恢复）
- 可以使用数据库轮询或外部任务队列

### 7. 测试流程

1. 在群组中使用 `/create_lottery`
2. 在私聊中完成创建流程
3. 在群组中发送关键词参与
4. 使用 `/viewlottery` 管理抽奖
5. 测试延迟和提前结束功能
6. 测试自动开奖

## 注意事项

1. **超时处理**：所有会话都有 120 秒超时
2. **私聊权限**：用户需要先 /start bot 才能收到私聊
3. **定时任务**：服务器重启后需要重新加载定时任务
4. **并发控制**：同一用户同时只能创建一个抽奖
5. **错误处理**：所有 API 调用都需要 try-catch

## 建议

由于这是一个大型重构，建议：
1. 先完成基本流程（创建→参与→自动开奖）
2. 再添加管理功能（延迟、提前结束）
3. 最后优化用户体验和错误处理

是否需要我继续完成剩余部分的实现？
