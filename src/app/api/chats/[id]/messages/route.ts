import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq, asc, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const chatId = parseInt(id);

        if (isNaN(chatId)) {
            return new NextResponse("Invalid Chat ID", { status: 400 });
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

        return NextResponse.json(serializedMessages);
    } catch (error) {
        console.error("Failed to fetch messages:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
