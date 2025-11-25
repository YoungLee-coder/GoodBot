import { getBot } from "@/lib/bot";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const bot = await getBot();
        if (!bot) {
            return NextResponse.json({ error: "Bot not initialized" }, { status: 500 });
        }

        // Get the deployment URL
        const url = new URL(request.url);
        const webhookUrl = `${url.protocol}//${url.host}/api/bot`;

        // Set webhook
        await bot.api.setWebhook(webhookUrl);

        // Get webhook info to confirm
        const info = await bot.api.getWebhookInfo();

        return NextResponse.json({
            success: true,
            webhookUrl: webhookUrl,
            webhookInfo: info,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
