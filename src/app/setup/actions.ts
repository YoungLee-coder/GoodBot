"use server";

import { setSetting } from "@/lib/settings";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function initializeApp(formData: FormData) {
    const botToken = formData.get("botToken") as string;
    const adminPassword = formData.get("adminPassword") as string;

    if (!botToken || !adminPassword) {
        throw new Error("Missing fields");
    }

    // Save settings
    await setSetting("bot_token", botToken);

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await setSetting("admin_password", hashedPassword);

    redirect("/");
}
