import dotenv from "dotenv";

dotenv.config();

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  port: parseNumber(process.env.PORT, 4000),
  squareEnv: (process.env.SQUARE_ENV ?? "sandbox").toLowerCase(),
  squareAccessToken: process.env.SQUARE_ACCESS_TOKEN ?? "",
  squareLocationId: process.env.SQUARE_LOCATION_ID ?? "",
  squareRedirectUrl: process.env.SQUARE_REDIRECT_URL ?? "https://lavish-legacy.example/checkout/complete",
  squareWebhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? "",
  webhookUrl: process.env.WEBHOOK_URL ?? "",
  cryptoRpcUrl: process.env.CRYPTO_RPC_URL ?? "",
  cryptoPaymentAddress: process.env.CRYPTO_PAYMENT_ADDRESS ?? "",
  cryptoPaymentAmount: process.env.CRYPTO_PAYMENT_AMOUNT ?? "0.01",
  cryptoPaymentToken: process.env.CRYPTO_PAYMENT_TOKEN ?? "ETH",
  cryptoPollIntervalMs: parseNumber(process.env.CRYPTO_POLL_INTERVAL_MS, 15000),
  products: [
    {
      id: "v01-arsenal-jacket",
      name: "VOLUME 01 // Arsenal Jacket",
      description: "Structured tactical jacket with modular cargo and armored silhouette.",
      priceCents: 18500,
      currency: "USD",
      available: true
    },
    {
      id: "v01-phantom-pants",
      name: "VOLUME 01 // Phantom Pants",
      description: "Multi-panel tactical cargo pants with articulated movement.",
      priceCents: 12500,
      currency: "USD",
      available: true
    },
    {
      id: "v01-sentry-hood",
      name: "VOLUME 01 // Sentry Hood",
      description: "Low-profile hooded overlay with rigid, technical form.",
      priceCents: 9500,
      currency: "USD",
      available: true
    }
  ]
};
