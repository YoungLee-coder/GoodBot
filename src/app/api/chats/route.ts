import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Fetch all users, ordered by creation time (newest first)
        // Ideally we should order by last message time, but for MVP this is fine.
        const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

        // Convert BigInt to string for JSON serialization
        const serializedUsers = allUsers.map(user => ({
            ...user,
            id: user.id.toString(),
        }));

        return NextResponse.json(serializedUsers);
    } catch (error) {
        console.error("Failed to fetch chats:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
