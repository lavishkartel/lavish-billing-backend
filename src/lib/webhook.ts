import axios from "axios";
import { config } from "../config.js";

export async function notifyWebhook(eventType: string, payload: unknown): Promise<void> {
  if (!config.webhookUrl) {
    return;
  }

  try {
    await axios.post(config.webhookUrl, {
      event: eventType,
      timestamp: new Date().toISOString(),
      payload
    }, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Webhook delivery failed:", error);
  }
}
