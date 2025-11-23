import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import { forceUpdateBotCommands } from "@/lib/bot";

export async function POST() {
  try {
    const adminChatIdStr = await getSetting("admin_chat_id");
    
    if (!adminChatIdStr) {
      return NextResponse.json({ 
        error: "No admin linked" 
      }, { status: 400 });
    }

    // 删除 admin_chat_id
    await setSetting("admin_chat_id", "");

    // 强制更新 Bot 命令菜单，添加回 login 命令
    await forceUpdateBotCommands(false);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unbind admin:", error);
    return NextResponse.json(
      { error: "Failed to unbind admin" },
      { status: 500 }
    );
  }
}
