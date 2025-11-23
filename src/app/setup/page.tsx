"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { initializeApp } from "./actions";
import { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function SetupPage() {
    const [webhookUrl, setWebhookUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const { t } = useLanguage();

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
            setError(err.message || t.setup.initFailed.replace('{error}', ''));
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>
            <Card className="w-[500px]">
                <CardHeader>
                    <CardTitle>{t.setup.title}</CardTitle>
                    <CardDescription>{t.setup.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="botToken">{t.setup.botToken}</Label>
                            <Input 
                                id="botToken" 
                                name="botToken" 
                                placeholder={t.setup.botTokenPlaceholder}
                                required 
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t.setup.botTokenHelp}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adminPassword">{t.setup.adminPassword}</Label>
                            <Input 
                                id="adminPassword" 
                                name="adminPassword" 
                                type="password" 
                                required 
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t.setup.adminPasswordHelp}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="webhookUrl">{t.setup.webhookUrl}</Label>
                            <Input 
                                id="webhookUrl" 
                                name="webhookUrl" 
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                placeholder={t.setup.webhookUrlPlaceholder}
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t.setup.webhookUrlHelp}
                            </p>
                        </div>
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? t.setup.initializing : t.setup.initialize}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
