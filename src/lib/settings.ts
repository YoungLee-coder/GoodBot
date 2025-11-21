import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getSetting(key: string) {
    try {
        const result = await db.select().from(settings).where(eq(settings.key, key));
        return result[0]?.value;
    } catch (error) {
        console.error("Failed to get setting:", error);
        return null;
    }
}

export async function setSetting(key: string, value: string) {
    try {
        await db.insert(settings).values({ key, value }).onConflictDoUpdate({
            target: settings.key,
            set: { value },
        });
    } catch (error) {
        console.error("Failed to set setting:", error);
        throw error;
    }
}

export async function isAppInitialized() {
    const token = await getSetting("bot_token");
    return !!token;
}
