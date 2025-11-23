"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateBotToken, updateAdminPassword } from "./actions";
import { useState } from "react";

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);

    return (
        <div className="p-6 space-y-6 max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight">设置</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Bot 配置</CardTitle>
                    <CardDescription>更新你的 Telegram Bot Token</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={async (formData) => {
                        setLoading(true);
                        await updateBotToken(formData);
                        setLoading(false);
                        alert("Token 已更新！");
                    }} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="botToken">新 Bot Token</Label>
                            <Input id="botToken" name="botToken" type="password" placeholder="当前 Token 已隐藏" required />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? "更新中..." : "更新 Token"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>管理员安全</CardTitle>
                    <CardDescription>修改管理员密码（用于 /login 命令）</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={async (formData) => {
                        setLoading(true);
                        await updateAdminPassword(formData);
                        setLoading(false);
                        alert("密码已更新！");
                    }} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">新密码</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <Button type="submit" variant="secondary" disabled={loading}>
                            {loading ? "更新中..." : "更新密码"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Telegram Webhook</CardTitle>
                    <CardDescription>配置 Webhook 以接收消息（部署到生产环境时需要）</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            部署到生产环境后，点击此按钮告诉 Telegram 将消息发送到哪里。
                        </p>
                        <Button
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    const res = await fetch('/api/setup-webhook');
                                    const data = await res.json();
                                    if (data.success) {
                                        alert(`✅ Webhook 设置成功！\n\nURL: ${data.webhookUrl}\n\n你的 Bot 现在可以接收消息了。`);
                                    } else {
                                        alert(`❌ 失败: ${data.error}`);
                                    }
                                } catch (e: any) {
                                    alert(`❌ 错误: ${e.message}`);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            variant="outline"
                        >
                            {loading ? "设置中..." : "设置 Webhook"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            💡 提示：本地开发时无需设置 Webhook，可以使用 long polling 模式。
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
