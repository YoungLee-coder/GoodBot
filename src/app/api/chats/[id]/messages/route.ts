import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAuth();
    if (authError) return authError;

    try {
        const { id } = await params;
        const chatId = parseInt(id);

        if (isNaN(chatId)) {
            return apiError("Invalid Chat ID", 400);
        }

        // Fetch messages for this chat
        // We want messages where chatId == id
        const chatMessages = await db.select()
            .from(messages)
            .where(eq(messages.chatId, chatId))
            .orderBy(asc(messages.createdAt));

        // Serialize BigInt
        const serializedMessages = chatMessages.map(msg => ({
            ...msg,
            id: msg.id,
            messageId: msg.messageId.toString(),
            chatId: msg.chatId?.toString(),
            userId: msg.userId?.toString(),
            replyToId: msg.replyToId?.toString(),
        }));

        return apiSuccess(serializedMessages);
    } catch (error) {
        console.error("Failed to fetch messages:", error);
        return apiError("Internal Server Error", 500);
    }
}
