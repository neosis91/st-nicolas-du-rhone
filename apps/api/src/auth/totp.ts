import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateSecret() {
  return base32Encode(randomBytes(20));
}

export function totpCode(secretBase32: string, at = Date.now()) {
  const counter = Math.floor(at / 1000 / 30);
  return hotp(base32Decode(secretBase32), counter);
}

export function verifyTotp(secretBase32: string, token: string, at = Date.now()) {
  const normalized = token.replace(/\s/g, '');
  if (!/^\d{6}$/.test(normalized)) return false;
  const counter = Math.floor(at / 1000 / 30);
  const secret = base32Decode(secretBase32);
  for (let offset = -1; offset <= 1; offset += 1) {
    if (safeEqual(hotp(secret, counter + offset), normalized)) return true;
  }
  return false;
}

export function recoveryCodes(count = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: count }, () => {
    const bytes = randomBytes(8);
    const chunk = (start: number) =>
      Array.from({ length: 4 }, (_, index) => alphabet[bytes[start + index] % alphabet.length]).join('');
    return `${chunk(0)}-${chunk(4)}`;
  });
}

export function hashRecovery(code: string) {
  return createHash('sha256').update(normalizeRecovery(code)).digest('hex');
}

export function matchRecovery(code: string, hashes: string[]) {
  const digest = hashRecovery(code);
  return hashes.some((hash) => safeEqual(hash, digest));
}

function normalizeRecovery(code: string) {
  return code.replace(/\s/g, '').toUpperCase();
}

function hotp(secret: Buffer, counter: number) {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', secret).update(message).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(binary % 1_000_000).padStart(6, '0');
}

function base32Encode(buffer: Buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input: string) {
  const clean = input.toUpperCase().replace(/=+$/g, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
