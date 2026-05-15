import { uploadToWalrus, readFromWalrus } from './walrus';
import { appendToSubmissionIndex, loadSubmissionIndex } from './walrusRegistry';

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

// ─── Admin metadata (localStorage — immutable blob can't be updated) ──────────

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

export type UploadStage = 'preparing' | 'uploading' | 'indexing' | 'finalized';

/**
 * Upload a form submission (and any media files) to Walrus.
 * Blob IDs are indexed in both a Walrus append-only index blob AND localStorage.
 *
 * @param onStageChange - optional callback for honest upload progress reporting
 */
export async function submitForm(
  formBlobId: string,
  answers: Record<string, unknown>,
  mediaFiles?: Record<string, File>,
  submitterWallet?: string,
  options?: { encrypted?: boolean },
  onStageChange?: (stage: UploadStage) => void
): Promise<{ submissionBlobId: string }> {

  onStageChange?.('preparing');

  // Upload any media files first
  const mediaBlobIds: Record<string, string> = {};
  if (mediaFiles && Object.keys(mediaFiles).length > 0) {
    for (const [fieldId, file] of Object.entries(mediaFiles)) {
      const buf = await file.arrayBuffer();
      const { blobId: mediaBlobId } = await uploadToWalrus(buf, {
        contentType: file.type || 'application/octet-stream',
        epochs: 10,
      });
      mediaBlobIds[fieldId] = mediaBlobId;
    }
  }

  // Build submission object
  const submission: FormSubmission = {
    submissionId: crypto.randomUUID(),
    formBlobId,
    submittedAt: new Date().toISOString(),
    submitterWallet,
    answers,
    mediaBlobIds: Object.keys(mediaBlobIds).length > 0 ? mediaBlobIds : undefined,
    encrypted: options?.encrypted ?? false,
  };

  onStageChange?.('uploading');

  // Upload submission JSON to Walrus
  const { blobId } = await uploadToWalrus(JSON.stringify(submission), {
    contentType: 'application/json',
    epochs: 10,
  });

  onStageChange?.('indexing');

  const indexEntry = { blobId, submittedAt: submission.submittedAt };

  // 1. Append to Walrus submission index blob (decentralized)
  try {
    await appendToSubmissionIndex(formBlobId, indexEntry);
  } catch (e) {
    console.warn('[SubmissionStorage] Walrus index update failed, localStorage-only fallback active.', e);
    // Fallback: update legacy localStorage index directly
    const legacyKey = `walrusform_subs_${formBlobId}`;
    const existing = JSON.parse(localStorage.getItem(legacyKey) ?? '[]');
    existing.unshift(indexEntry);
    localStorage.setItem(legacyKey, JSON.stringify(existing));
  }

  onStageChange?.('finalized');

  return { submissionBlobId: blobId };
}

/**
 * Load all submissions for a given form from Walrus,
 * merging with any admin metadata stored in localStorage.
 * Uses Walrus index blob with localStorage fallback.
 */
export async function getSubmissionsForForm(
  formBlobId: string
): Promise<(FormSubmission & AdminMeta)[]> {
  // Use Walrus index blob with localStorage fallback
  const index = await loadSubmissionIndex(formBlobId);

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
