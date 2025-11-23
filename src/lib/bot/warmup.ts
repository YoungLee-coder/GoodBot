import { getBot } from "./index";

// Bot 预热函数，在应用启动时调用
export async function warmupBot() {
  try {
    console.log("Warming up bot...");
    const bot = await getBot();
    if (bot) {
      console.log("Bot warmed up successfully");
    } else {
      console.log("Bot not initialized (no token)");
    }
  } catch (error) {
    console.error("Failed to warm up bot:", error);
  }
}

// 自动预热（在模块加载时）
if (process.env.NODE_ENV === "production") {
  // 延迟5秒后预热，避免阻塞应用启动
  setTimeout(() => {
    warmupBot();
  }, 5000);
}
