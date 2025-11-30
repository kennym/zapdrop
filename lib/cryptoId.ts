import { randomBytes } from "crypto";

const BASE62_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Generate a cryptographically secure random ID using 128 bits of entropy.
 * Results in a 22-character base62 string that is impossible to guess or enumerate.
 */
export function generateSecureId(): string {
  const bytes = randomBytes(16); // 128 bits
  return encodeBase62(bytes);
}

/**
 * Encode bytes to base62 string
 */
function encodeBase62(buffer: Buffer): string {
  let num = BigInt("0x" + buffer.toString("hex"));
  let result = "";

  while (num > 0n) {
    const remainder = Number(num % 62n);
    result = BASE62_CHARS[remainder] + result;
    num = num / 62n;
  }

  // Pad to ensure consistent length (22 chars for 128 bits)
  while (result.length < 22) {
    result = "0" + result;
  }

  return result;
}

/**
 * Validate that a string looks like a valid drop ID
 */
export function isValidDropId(id: string): boolean {
  if (!id || id.length < 20 || id.length > 24) {
    return false;
  }
  return /^[0-9A-Za-z]+$/.test(id);
}
