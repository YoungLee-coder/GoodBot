import { webhookCallback } from "grammy";
import { getBot } from "@/lib/bot";

export const POST = async (req: Request) => {
    const bot = await getBot();
    if (!bot) {
        return new Response("Bot not initialized", { status: 500 });
    }

    return webhookCallback(bot, "std/http")(req);
};
