import { uploadToWalrus, readFromWalrus } from './walrus';
import { appendToWalrusRegistry, getMergedRegistry, loadSubmissionIndex } from './walrusRegistry';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormField {
  id: string;
  type:
    | 'richtext'
    | 'text'
    | 'dropdown'
    | 'checkbox'
    | 'starrating'
    | 'rating'
    | 'screenshot'
    | 'video'
    | 'url'
    | 'confirmation'
    | 'confirm';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for dropdown
}

export interface FormDefinition {
  id: string;           // uuid
  title: string;
  description?: string;
  fields: FormField[];
  creatorWallet?: string;
  createdAt: string;
  settings: {
    requireWallet: boolean;
    encryptWithSeal: boolean;
    allowedDecryptors?: string[]; // wallet addresses for Seal/AES-GCM policy
  };
}

export interface FormRegistryEntry {
  title: string;
  createdAt: string;
  blobId: string;
}

// ─── Legacy localStorage registry (backward compat pointer) ──────────────────

const LOCAL_REGISTRY_KEY = 'walrusform_registry';

export function getLocalFormRegistry(): Record<string, FormRegistryEntry> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(LOCAL_REGISTRY_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveLocalFormRegistry(registry: Record<string, FormRegistryEntry>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_REGISTRY_KEY, JSON.stringify(registry));
}

const SEAL_WALLETS_KEY = 'walrusform_seal_wallets';

export function getSealWallets(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(SEAL_WALLETS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

/**
 * Get the full merged registry (Walrus blobs + localStorage legacy entries).
 * Prefers Walrus entries on conflict.
 */
export async function getFormRegistry(walletAddress?: string): Promise<Record<string, FormRegistryEntry>> {
  try {
    return await getMergedRegistry(walletAddress);
  } catch {
    // Fallback to local-only if Walrus is unreachable
    return getLocalFormRegistry();
  }
}

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Upload a FormDefinition JSON to Walrus.
 * Returns the blobId — this IS the form's shareable ID.
 * Also registers the form in both the Walrus registry blob and the local registry.
 */
export async function saveFormDefinition(
  form: FormDefinition,
  walletAddress?: string
): Promise<string> {
  const { blobId } = await uploadToWalrus(JSON.stringify(form), {
    contentType: 'application/json',
    epochs: 10,
  });

  const entry = {
    blobId,
    title: form.title,
    createdAt: form.createdAt,
    creatorWallet: walletAddress ?? form.creatorWallet,
  };

  // 1. Upload to Walrus append-only registry (decentralized)
  try {
    await appendToWalrusRegistry(entry);
  } catch (e) {
    console.warn('[FormStorage] Failed to update Walrus registry, falling back to localStorage only.', e);
  }

  // 2. Always update localStorage as fallback pointer
  const local = getLocalFormRegistry();
  local[blobId] = { title: form.title, createdAt: form.createdAt, blobId };
  saveLocalFormRegistry(local);

  return blobId;
}

/**
 * Load a FormDefinition from Walrus by its blobId.
 */
export async function loadFormDefinition(blobId: string): Promise<FormDefinition> {
  const raw = await readFromWalrus(blobId);
  return JSON.parse(raw) as FormDefinition;
}
