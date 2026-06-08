# The Gatekeeper Sentinel — Architecture & Quickstart

This folder contains a lightweight starter for the Sovereign Fulfillment Sentinel ("The Gatekeeper").

Mermaid architecture diagram:

```mermaid
flowchart LR
  subgraph Ingress
    SQ[Square Webhooks]
    CR[Crypto Listener]
  end
  SQ --> API[Backend Webhook Handler]
  CR --> API
  API --> SENT[Gatekeeper Sentinel]
  SENT --> AUDIT[Asset Integrity Audit]
  SENT --> RECON[Transaction Reconciliation]
  SENT --> TELE[Telemetry Formatter]
  AUDIT --> STORAGE[Asset Storage (S3 / Blob)]
  AUDIT --> TOKEN[Masked Token / Presigned Link]
  TOKEN --> CLIENT[Client Delivery]
  RECON --> DB[Orders DB]
  RECON --> MINT[On-chain Minter]
  MINT --> NETWORK[Blockchain Network]
  TELE --> OVERLAY[KARTEL MASTER OVERLAY]
  API -->|webhook| DB
```

Quickstart (local stub/demo):

- To run the starter sentinel using `ts-node` (no build):

```bash
npx ts-node src/sentinel/index.ts
```

- Or compile and run (if you prefer):

```bash
npm run build
node dist/sentinel/index.js
```

Integration note:

- Import and call `handleIncomingOrderWebhook(payload)` from your existing webhook handler (for example in `routes/webhook.ts`) to run audits, reconciliation, and telemetry formatting before finalizing fulfillment.

This starter intentionally uses lightweight stubs for GLB parsing and blockchain operations — replace the stub sections with a proper GLTF parser, image inspection, and on-chain tooling before production.
