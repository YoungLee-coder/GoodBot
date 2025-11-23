"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateBotToken, updateAdminPassword } from "./actions";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    return (
        <div className="p-6 space-y-6 max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight">{t.settings.title}</h1>

            <Card>
                <CardHeader>
                    <CardTitle>{t.settings.botConfig}</CardTitle>
                    <CardDescription>{t.settings.botConfigDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={async (formData) => {
                        setLoading(true);
                        await updateBotToken(formData);
                        setLoading(false);
                        alert(t.settings.tokenUpdated);
                    }} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="botToken">{t.settings.newBotToken}</Label>
                            <Input id="botToken" name="botToken" type="password" placeholder={t.settings.currentTokenHidden} required />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? t.settings.updating : t.settings.updateToken}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t.settings.adminSecurity}</CardTitle>
                    <CardDescription>{t.settings.adminSecurityDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={async (formData) => {
                        setLoading(true);
                        await updateAdminPassword(formData);
                        setLoading(false);
                        alert(t.settings.passwordUpdated);
                    }} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">{t.settings.newPassword}</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <Button type="submit" variant="secondary" disabled={loading}>
                            {loading ? t.settings.updating : t.settings.updatePassword}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t.settings.webhook}</CardTitle>
                    <CardDescription>{t.settings.webhookDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {t.settings.webhookInfo}
                        </p>
                        <Button
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    const res = await fetch('/api/setup-webhook');
                                    const data = await res.json();
                                    if (data.success) {
                                        alert(t.settings.webhookSuccess.replace('{url}', data.webhookUrl));
                                    } else {
                                        alert(t.settings.webhookFailed.replace('{error}', data.error));
                                    }
                                } catch (e: any) {
                                    alert(t.settings.webhookError.replace('{error}', e.message));
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            variant="outline"
                        >
                            {loading ? t.settings.settingUp : t.settings.setupWebhook}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            {t.settings.webhookTip}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
