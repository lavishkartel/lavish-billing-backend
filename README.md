# Lavish Legacy Billing Backend

Sovereign commerce rails for Lavish Legacy, combining:

- Square SDK fiat checkout
- Wallet-signed on-chain order authorization
- Arbitrum crypto payment listener and verification
- Verified Square webhook receiver
- Minimal TypeScript Express backend with static storefront hosting

## Setup

1. Copy `.env.example` to `.env`
2. Fill in `SQUARE_*`, `SQUARE_WEBHOOK_SIGNATURE_KEY`, and `CRYPTO_*` values
3. Run `npm install`
4. Run `npm run dev`

## UI

The backend hosts a storefront at `/` with:

- a product catalog for the Volume 01 drop
- card checkout via Square
- wallet connect and wallet-signed checkout order authorization
- on-chain payment instructions and status polling

## Endpoints

- `POST /api/checkout` – create a Square checkout session
- `GET /api/crypto/status` – fetch current crypto listener status
- `GET /api/commerce/config` – fetch product catalog and payment metadata
- `POST /api/wallet/authorize` – submit a signed wallet checkout order
- `GET /api/wallet/orders/:orderId` – query wallet order status
- `POST /api/webhook/square` – receive verified Square webhook events
- `POST /api/webhook/crypto` – receive external crypto webhook events

## Webhook integration

- `SQUARE_WEBHOOK_SIGNATURE_KEY` is used to verify inbound Square payloads.
- `WEBHOOK_URL` can be configured in `.env` for outbound event delivery.
- the backend publishes outbound `checkout.created` and `crypto.payment` notifications.

## Notes

The crypto listener polls a custom RPC node and validates exact Arbitrum payments to the configured address.
