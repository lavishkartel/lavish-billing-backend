import fs from 'fs';
import path from 'path';

// Starter sentinel: listens to webhook payloads passed in by the main API

export async function handleIncomingOrderWebhook(payload: any) {
  console.log('Gatekeeper: received payload', payload.event || payload.type || 'unknown');

  // 1) Asset integrity audit
  if (payload.asset && payload.asset.path) {
    const audit = await runAssetAudit(payload.asset.path);
    if (!audit.passed) {
      console.warn('Asset audit failed:', audit.reasons);
      // return a structured response so caller can decide (hold, fallback, alert)
      return { status: 'held', reason: 'asset_audit_failed', details: audit };
    }
  }

  // 2) Transaction reconciliation (stub)
  const recon = await reconcileTransaction(payload.transaction || {});
  if (recon.status === 'pending_balance') {
    return { status: 'held', reason: 'pending_balance', details: recon };
  }

  // 3) Generate masked token / presigned link (stub)
  const token = await generateMaskedToken(payload.asset?.path || '');

  // 4) Emit telemetry frame
  const telemetry = formatTelemetryFrame(payload, { audit: true, recon: recon });
  pushTelemetry(telemetry);

  return { status: 'delivered', token };
}

async function runAssetAudit(assetPath: string) {
  // Stub: replace with GLTF parsing, polycount checks, texture packing validation
  console.log('Running asset audit on', assetPath);
  try {
    const stat = await fs.promises.stat(assetPath);
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB for demo
    const passed = stat.size <= maxSizeBytes;
    return { passed, reasons: passed ? [] : ['file_size_exceeded'], size: stat.size };
  } catch (err) {
    return { passed: false, reasons: ['asset_not_found'], error: String(err) };
  }
}

async function reconcileTransaction(tx: any) {
  // Stub: compute underpayment, lock state if needed
  console.log('Reconciling transaction', tx.id || tx.hash || 'unknown');
  if (!tx.amount) return { status: 'ok' };
  // Demo: if amount < required, mark pending
  const required = tx.requiredAmount || tx.expectedAmount || 100;
  if (Number(tx.amount) < Number(required)) {
    const deficit = Number(required) - Number(tx.amount);
    return { status: 'pending_balance', deficit, currency: tx.currency || 'USD' };
  }
  return { status: 'ok' };
}

async function generateMaskedToken(assetPath: string) {
  // Stub: create a cryptographically-random masked token, store mapping in DB/cache
  const token = 'mask_' + Math.random().toString(36).slice(2, 10);
  console.log('Generated token for', assetPath, token);
  return { token, expires: Date.now() + 1000 * 60 * 60 };
}

function formatTelemetryFrame(payload: any, meta: any) {
  return {
    timestamp: new Date().toISOString(),
    event: payload.event || payload.type || 'order',
    orderId: payload.orderId || payload.id,
    meta,
  };
}

function pushTelemetry(frame: any) {
  // Stub: push to overlay or message queue
  console.log('Telemetry frame -> overlay', JSON.stringify(frame));
}

// CLI runner for local dev/demo
if (require.main === module) {
  const sample = { event: 'demo.purchase', orderId: 'demo-123', asset: { path: path.resolve('./public/sample.glb') }, transaction: { amount: 90, expectedAmount: 100 } };
  handleIncomingOrderWebhook(sample).then((r) => console.log('Result:', r)).catch(console.error);
}
