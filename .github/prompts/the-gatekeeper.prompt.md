---
name: "the-gatekeeper.prompt"
description: "Prompt to invoke The Sovereign Fulfillment Sentinel (The Gatekeeper) for asset audits, payment reconciliation, and telemetry flows."
agent: the-gatekeeper
argument-hint: "Provide task details, e.g. 'Add GLB polycount check + presigned link for SKU: vest-01'"
user-invocable: true
---

Use this prompt to request implementation work or design guidance from The Gatekeeper agent.

Example prompts:
- Implement the GLB asset integrity audit for mobile/WebAR SKUs: check polycount <= 60,000, texture channel packing, and file size limits; return a presigned secure link and fallback to previous stable version on failure.
- Design pending-balance handling for underpaid crypto receipts: compute USD deficit given live FX, lock fulfillment state, and emit reconciliation task to operator dashboard.
- Create telemetry frames for KARTEL MASTER OVERLAY: convert webhook payloads into summarized status frames and milestone triggers.

Requested output format:
1. One-paragraph summary of proposed change
2. Files to add/update (paths)
3. Short code snippets or function skeletons
4. Integration notes and runtime considerations
