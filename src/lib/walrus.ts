import { WALRUS_PUBLISHER as PUBLISHER, WALRUS_AGGREGATOR as AGGREGATOR, WALRUS_EXPLORER_BASE } from './contracts';

// ─── Retry wrapper ───────────────────────────────────────────────────────────

/**
 * Retry an async fn up to `retries` times with exponential back-off.
 * Covers transient Walrus testnet instability.
 */
async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 800,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries - 1) {
        await new Promise((res) => setTimeout(res, delayMs * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface UploadOptions {
  epochs?: number;
  contentType?: string;
}

export interface UploadResult {
  blobId: string;
  blobUrl: string;
}

/**
 * Upload any JSON string or binary ArrayBuffer to Walrus testnet.
 * Returns the real blobId and a direct aggregator URL.
 * Includes a 3-attempt retry with exponential back-off.
 */
export async function uploadToWalrus(
  data: string | ArrayBuffer,
  options?: UploadOptions,
): Promise<UploadResult> {
  const epochs = options?.epochs ?? 5;
  const contentType = options?.contentType ?? 'application/json';

  return retry(async () => {
    const response = await fetch(`${PUBLISHER}/v1/blobs?epochs=${epochs}`, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: data,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      throw new Error(`Walrus upload failed (${response.status}): ${text}`);
    }

    const result = await response.json();

    // Walrus returns either { newlyCreated: { blobObject: { blobId } } }
    // or { alreadyCertified: { blobId } }
    const blobId: string =
      result.newlyCreated?.blobObject?.blobId ?? result.alreadyCertified?.blobId;

    if (!blobId) {
      throw new Error(
        `Walrus upload succeeded but no blobId in response: ${JSON.stringify(result)}`,
      );
    }

    return {
      blobId,
      blobUrl: `${AGGREGATOR}/v1/blobs/${blobId}`,
    };
  });
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Read raw text from a Walrus Blob by its blobId.
 * Includes a 3-attempt retry with exponential back-off.
 */
export async function readFromWalrus(blobId: string): Promise<string> {
  return retry(async () => {
    const response = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`);
    if (!response.ok) {
      throw new Error(`Walrus read failed (${response.status}): ${response.statusText}`);
    }
    return response.text();
  });
}

// ─── File Validation ─────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;  // 50 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUploadFile(file: File, fieldType: 'screenshot' | 'video'): FileValidationResult {
  if (fieldType === 'screenshot') {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { valid: false, error: `Invalid file type "${file.type}". Allowed: JPEG, PNG, GIF, WebP, SVG.` };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { valid: false, error: `Image too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max: 10 MB.` };
    }
  } else if (fieldType === 'video') {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return { valid: false, error: `Invalid file type "${file.type}". Allowed: MP4, WebM, OGG.` };
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return { valid: false, error: `Video too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max: 50 MB.` };
    }
  }
  return { valid: true };
}

// ─── Explorer ─────────────────────────────────────────────────────────────────

// Imported from contracts.ts

export function getExplorerUrl(blobId: string): string {
  return `${WALRUS_EXPLORER_BASE}/${blobId}`;
}
