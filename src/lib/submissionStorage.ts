import { uploadToWalrus, readFromWalrus } from './walrus';
import { appendToSubmissionIndex, loadSubmissionIndex } from './walrusRegistry';
import { client, getFormByBlobId } from './suiActions';

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

export type UploadStage = 'preparing' | 'encrypting' | 'storing' | 'indexing' | 'finalized';

/**
 * Upload a form submission (and any media files) to Walrus.
 * Blob IDs are indexed in both a Walrus append-only index blob AND localStorage.
 *
 * @param onStageChange - optional callback for honest upload progress reporting
 */
export async function submitForm(
  formBlobId: string,
  answers: Record<string, unknown>,
  mediaBlobIds?: Record<string, string>,
  submitterWallet?: string,
  options?: { encrypted?: boolean },
  onStageChange?: (stage: UploadStage) => void
): Promise<{ submissionBlobId: string, newIndexBlobId?: string }> {

  onStageChange?.('preparing');

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

  onStageChange?.('storing');

  // Upload submission JSON to Walrus
  const { blobId } = await uploadToWalrus(JSON.stringify(submission), {
    contentType: 'application/json',
    epochs: 10,
  });

  onStageChange?.('indexing');

  const indexEntry = { blobId, submittedAt: submission.submittedAt };

  // 1. Append to Walrus submission index blob (decentralized)
  let newIndexBlobId: string | undefined;
  try {
    newIndexBlobId = await appendToSubmissionIndex(formBlobId, indexEntry);
  } catch (e) {
    console.warn('[SubmissionStorage] Walrus index update failed.', e);
  }

  onStageChange?.('finalized');

  return { submissionBlobId: blobId, newIndexBlobId };
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

  // Fetch form object to get ID for dynamic fields
  let formObjectId: string | undefined;
  try {
    const suiForm = await getFormByBlobId(formBlobId);
    formObjectId = suiForm?.objectId;
  } catch (e) {
    console.warn('[SubmissionStorage] Failed to fetch form object for dynamic fields:', e);
  }

  const submissions = await Promise.allSettled(
    index.map(async ({ blobId }) => {
      const raw = await readFromWalrus(blobId);
      const sub = JSON.parse(raw) as FormSubmission;
      
      let admin: AdminMeta = { status: 'New', adminNote: '' };
      if (formObjectId) {
        try {
          const fieldRes = await client.getDynamicFieldObject({
            parentId: formObjectId,
            name: { type: '0x1::string::String', value: blobId },
          });
          if (fieldRes.data?.content?.dataType === 'moveObject') {
            const content = fieldRes.data.content as any;
            admin = {
              status: (content.fields.value.fields.status || 'New') as AdminMeta['status'],
              adminNote: content.fields.value.fields.note || '',
            };
          }
        } catch (e) {
          // Ignore if field doesn't exist
        }
      }
      
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
