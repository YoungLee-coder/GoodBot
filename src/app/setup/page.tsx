"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { initializeApp } from "./actions";

export default function SetupPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>GoodBot Setup</CardTitle>
                    <CardDescription>Initialize your bot settings</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={initializeApp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="botToken">Telegram Bot Token</Label>
                            <Input id="botToken" name="botToken" placeholder="123456:ABC-DEF..." required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adminPassword">Admin Password</Label>
                            <Input id="adminPassword" name="adminPassword" type="password" required />
                        </div>
                        <Button type="submit" className="w-full">Initialize</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
