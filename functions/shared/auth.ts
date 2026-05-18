/// <reference types="@cloudflare/workers-types" />

type CfSubtleCrypto = SubtleCrypto & {
  timingSafeEqual(a: ArrayBufferLike, b: ArrayBufferLike): boolean;
};

const encoder = new TextEncoder();

export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const subtle = crypto.subtle as CfSubtleCrypto;
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.byteLength !== bBytes.byteLength) {
    subtle.timingSafeEqual(aBytes.buffer as ArrayBuffer, aBytes.buffer as ArrayBuffer);
    return false;
  }
  return subtle.timingSafeEqual(aBytes.buffer as ArrayBuffer, bBytes.buffer as ArrayBuffer);
}

export async function verifyCronSecret(
  request: Request,
  secret: string | undefined,
): Promise<boolean> {
  const presented = request.headers.get("x-cron-secret");
  if (!presented || !secret) return false;
  return timingSafeEqual(presented, secret);
}
