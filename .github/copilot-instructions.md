---
description: "Use The Gatekeeper agent for asset lifecycle work: asset integrity audits, payment reconciliation (Square + Crypto), token-gated delivery, and telemetry formatting."
applyTo:
  - "src/**"
  - "lib/**"
  - "routes/**"
---

When working on files under `src/`, `lib/`, or `routes/`, prefer The Gatekeeper agent for tasks that involve:

- Validating or transforming incoming webhook payloads before fulfillment
- Implementing asset (GLB/3D) audit checks and safe delivery logic
- Writing reconciliation flows for underpayments, slippage, or pending balances
- Producing telemetry frames and milestone trigger rules for the overlay

Guidance for usage:
- Start with the prompt: Use the [the-gatekeeper.prompt](.github/prompts/the-gatekeeper.prompt.md) to describe the task.
- The agent will return a summary, list of files to change, and patch-ready snippets.
- Prefer pull requests for code changes; avoid direct commits to `main`.
