import crypto from "crypto";

function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
}

export function verifySquareSignature(rawBody: Buffer, signatureHeader: string | undefined, signatureKey: string): boolean {
  if (!rawBody || !signatureHeader || !signatureKey) {
    return false;
  }

  const signature = signatureHeader.trim();
  const compute = (algorithm: string) =>
    crypto.createHmac(algorithm, signatureKey).update(rawBody).digest("base64");

  if (safeCompare(compute("sha1"), signature)) {
    return true;
  }

  if (safeCompare(compute("sha256"), signature)) {
    return true;
  }

  return false;
}
