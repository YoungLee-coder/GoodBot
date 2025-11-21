"use server";

import { setSetting } from "@/lib/settings";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateBotToken(formData: FormData) {
    const token = formData.get("botToken") as string;
    if (!token) throw new Error("Token required");

    await setSetting("bot_token", token);
    revalidatePath("/settings");
}

export async function updateAdminPassword(formData: FormData) {
    const password = formData.get("password") as string;
    if (!password) throw new Error("Password required");

    const hashedPassword = await bcrypt.hash(password, 10);
    await setSetting("admin_password", hashedPassword);
    revalidatePath("/settings");
}
