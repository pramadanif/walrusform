import { uploadToWalrus, readFromWalrus } from './walrus';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormSubmission {
  submissionId: string;      // uuid
  formBlobId: string;        // which form this belongs to
  submittedAt: string;
  submitterWallet?: string;
  answers: Record<string, unknown>; // fieldId → value
  mediaBlobIds?: Record<string, string>; // fieldId → walrus blobId for files
  encrypted: boolean;
  // Admin-only fields — stored in localStorage, NOT in the Walrus blob
  // (Walrus blobs are immutable; admin metadata is merged in at read-time)
  _blobId?: string; // injected on load from the index
}

export interface AdminMeta {
  adminNote?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'New' | 'In Review' | 'Actioned' | 'Archived';
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function subKey(formBlobId: string) {
  return `walrusform_subs_${formBlobId}`;
}

function adminKey(submissionBlobId: string) {
  return `walrusform_admin_${submissionBlobId}`;
}

export function getAdminMeta(submissionBlobId: string): AdminMeta {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(adminKey(submissionBlobId)) ?? '{}');
  } catch {
    return {};
  }
}

export function saveAdminMeta(submissionBlobId: string, meta: AdminMeta): void {
  if (typeof window === 'undefined') return;
  const existing = getAdminMeta(submissionBlobId);
  localStorage.setItem(adminKey(submissionBlobId), JSON.stringify({ ...existing, ...meta }));
}

// ─── Core API ────────────────────────────────────────────────────────────────

/**
 * Upload a form submission (and any media files) to Walrus.
 * Blob IDs are indexed in localStorage so the dashboard can retrieve them later.
 */
export async function submitForm(
  formBlobId: string,
  answers: Record<string, unknown>,
  mediaBlobIds?: Record<string, string>,
  submitterWallet?: string,
  options?: { encrypted?: boolean }
): Promise<{ submissionBlobId: string }> {
  // Build submission object
  const submission: FormSubmission = {
    submissionId: crypto.randomUUID(),
    formBlobId,
    submittedAt: new Date().toISOString(),
    submitterWallet,
    answers,
    mediaBlobIds: mediaBlobIds && Object.keys(mediaBlobIds).length > 0 ? mediaBlobIds : undefined,
    encrypted: options?.encrypted ?? false,
  };

  // Upload submission JSON to Walrus
  const { blobId } = await uploadToWalrus(JSON.stringify(submission), {
    contentType: 'application/json',
    epochs: 10,
  });

  // Index submission blobId in localStorage
  const key = subKey(formBlobId);
  const existing: { blobId: string; submittedAt: string }[] = JSON.parse(
    localStorage.getItem(key) ?? '[]'
  );
  existing.unshift({ blobId, submittedAt: submission.submittedAt });
  localStorage.setItem(key, JSON.stringify(existing));

  return { submissionBlobId: blobId };
}

/**
 * Load all submissions for a given form from Walrus,
 * merging with any admin metadata stored in localStorage.
 */
export async function getSubmissionsForForm(
  formBlobId: string
): Promise<(FormSubmission & AdminMeta)[]> {
  const key = subKey(formBlobId);
  const index: { blobId: string }[] = JSON.parse(localStorage.getItem(key) ?? '[]');

  const submissions = await Promise.allSettled(
    index.map(async ({ blobId }) => {
      const raw = await readFromWalrus(blobId);
      const sub = JSON.parse(raw) as FormSubmission;
      const admin = getAdminMeta(blobId);
      return { ...sub, ...admin, _blobId: blobId };
    })
  );

  return submissions
    .filter(
      (r): r is PromiseFulfilledResult<FormSubmission & AdminMeta & { _blobId: string }> =>
        r.status === 'fulfilled'
    )
    .map((r) => r.value);
}
