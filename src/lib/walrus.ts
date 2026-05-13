const PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';
const AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';

/**
 * Upload any JSON string or binary ArrayBuffer to Walrus testnet.
 * Returns the real blobId and a direct aggregator URL.
 */
export async function uploadToWalrus(
  data: string | ArrayBuffer,
  options?: { epochs?: number; contentType?: string }
): Promise<{ blobId: string; blobUrl: string }> {
  const epochs = options?.epochs ?? 5;
  const contentType = options?.contentType ?? 'application/json';

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
    throw new Error(`Walrus upload succeeded but no blobId in response: ${JSON.stringify(result)}`);
  }

  return {
    blobId,
    blobUrl: `${AGGREGATOR}/v1/blobs/${blobId}`,
  };
}

/**
 * Read raw text from a Walrus Blob by its blobId.
 */
export async function readFromWalrus(blobId: string): Promise<string> {
  const response = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`);
  if (!response.ok) {
    throw new Error(`Walrus read failed (${response.status}): ${response.statusText}`);
  }
  return response.text();
}

export const WALRUS_EXPLORER_BASE = 'https://walruscan.com/testnet/blob';

export function getExplorerUrl(blobId: string): string {
  return `${WALRUS_EXPLORER_BASE}/${blobId}`;
}
