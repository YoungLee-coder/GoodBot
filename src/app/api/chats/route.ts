import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { requireAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
    const authError = await requireAuth();
    if (authError) return authError;

    try {
        // Fetch all users, ordered by creation time (newest first)
        // Ideally we should order by last message time, but for MVP this is fine.
        const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

        // Convert BigInt to string for JSON serialization
        const serializedUsers = allUsers.map(user => ({
            ...user,
            id: user.id.toString(),
        }));

        return apiSuccess(serializedUsers);
    } catch (error) {
        console.error("Failed to fetch chats:", error);
        return apiError("Internal Server Error", 500);
    }
}
