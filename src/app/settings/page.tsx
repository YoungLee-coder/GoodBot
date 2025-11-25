"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateBotToken, updateAdminPassword } from "./actions";
import { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { Bot, CheckCircle2, XCircle } from "lucide-react";

type BotInfo = {
    id: number;
    username: string;
    firstName: string;
    canJoinGroups: boolean;
    canReadAllGroupMessages: boolean;
    supportsInlineQueries: boolean;
    webhook: {
        url: string | null;
        hasCustomCertificate: boolean;
        pendingUpdateCount: number;
        lastErrorDate?: number;
        lastErrorMessage?: string;
    };
};

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
    const [botInfoLoading, setBotInfoLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        async function fetchBotInfo() {
            try {
                const res = await fetch("/api/bot-info");
                if (res.ok) {
                    const data = await res.json();
                    setBotInfo(data);
                }
            } catch (error) {
                console.error("Failed to fetch bot info:", error);
            } finally {
                setBotInfoLoading(false);
            }
        }
        fetchBotInfo();
    }, []);

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
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        {t.settings.botInfo}
                    </CardTitle>
                    <CardDescription>{t.settings.botInfoDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                    {botInfoLoading ? (
                        <p className="text-sm text-muted-foreground">{t.common.loading}</p>
                    ) : botInfo ? (
                        <div className="space-y-4">
                            <div className="grid gap-3 text-sm">
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="font-medium text-muted-foreground">{t.settings.botName}</span>
                                    <span className="font-medium">{botInfo.firstName}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="font-medium text-muted-foreground">{t.settings.botUsername}</span>
                                    <span className="font-mono">@{botInfo.username}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="font-medium text-muted-foreground">{t.settings.botId}</span>
                                    <span className="font-mono">{botInfo.id}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="font-medium text-muted-foreground">{t.settings.canJoinGroups}</span>
                                    <span className="flex items-center gap-1">
                                        {botInfo.canJoinGroups ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                {t.settings.yes}
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-4 w-4 text-red-500" />
                                                {t.settings.no}
                                            </>
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="font-medium text-muted-foreground">{t.settings.canReadMessages}</span>
                                    <span className="flex items-center gap-1">
                                        {botInfo.canReadAllGroupMessages ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                {t.settings.yes}
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-4 w-4 text-red-500" />
                                                {t.settings.no}
                                            </>
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="font-medium text-muted-foreground">{t.settings.webhookStatus}</span>
                                    <span className="flex items-center gap-1">
                                        {botInfo.webhook.url ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                {t.settings.webhookActive}
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-4 w-4 text-yellow-500" />
                                                {t.settings.webhookNotSet}
                                            </>
                                        )}
                                    </span>
                                </div>
                                {botInfo.webhook.url && (
                                    <>
                                        <div className="flex items-center justify-between py-2 border-b">
                                            <span className="font-medium text-muted-foreground">{t.settings.webhookUrl}</span>
                                            <span className="font-mono text-xs truncate max-w-[300px]">{botInfo.webhook.url}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="font-medium text-muted-foreground">{t.settings.pendingUpdates}</span>
                                            <span className="font-medium">{botInfo.webhook.pendingUpdateCount}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-red-500">Failed to load bot info</p>
                    )}
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
                                        // 刷新 Bot 信息
                                        const infoRes = await fetch("/api/bot-info");
                                        if (infoRes.ok) {
                                            const infoData = await infoRes.json();
                                            setBotInfo(infoData);
                                        }
                                    } else {
                                        alert(t.settings.webhookFailed.replace('{error}', data.error));
                                    }
                                } catch (e) {
                                    const message = e instanceof Error ? e.message : "Unknown error";
                                    alert(t.settings.webhookError.replace('{error}', message));
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
