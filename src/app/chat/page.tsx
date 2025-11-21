"use client";

import { useState } from "react";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";

export default function ChatPage() {
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

    return (
        <div className="flex h-[calc(100vh-4rem)] border rounded-lg overflow-hidden">
            <ChatSidebar selectedChatId={selectedChatId} onSelectChat={setSelectedChatId} />
            <div className="flex-1 bg-background">
                {selectedChatId ? (
                    <ChatWindow chatId={selectedChatId} />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Select a chat to view history
                    </div>
                )}
            </div>
        </div>
    );
}
