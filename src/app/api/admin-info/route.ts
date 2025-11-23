import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const adminChatIdStr = await getSetting("admin_chat_id");
    
    if (!adminChatIdStr) {
      return NextResponse.json({ 
        isLinked: false,
        message: "No admin linked yet" 
      });
    }

    const adminChatId = parseInt(adminChatIdStr);
    
    // 从数据库获取管理员用户信息
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, adminChatId));

    if (!adminUser) {
      return NextResponse.json({
        isLinked: true,
        chatId: adminChatId,
        username: null,
        firstName: null,
        lastName: null,
      });
    }

    return NextResponse.json({
      isLinked: true,
      chatId: adminChatId,
      username: adminUser.username,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
    });
  } catch (error) {
    console.error("Failed to get admin info:", error);
    return NextResponse.json(
      { error: "Failed to get admin info" },
      { status: 500 }
    );
  }
}
