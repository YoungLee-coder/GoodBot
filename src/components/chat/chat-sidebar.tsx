"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface User {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
}

interface ChatSidebarProps {
    selectedChatId: string | null;
    onSelectChat: (id: string) => void;
}

export function ChatSidebar({ selectedChatId, onSelectChat }: ChatSidebarProps) {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        fetch("/api/chats")
            .then((res) => res.json())
            .then((data) => setUsers(data));
    }, []);

    return (
        <div className="w-80 border-r h-full flex flex-col">
            <div className="p-4 border-b font-bold">Chats</div>
            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-2 p-2">
                    {users.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => onSelectChat(user.id)}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors",
                                selectedChatId === user.id && "bg-accent"
                            )}
                        >
                            <Avatar>
                                <AvatarFallback>{user.firstName?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <div className="font-medium truncate">
                                    {user.firstName} {user.lastName}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                    @{user.username || "No username"}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
