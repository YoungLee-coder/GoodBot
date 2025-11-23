"use client"

import { Home, MessageSquare, Users, Settings, LogOut } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from "@/components/ui/sidebar"
import { LanguageSwitcher } from "./language-switcher"
import { useLanguage } from "./language-provider"
import { useRouter } from "next/navigation"

export function AppSidebar() {
    const { t } = useLanguage();
    const router = useRouter();

    const items = [
        {
            title: t.nav.dashboard,
            url: "/",
            icon: Home,
        },
        {
            title: t.nav.chat,
            url: "/chat",
            icon: MessageSquare,
        },
        {
            title: t.nav.groups,
            url: "/groups",
            icon: Users,
        },
        {
            title: t.nav.settings,
            url: "/settings",
            icon: Settings,
        },
    ];

    async function handleLogout() {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>GoodBot</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center justify-between p-2 gap-2">
                            <LanguageSwitcher />
                            <SidebarMenuButton onClick={handleLogout}>
                                <LogOut className="h-4 w-4" />
                                <span>{t.login.logout}</span>
                            </SidebarMenuButton>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
