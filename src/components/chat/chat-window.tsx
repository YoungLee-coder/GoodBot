"use client";

import { useEffect, useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
    id: number;
    text: string | null;
    userId: string;
    createdAt: string;
}

interface ChatWindowProps {
    chatId: string;
}

export function ChatWindow({ chatId }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages([]); // Clear previous messages
        fetch(`/api/chats/${chatId}/messages`)
            .then((res) => res.json())
            .then((data) => {
                setMessages(data);
                // Scroll to bottom
                setTimeout(() => {
                    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
            });

        // Polling for new messages (simple implementation)
        const interval = setInterval(() => {
            fetch(`/api/chats/${chatId}/messages`)
                .then((res) => res.json())
                .then((data) => setMessages(data));
        }, 3000);

        return () => clearInterval(interval);
    }, [chatId]);

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b font-bold">Chat History</div>
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((msg) => {
                        const isMe = msg.userId !== chatId; // If userId != chatId, it means it's Admin (or someone else)
                        // Wait, logic check:
                        // In DB: userId is the SENDER.
                        // chatId is the CONTEXT (User's Chat ID).
                        // If sender == chatId, it's the User.
                        // If sender != chatId, it's the Admin (Bot).

                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                                    isMe
                                        ? "ml-auto bg-primary text-primary-foreground"
                                        : "bg-muted"
                                )}
                            >
                                {msg.text}
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>
            <div className="p-4 border-t text-center text-sm text-muted-foreground">
                Reply via Telegram App
            </div>
        </div>
    );
}
