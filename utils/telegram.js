/**
 * Dedicated Telegram Notification Module for QR Incentive System
 * Handles secure and robust Telegram notifications with silent fallback error handling.
 */

const TELEGRAM_BOT_TOKEN = "8317235033:AAHH170RgfkZV2TE5NJNJ3OF1fbgtQ5Y5qs";
const TELEGRAM_CHAT_ID = "8323490655";

/**
 * Sends an HTML-formatted message alert to the designated Telegram group/channel.
 * This runs within a try-catch block to completely isolate the notification pipeline
 * and prevent external communication errors from impacting the application database pipeline.
 * 
 * @param {string} message - HTML formatted message content to send.
 * @returns {Promise<void>}
 */
export async function sendTelegramAlert(message) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    };

    console.log("--> SENDING TELEGRAM ALERT:", message);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`❌ Telegram API responded with status ${response.status}:`, responseText);
    } else {
      console.log("✅ Telegram Alert delivered successfully.");
    }
  } catch (error) {
    // CRITICAL: Catch and log any errors silently so the main express route does not crash.
    console.error("❌ Failed to propagate alert to Telegram channel (silently ignored):", error);
  }
}
