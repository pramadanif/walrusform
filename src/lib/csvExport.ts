import Papa from 'papaparse';
import type { FormSubmission } from './submissionStorage';
import type { FormDefinition } from './formStorage';

/**
 * Export all submissions for a form as a CSV download.
 * Called by the "Export CSV" button in the dashboard — do not change the button's visual.
 */
export function exportSubmissionsToCSV(
  form: FormDefinition,
  submissions: (FormSubmission & { adminNote?: string; priority?: string; status?: string; _blobId?: string })[]
): void {
  const fieldLabels = Object.fromEntries(form.fields.map((f) => [f.id, f.label]));

  const rows = submissions.map((sub) => {
    const row: Record<string, string> = {
      'Submission ID': sub.submissionId,
      'Submitted At': new Date(sub.submittedAt).toLocaleString(),
      'Walrus Blob ID': sub._blobId ?? '',
      'Wallet': sub.submitterWallet ?? 'anonymous',
      'Status': sub.status ?? 'New',
      'Priority': sub.priority ?? '',
      'Admin Note': sub.adminNote ?? '',
    };

    for (const [fieldId, value] of Object.entries(sub.answers ?? {})) {
      const label = fieldLabels[fieldId] ?? fieldId;
      row[label] = Array.isArray(value)
        ? value.join(', ')
        : String(value ?? '');
    }

    // Include media blob IDs if present
    if (sub.mediaBlobIds) {
      for (const [fieldId, blobId] of Object.entries(sub.mediaBlobIds)) {
        const label = fieldLabels[fieldId] ?? fieldId;
        row[`${label} (Blob)`] = blobId;
      }
    }

    return row;
  });

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${form.title.replace(/\s+/g, '_')}_responses_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
