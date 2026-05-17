/**
 * lib/walrusRegistry.ts — Decentralized Form & Submission Registry via Walrus Index Blobs
 *
 * ARCHITECTURE:
 * Rather than trusting only browser localStorage, Worm uses an "append-only index blob" pattern:
 *
 *  1. Each wallet address has a personal registry blob (a JSON list of form entries).
 *  2. When a form is deployed, a new registry blob is uploaded that APPENDS the new entry.
 *  3. The blobId of the latest registry is stored in localStorage as a pointer.
 *  4. On any device, if the user knows their wallet address, they can reconstruct their
 *     registry by following the blob pointer stored in localStorage.
 *
 * LIMITATION (Walrus is immutable):
 * Because Walrus blobs are immutable, the "latest registry blobId" pointer must still be
 * stored somewhere (localStorage or Sui shared object). This implementation uses localStorage
 * as the pointer store. The CONTENT is on Walrus. The POINTER is local.
 *
 * UPGRADE PATH:
 * Store the pointer in a Sui shared object or dynamic field keyed by wallet address.
 * This would make the registry fully portable across devices.
 */

import { uploadToWalrus, readFromWalrus } from './walrus';
import { FormRegistryEntry } from './formStorage';
import { getOwnedForms, getFormByBlobId } from './suiActions';

// localStorage key: pointer to the latest registry blob for this wallet
const REGISTRY_POINTER_KEY = 'worm_registry_blob_pointer';

// ─── Pointer helpers ──────────────────────────────────────────────────────────

export function getRegistryPointer(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REGISTRY_POINTER_KEY);
}

export function setRegistryPointer(blobId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REGISTRY_POINTER_KEY, blobId);
}

// ─── Registry I/O ─────────────────────────────────────────────────────────────

export interface WalrusRegistryEntry {
  blobId: string;          // form's Walrus blob ID (the shareable form ID)
  title: string;
  createdAt: string;
  creatorWallet?: string;
  submissionIndexBlobId?: string; // pointer to the latest submission index for this form
}

/**
 * Load the registry from Walrus using the stored pointer.
 * Falls back to empty array if no pointer or blob is unavailable.
 */
export async function loadWalrusRegistry(): Promise<WalrusRegistryEntry[]> {
  const pointer = getRegistryPointer();
  if (!pointer) return [];
  try {
    const raw = await readFromWalrus(pointer);
    return JSON.parse(raw) as WalrusRegistryEntry[];
  } catch {
    // If the registry blob is unavailable (e.g., testnet expiry), return empty
    console.warn('[WalrusRegistry] Failed to load registry from Walrus, returning empty.');
    return [];
  }
}

/**
 * Append a new entry to the Walrus registry blob.
 * Uploads a new blob with the appended list and updates the local pointer.
 */
export async function appendToWalrusRegistry(entry: WalrusRegistryEntry): Promise<string> {
  const existing = await loadWalrusRegistry();

  // Avoid duplicates
  const deduplicated = existing.filter((e) => e.blobId !== entry.blobId);
  const updated = [entry, ...deduplicated]; // newest first

  const { blobId: newPointer } = await uploadToWalrus(JSON.stringify(updated), {
    contentType: 'application/json',
    epochs: 10,
  });

  setRegistryPointer(newPointer);
  return newPointer;
}

/**
 * Get a merged view: Sui on-chain forms + Walrus registry entries + any localStorage-only entries.
 * walletAddress: if provided, we query Sui for forms registered on-chain.
 */
export async function getMergedRegistry(walletAddress?: string): Promise<Record<string, FormRegistryEntry>> {
  const suiRegistry: Record<string, FormRegistryEntry> = {};
  if (walletAddress) {
    try {
      const ownedForms = await getOwnedForms(walletAddress);
      for (const form of ownedForms) {
        if (form.formBlobId) {
          suiRegistry[form.formBlobId] = {
            title: form.title || "On-chain Form",
            createdAt: new Date().toISOString(),
            blobId: form.formBlobId,
          };
        }
      }
    } catch (e) {
      console.warn('[WalrusRegistry] Failed to query Sui registry:', e);
    }
  }

  return suiRegistry;
}

// ─── Submission Index Blobs ───────────────────────────────────────────────────

/**
 * localStorage key for the submission index blob pointer, keyed by form blob ID.
 */
function subIndexPointerKey(formBlobId: string): string {
  return `worm_sub_index_${formBlobId}`;
}

export interface SubmissionIndexEntry {
  blobId: string;
  submittedAt: string;
}

/**
 * Load the submission index from Walrus for a given form.
 * Falls back to the old localStorage index for backward compat.
 */
export async function loadSubmissionIndex(formBlobId: string): Promise<SubmissionIndexEntry[]> {
  // 1. Try to find the latest index pointer from Sui (Decentralized SOT)
  try {
    const suiForm = await getFormByBlobId(formBlobId);
    const suiPointer = suiForm?.latestSubmissionIndexBlobId;
    if (suiPointer) {
        const raw = await readFromWalrus(suiPointer);
        return JSON.parse(raw) as SubmissionIndexEntry[];
    }
  } catch (e) {
    console.warn('[WalrusRegistry] Failed to load index from Sui:', e);
  }

  return [];
}

/**
 * Append a submission entry to the Walrus submission index for a form.
 * Uploads a new index blob and updates the local pointer.
 */
export async function appendToSubmissionIndex(
  formBlobId: string,
  entry: SubmissionIndexEntry
): Promise<string> {
  const existing = await loadSubmissionIndex(formBlobId);
  const updated = [entry, ...existing]; // newest first

  const { blobId: newPointer } = await uploadToWalrus(JSON.stringify(updated), {
    contentType: 'application/json',
    epochs: 10,
  });

  // Save pointer locally
  localStorage.setItem(subIndexPointerKey(formBlobId), newPointer);

  // Also update legacy localStorage for backward compat
  const legacyKey = `walrusform_subs_${formBlobId}`;
  localStorage.setItem(legacyKey, JSON.stringify(updated));

  return newPointer;
}
