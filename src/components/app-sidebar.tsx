"use client"

import { Home, MessageSquare, Users, Settings } from "lucide-react"
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

export function AppSidebar() {
    const { t } = useLanguage();

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
                        <div className="flex items-center justify-center p-2">
                            <LanguageSwitcher />
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
