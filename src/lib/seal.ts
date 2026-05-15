/**
 * lib/seal.ts — Client-side encryption boundary for Seal-compatible payloads.
 *
 * This implementation uses WebCrypto AES-GCM with a deterministic key derived
 * from the allowed decryptor list. It provides real encryption and a stable
 * ciphertext format that can be migrated to a Seal SDK backend later.
 */

const SEAL_PREFIX = 'SEAL1';
const SEAL_SALT = 'walrusform-seal-v1';

function normalizeDecryptors(allowedDecryptors: string[]) {
  return allowedDecryptors.map((w) => w.toLowerCase()).sort().join('|');
}

function toBase64(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function fromBase64(str: string) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(allowedDecryptors: string[]) {
  if (!allowedDecryptors || allowedDecryptors.length === 0) {
    throw new Error('Seal encryption requires at least one approved wallet.');
  }
  const encoder = new TextEncoder();
  const material = `${SEAL_SALT}:${normalizeDecryptors(allowedDecryptors)}`;
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(material),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SEAL_SALT),
      iterations: 120_000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptWithSeal(
  data: string,
  allowedDecryptors: string[] // array of Sui wallet addresses
): Promise<string> {
  const key = await deriveKey(allowedDecryptors);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );
  return `${SEAL_PREFIX}:${toBase64(iv)}:${toBase64(ciphertext)}`;
}

export async function decryptWithSeal(
  ciphertext: string,
  allowedDecryptors: string[],
  walletAddress?: string
): Promise<string> {
  if (!ciphertext.startsWith(`${SEAL_PREFIX}:`)) {
    throw new Error('Seal decryption: unsupported ciphertext format');
  }
  if (walletAddress) {
    const normalized = walletAddress.toLowerCase();
    const allowed = allowedDecryptors.map((w) => w.toLowerCase());
    if (!allowed.includes(normalized)) {
      throw new Error('Seal decryption: wallet not authorized');
    }
  }
  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('Seal decryption: malformed payload');

  const [, ivB64, dataB64] = parts;
  const iv = fromBase64(ivB64);
  const data = fromBase64(dataB64);
  const key = await deriveKey(allowedDecryptors);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
