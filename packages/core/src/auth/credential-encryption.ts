/**
 * Credential encryption — AES-256-GCM encrypt/decrypt for CLI credentials at rest.
 *
 * Uses a caller-supplied server-side encryption key to encrypt credentials
 * before writing to S3 and decrypt after reading.
 *
 * Each encrypted payload includes a random IV and auth tag, so identical
 * plaintext produces different ciphertext every time.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Envelope format stored in S3:
 * { iv: hex, tag: hex, ciphertext: base64, v: 1 }
 */
export interface EncryptedEnvelope {
  v: 1;
  iv: string;
  tag: string;
  ciphertext: string;
}

function getEncryptionKey(raw: string): Buffer {
  if (!raw) {
    throw new Error(
      "Credential encryption key is required. Provide a 64-char hex string (32 bytes)."
    );
  }

  const key = Buffer.from(raw, "hex");
  if (key.length !== 32) {
    throw new Error(
      `Credential encryption key must be 32 bytes (64 hex chars), got ${key.length} bytes.`
    );
  }

  return key;
}

/**
 * Encrypt a plaintext string and return a JSON-serializable envelope.
 */
export function encryptCredential(
  plaintext: string,
  encryptionKey: string
): EncryptedEnvelope {
  const key = getEncryptionKey(encryptionKey);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    v: 1,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    ciphertext: encrypted.toString("base64"),
  };
}

/**
 * Decrypt an encrypted envelope back to plaintext.
 */
export function decryptCredential(
  envelope: EncryptedEnvelope,
  encryptionKey: string
): string {
  if (envelope.v !== 1) {
    throw new Error(`Unsupported envelope version: ${envelope.v}`);
  }

  const key = getEncryptionKey(encryptionKey);
  const iv = Buffer.from(envelope.iv, "hex");
  const tag = Buffer.from(envelope.tag, "hex");
  const ciphertext = Buffer.from(envelope.ciphertext, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
