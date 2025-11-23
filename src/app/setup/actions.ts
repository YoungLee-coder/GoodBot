"use server";

import { setSetting } from "@/lib/settings";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Bot } from "grammy";

export async function initializeApp(formData: FormData) {
    const botToken = formData.get("botToken") as string;
    const adminPassword = formData.get("adminPassword") as string;
    const webhookUrl = formData.get("webhookUrl") as string;

    if (!botToken || !adminPassword) {
        throw new Error("缺少必填字段");
    }

    try {
        // 验证 Bot Token 是否有效
        const testBot = new Bot(botToken);
        const botInfo = await testBot.api.getMe();
        console.log("Bot 验证成功:", botInfo.username);

        // 保存设置
        await setSetting("bot_token", botToken);

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await setSetting("admin_password", hashedPassword);

        // 设置 Webhook（如果提供了 URL）
        if (webhookUrl) {
            const fullWebhookUrl = `${webhookUrl}/api/bot`;
            await testBot.api.setWebhook(fullWebhookUrl);
            console.log("Webhook 设置成功:", fullWebhookUrl);
            await setSetting("webhook_url", fullWebhookUrl);
        }

        // 设置 Bot 命令菜单
        await testBot.api.setMyCommands([
            { command: "start", description: "开始使用 Bot" },
            { command: "help", description: "查看帮助信息" },
            { command: "login", description: "管理员登录" },
            { command: "lottery", description: "创建抽奖活动（仅管理员）" },
        ]);

    } catch (error: any) {
        console.error("初始化失败:", error);
        throw new Error(`初始化失败: ${error.message}`);
    }

    redirect("/");
}
