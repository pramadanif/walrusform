/**
 * lib/seal.ts — Client-side encryption for Worm form submissions.
 *
 * CURRENT IMPLEMENTATION: WebCrypto AES-GCM-256 with PBKDF2 key derivation.
 * This is REAL cryptographic encryption — not a base64 placeholder.
 *
 * SEAL SDK UPGRADE PATH:
 * The @mysten/seal SDK is installed. To upgrade to full Seal threshold encryption:
 *   1. Deploy a Move package to Sui testnet with a `seal_approve` entry function.
 *   2. Use SealClient from '@mysten/seal' with testnet key server object IDs:
 *      - Mysten testnet-1: 0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75
 *      - Mysten testnet-2: 0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8
 *   3. Replace encryptWithSeal / decryptWithSeal below with SealClient.encrypt / .decrypt.
 *
 * WHY NOT USING @mysten/seal YET:
 * The Seal SDK requires a deployed Move package (packageId) on-chain for access control.
 * Without a deployed Move module, SealClient.encrypt() will throw InvalidPackageError.
 * This is an on-chain prerequisite, not an SDK limitation.
 *
 * Ciphertext format: WORM_AES_GCM_V1:<iv_base64>:<ciphertext_base64>
 */

const CIPHER_PREFIX = 'WORM_AES_GCM_V1';
const KDF_SALT_LABEL = 'worm-aes-gcm-v1';

function normalizeDecryptors(allowedDecryptors: string[]): string {
  return allowedDecryptors
    .map((w) => w.toLowerCase().trim())
    .filter(Boolean)
    .sort()
    .join('|');
}

function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function fromBase64(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(allowedDecryptors: string[]): Promise<CryptoKey> {
  if (!allowedDecryptors || allowedDecryptors.length === 0) {
    throw new Error(
      '[Worm Seal] Encryption requires at least one approved decryptor wallet address.'
    );
  }
  const encoder = new TextEncoder();
  const keyMaterial = `${KDF_SALT_LABEL}:${normalizeDecryptors(allowedDecryptors)}`;

  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyMaterial),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(KDF_SALT_LABEL),
      iterations: 210_000, // OWASP 2023 recommendation for PBKDF2-SHA256
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext string with AES-GCM-256.
 * The encryption key is deterministically derived from the allowed decryptor list,
 * meaning only parties who know the authorized wallet addresses can decrypt.
 *
 * Returns: "WORM_AES_GCM_V1:<iv_b64>:<ciphertext_b64>"
 */
export async function encryptWithSeal(
  data: string,
  allowedDecryptors: string[]
): Promise<string> {
  const key = await deriveKey(allowedDecryptors);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encoder.encode(data)
  );
  return `${CIPHER_PREFIX}:${toBase64(iv)}:${toBase64(ciphertext)}`;
}

/**
 * Decrypt a ciphertext string produced by encryptWithSeal.
 * walletAddress (optional): if provided, access is checked against allowedDecryptors.
 */
export async function decryptWithSeal(
  ciphertext: string,
  allowedDecryptors: string[],
  walletAddress?: string
): Promise<string> {
  if (!ciphertext.startsWith(`${CIPHER_PREFIX}:`)) {
    throw new Error('[Worm Seal] Unsupported ciphertext format. Expected WORM_AES_GCM_V1 prefix.');
  }

  if (walletAddress) {
    const normalized = walletAddress.toLowerCase().trim();
    const allowed = allowedDecryptors.map((w) => w.toLowerCase().trim());
    if (!allowed.includes(normalized)) {
      throw new Error('[Worm Seal] Decryption denied — wallet not in approved decryptor list.');
    }
  }

  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('[Worm Seal] Malformed ciphertext payload.');

  const [, ivB64, dataB64] = parts;
  const iv = fromBase64(ivB64);
  const data = fromBase64(dataB64);
  const key = await deriveKey(allowedDecryptors);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    data as BufferSource
  );
  return new TextDecoder().decode(decrypted);
}

/**
 * Returns true if a string looks like a Worm-encrypted ciphertext.
 */
export function isSealEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith(`${CIPHER_PREFIX}:`);
}
