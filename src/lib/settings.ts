import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getSetting(key: string) {
    try {
        const result = await db.select().from(settings).where(eq(settings.key, key));
        return result[0]?.value || null;
    } catch (error) {
        console.error(`Failed to get setting "${key}":`, error);
        return null;
    }
}

export async function setSetting(key: string, value: string) {
    try {
        await db.insert(settings).values({ key, value }).onConflictDoUpdate({
            target: settings.key,
            set: { value },
        });
        console.log(`Setting "${key}" saved successfully`);
    } catch (error) {
        console.error(`Failed to set setting "${key}":`, error);
        throw error;
    }
}

export async function isAppInitialized() {
    try {
        const token = await getSetting("bot_token");
        const initialized = !!token;
        console.log(`App initialization check: ${initialized ? "initialized" : "not initialized"}`);
        return initialized;
    } catch (error) {
        console.error("Failed to check app initialization:", error);
        return false;
    }
}
