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
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Bot Configuration</CardTitle>
                    <CardDescription>Update your Telegram Bot Token</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={async (formData) => {
                        setLoading(true);
                        await updateBotToken(formData);
                        setLoading(false);
                        alert("Token updated!");
                    }} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="botToken">New Bot Token</Label>
                            <Input id="botToken" name="botToken" type="password" placeholder="Current token hidden" required />
                        </div>
                        <Button type="submit" disabled={loading}>Update Token</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Admin Security</CardTitle>
                    <CardDescription>Change your Admin Password (for /login)</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={async (formData) => {
                        setLoading(true);
                        await updateAdminPassword(formData);
                        setLoading(false);
                        alert("Password updated!");
                    }} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <Button type="submit" variant="secondary" disabled={loading}>Update Password</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Telegram Webhook</CardTitle>
                    <CardDescription>Configure webhook for receiving messages (required for Vercel deployment)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            After deploying to Vercel, click this button to tell Telegram where to send messages.
                        </p>
                        <Button
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    const res = await fetch('/api/setup-webhook');
                                    const data = await res.json();
                                    if (data.success) {
                                        alert(`✅ Webhook set successfully!\n\nURL: ${data.webhookUrl}\n\nYour bot is now ready to receive messages.`);
                                    } else {
                                        alert(`❌ Failed: ${data.error}`);
                                    }
                                } catch (e: any) {
                                    alert(`❌ Error: ${e.message}`);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            variant="outline"
                        >
                            Setup Webhook
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
