import { getBot } from "@/lib/bot";
import { requireAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const bot = await getBot();
    
    if (!bot) {
      return apiError("Bot not initialized", 500);
    }

    // 获取 Bot 信息
    const botInfo = await bot.api.getMe();
    
    // 获取 Webhook 信息
    const webhookInfo = await bot.api.getWebhookInfo();

    return apiSuccess({
      id: botInfo.id,
      username: botInfo.username,
      firstName: botInfo.first_name,
      canJoinGroups: botInfo.can_join_groups,
      canReadAllGroupMessages: botInfo.can_read_all_group_messages,
      supportsInlineQueries: botInfo.supports_inline_queries,
      webhook: {
        url: webhookInfo.url || null,
        hasCustomCertificate: webhookInfo.has_custom_certificate,
        pendingUpdateCount: webhookInfo.pending_update_count,
        lastErrorDate: webhookInfo.last_error_date,
        lastErrorMessage: webhookInfo.last_error_message,
      },
    });
  } catch (error) {
    console.error("Failed to get bot info:", error);
    const message = error instanceof Error ? error.message : "Failed to get bot info";
    return apiError(message, 500);
  }
}
