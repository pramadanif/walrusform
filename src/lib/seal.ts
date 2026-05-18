import { SealClient } from '@mysten/seal';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { SUI_RPC_URL, SUI_NETWORK } from './contracts';

const SEAL_KEY_SERVER_OBJECT_ID = "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75";

let sealClientInstance: SealClient | null = null;

function getSealClient() {
  if (sealClientInstance) return sealClientInstance;
  const client = new SuiJsonRpcClient({ 
    url: SUI_RPC_URL,
    network: SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet'
  });
  sealClientInstance = new SealClient({
    suiClient: client as any,
    serverConfigs: [
      {
        objectId: SEAL_KEY_SERVER_OBJECT_ID,
        weight: 1,
      }
    ],
  });
  return sealClientInstance;
}

const CIPHER_PREFIX = 'WORM_AES_GCM_V1';
const SEAL_PREFIX = 'WORM_SEAL_SDK_V1';
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
  allowedDecryptors: string[],
  formObjectId?: string
): Promise<string> {
  // 1. Try REAL SEAL SDK Threshold Encryption if formObjectId is provided
  if (formObjectId) {
    try {
      const seal = getSealClient();
      const encoder = new TextEncoder();
      const { encryptedObject } = await seal.encrypt({
        threshold: 1,
        packageId: "0x624805e8d931a770ebc5426a72797fc74b7f100cfb0083d67d77d48558fa5e83", // WORM package
        id: formObjectId, // Using form ID as the identity namespace
        data: encoder.encode(data),
      });
      return `${SEAL_PREFIX}:${toBase64(encryptedObject)}`;
    } catch (e) {
      console.warn('[Worm Seal] SDK Encryption failed, falling back to AES-GCM:', e);
    }
  }

  // 2. Fallback to AES-GCM
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
 * Decrypt a ciphertext string. Supports both Seal SDK and AES-GCM fallback.
 */
export async function decryptWithSeal(
  ciphertext: string,
  allowedDecryptors: string[],
  walletAddress?: string,
  txBytes?: Uint8Array
): Promise<string> {
  // 1. Check for Seal SDK prefix
  if (ciphertext.startsWith(`${SEAL_PREFIX}:`)) {
    if (!txBytes) {
      throw new Error('[Worm Seal] Threshold decryption requires the approval transaction bytes (txBytes).');
    }
    const seal = getSealClient();
    const data = fromBase64(ciphertext.split(':')[1]);
    
    // We need a session key for decryption in the SDK
    // In a real app, this would be generated once per session
    const decrypted = await seal.decrypt({
      data,
      sessionKey: (window as any).worm_seal_session, // Placeholder for session management
      txBytes,
    });
    return new TextDecoder().decode(decrypted);
  }

  // 2. Standard AES-GCM Decryption
  if (!ciphertext.startsWith(`${CIPHER_PREFIX}:`)) {
    throw new Error('[Worm Seal] Unsupported ciphertext format.');
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
  return typeof value === 'string' && (value.startsWith(`${CIPHER_PREFIX}:`) || value.startsWith(`${SEAL_PREFIX}:`));
}
