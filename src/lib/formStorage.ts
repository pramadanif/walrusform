import { uploadToWalrus, readFromWalrus } from './walrus';

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
    allowedDecryptors?: string[]; // wallet addresses for Seal policy
  };
}

export interface FormRegistryEntry {
  title: string;
  createdAt: string;
  blobId: string;
}

// ─── Registry (localStorage index) ────────────────────────────────────────────

const REGISTRY_KEY = 'walrusform_registry';

export function getLocalFormRegistry(): Record<string, FormRegistryEntry> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(REGISTRY_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveLocalFormRegistry(registry: Record<string, FormRegistryEntry>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Upload a FormDefinition JSON to Walrus.
 * Returns the blobId — this IS the form's shareable ID.
 */
export async function saveFormDefinition(form: FormDefinition): Promise<string> {
  const { blobId } = await uploadToWalrus(JSON.stringify(form), {
    contentType: 'application/json',
    epochs: 10,
  });

  // Store in local registry for dashboard listing
  const registry = getLocalFormRegistry();
  registry[blobId] = { title: form.title, createdAt: form.createdAt, blobId };
  saveLocalFormRegistry(registry);

  return blobId;
}

/**
 * Load a FormDefinition from Walrus by its blobId.
 */
export async function loadFormDefinition(blobId: string): Promise<FormDefinition> {
  const raw = await readFromWalrus(blobId);
  return JSON.parse(raw) as FormDefinition;
}
