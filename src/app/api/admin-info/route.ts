import { getSetting } from "@/lib/settings";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const adminChatIdStr = await getSetting("admin_chat_id");
    
    if (!adminChatIdStr) {
      return apiSuccess({ 
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
      return apiSuccess({
        isLinked: true,
        chatId: adminChatId,
        username: null,
        firstName: null,
        lastName: null,
      });
    }

    return apiSuccess({
      isLinked: true,
      chatId: adminChatId,
      username: adminUser.username,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
    });
  } catch (error) {
    console.error("Failed to get admin info:", error);
    return apiError("Failed to get admin info", 500);
  }
}
