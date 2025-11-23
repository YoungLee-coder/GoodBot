"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { initializeApp } from "./actions";
import { useState, useEffect } from "react";

export default function SetupPage() {
    const [webhookUrl, setWebhookUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // 自动填充当前域名作为 webhook URL
        if (typeof window !== "undefined") {
            setWebhookUrl(window.location.origin);
        }
    }, []);

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        setError("");
        try {
            await initializeApp(formData);
        } catch (err: any) {
            setError(err.message || "初始化失败，请检查输入");
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-[500px]">
                <CardHeader>
                    <CardTitle>GoodBot 初始化</CardTitle>
                    <CardDescription>配置你的 Telegram Bot</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="botToken">Telegram Bot Token</Label>
                            <Input 
                                id="botToken" 
                                name="botToken" 
                                placeholder="123456:ABC-DEF..." 
                                required 
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-muted-foreground">
                                从 @BotFather 获取你的 Bot Token
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adminPassword">管理员密码</Label>
                            <Input 
                                id="adminPassword" 
                                name="adminPassword" 
                                type="password" 
                                required 
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-muted-foreground">
                                用于在 Telegram 中登录 Bot（/login 命令）
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="webhookUrl">Webhook URL</Label>
                            <Input 
                                id="webhookUrl" 
                                name="webhookUrl" 
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                placeholder="https://your-domain.com" 
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-muted-foreground">
                                你的应用部署地址（本地开发可留空）
                            </p>
                        </div>
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "初始化中..." : "开始初始化"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
