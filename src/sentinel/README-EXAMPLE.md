## Example: Integrating the Gatekeeper into existing webhook route

Edit your `routes/webhook.ts` to import and call the sentinel:

```ts
import { handleIncomingOrderWebhook } from '../sentinel/index';

// inside your webhook handler
const result = await handleIncomingOrderWebhook(payload);
if (result.status === 'held') {
  // return 202, notify ops, or persist the hold state
}
```

This keeps the sentinel logic isolated and testable.
