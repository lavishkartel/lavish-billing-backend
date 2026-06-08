import { Client, Environment } from "square";
import { config } from "../config.js";
import { notifyWebhook } from "./webhook.js";

const squareClient = new Client({
  environment: config.squareEnv === "production" ? Environment.Production : Environment.Sandbox,
  accessToken: config.squareAccessToken
});

export async function createSquareCheckout(orderId: string, items: Array<{name:string; quantity:number; priceCents:number}>): Promise<string> {
  if (!config.squareLocationId) {
    throw new Error("Square location ID is not configured.");
  }

  const lineItems = items.map((item) => ({
    name: item.name,
    quantity: item.quantity.toString(),
    basePriceMoney: {
      amount: BigInt(item.priceCents),
      currency: "USD"
    }
  }));

  const response = await squareClient.checkoutApi.createCheckout(config.squareLocationId, {
    idempotencyKey: `${orderId}-${Date.now()}`,
    order: {
      order: {
        locationId: config.squareLocationId,
        lineItems
      }
    },
    askForShippingAddress: false,
    merchantSupportEmail: "support@lavish-legacy.example",
    redirectUrl: config.squareRedirectUrl
  });

  if (!response.result.checkout?.checkoutPageUrl) {
    throw new Error("Unable to create Square checkout session.");
  }

  const checkoutUrl = response.result.checkout.checkoutPageUrl;
  await notifyWebhook("checkout.created", { orderId, items, checkoutUrl });
  return checkoutUrl;
}
