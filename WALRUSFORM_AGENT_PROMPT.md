# 🦭 WalrusForm — Full Agent Build Prompt
> Paste this entire document as your IDE agent context. Read every section carefully before writing a single line of code.

---

## 🧠 PROJECT OVERVIEW & MISSION

You are building **WalrusForm** — a Walrus-native, decentralized feedback and form platform. This is a **real hackathon submission** targeting the Walrus ecosystem. The goal is to ship a production-quality product that:

1. Lets anyone build custom forms (bug reports, surveys, feature requests, applications).
2. Stores every submission as a Walrus Blob on Walrus Testnet (real Blob IDs, verifiable on explorer).
3. Optionally encrypts sensitive data via **Seal** so only authorized wallet holders can decrypt.
4. Provides an admin dashboard to filter, review, prioritize, add notes, and export to CSV.

**The frontend UI/UX is ALREADY BUILT and considered PRODUCTION READY.** Your job as the backend/integration agent is to wire up real functionality WITHOUT touching or redesigning the existing UI. You may only follow the existing design patterns established in the landing page.

---

## ⚠️ CRITICAL DESIGN RULE — NON-NEGOTIABLE

> **DO NOT change, redesign, restyle, or replace any existing UI component, layout, color scheme, font, animation, or visual element.**

The existing UI has a premium aesthetic that must be preserved 100%. Your job is:
- ✅ Wire real logic into existing UI shells
- ✅ Replace mock/hardcoded data with real data
- ✅ Add missing functional components that follow the EXACT same design language as the existing landing page
- ❌ Never introduce new CSS frameworks, design systems, or color palettes
- ❌ Never swap out existing components for "simpler" alternatives
- ❌ Never change font, spacing, animation, or visual tone

When you need to add new UI elements (e.g., wallet connect button, upload progress bar), **study the existing landing page components first and copy their exact style tokens, animation patterns, and structure**.

---

## 📁 CURRENT STATE (What Exists & What Is Mocked)

### ✅ Already Built — DO NOT TOUCH UI
| Page | Route | UI Status | What's Mocked |
|------|--------|-----------|---------------|
| Landing Page | `/` | ✅ Production Ready | Nothing |
| Form Builder | `/builder` | ✅ UI Logic Ready | Form save/deploy → needs real Walrus write |
| Public Form | `/form/[id]` | ✅ Visual Ready | Submission → needs real Walrus POST + real Blob ID |
| Admin Dashboard | `/dashboard` | ✅ UI Ready | `RESPONSES` array hardcoded → needs real fetch |
| Response Detail | `/dashboard/response/[id]` | ✅ UI Ready | Status update mocked → needs blockchain sync |
| Settings | `/settings` | ✅ UI Ready | Seal Policy tab mocked → needs real wallet whitelist |

### ⚠️ Input Components — Partially Functional
| Input Type | Current Status | What Must Be Built |
|------------|---------------|---------------------|
| Rich Text | Textarea fallback | Integrate Tiptap (headless, style to match existing) |
| Dropdown | UI only | Wire options array, selection state, stored value |
| Checkbox | ✅ Ready | Boolean storage ✅ |
| Star Rating | ✅ Ready | Integer 1–5 storage ✅ |
| Screenshot | Mockup only | `input[type=file]` → upload to Walrus Blob |
| Video Upload | Mockup only | Large file chunked upload → Walrus permanent storage |
| URL Link | ✅ Ready | String + URL validation ✅ |
| Confirmation | ✅ Ready | Mandatory checkbox validation ✅ |

---

## 🏗 ARCHITECTURE & TECH STACK

### Frontend (Existing — Do Not Change)
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS (use only existing utility classes already in use)
- **Animation:** Framer Motion (already installed)
- **State:** React hooks + Context

### New Dependencies You Must Add
```bash
# Sui + Walrus
npm install @mysten/sui @mysten/walrus
# or use the Walrus HTTP API directly (see below)

# Wallet
npm install @mysten/dapp-kit @tanstack/react-query

# Rich Text Editor (headless, no default styles)
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder

# Utilities
npm install papaparse @types/papaparse  # CSV export
npm install uuid  # form ID generation
```

### Backend Storage Strategy
```
Form Definitions  → Walrus Blob (JSON) + local index in localStorage or Sui object
Form Submissions  → Walrus Blob (JSON, one blob per submission)
Encrypted Data    → Seal encryption before Walrus upload
Blob ID Registry  → Stored in Sui smart contract OR localStorage (MVP: localStorage is acceptable)
```

---

## 🔧 WALRUS INTEGRATION — DETAILED SPEC

### Endpoints (Walrus Testnet)
```
Publisher:  https://publisher.walrus-testnet.walrus.space
Aggregator: https://aggregator.walrus-testnet.walrus.space
```

### Core Functions to Build

#### `lib/walrus.ts`
```typescript
// Upload any JSON or binary data to Walrus
// Returns the real Blob ID
export async function uploadToWalrus(
  data: string | Blob | ArrayBuffer,
  options?: { epochs?: number; contentType?: string }
): Promise<{ blobId: string; blobUrl: string }> {
  const PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';
  const epochs = options?.epochs ?? 5;
  
  const response = await fetch(`${PUBLISHER}/v1/store?epochs=${epochs}`, {
    method: 'PUT',
    headers: {
      'Content-Type': options?.contentType ?? 'application/json',
    },
    body: typeof data === 'string' ? data : data,
  });
  
  if (!response.ok) throw new Error(`Walrus upload failed: ${response.statusText}`);
  
  const result = await response.json();
  // Walrus returns either { newlyCreated: { blobObject: { blobId } } }
  // or { alreadyCertified: { blobId } }
  const blobId = result.newlyCreated?.blobObject?.blobId 
               ?? result.alreadyCertified?.blobId;
  
  return {
    blobId,
    blobUrl: `https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`
  };
}

// Read data from a Walrus Blob
export async function readFromWalrus(blobId: string): Promise<string> {
  const AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';
  const response = await fetch(`${AGGREGATOR}/v1/${blobId}`);
  if (!response.ok) throw new Error(`Walrus read failed: ${response.statusText}`);
  return response.text();
}
```

#### `lib/formStorage.ts`
```typescript
// Form definition = the JSON schema of a form (fields, title, settings)
// This must be stored as a Walrus Blob so the form can be shared by Blob ID

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
    allowedDecryptors?: string[];  // wallet addresses for Seal policy
  };
}

export interface FormField {
  id: string;
  type: 'richtext' | 'dropdown' | 'checkbox' | 'starrating' | 'screenshot' | 'video' | 'url' | 'confirmation';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];  // for dropdown
}

// Save form → upload JSON to Walrus → return blobId (this IS the form's shareable ID)
export async function saveFormDefinition(form: FormDefinition): Promise<string> {
  const { blobId } = await uploadToWalrus(JSON.stringify(form), {
    contentType: 'application/json',
    epochs: 10,
  });
  // Also store in localStorage for dashboard listing
  const existing = getLocalFormRegistry();
  existing[blobId] = { title: form.title, createdAt: form.createdAt, blobId };
  localStorage.setItem('walrusform_registry', JSON.stringify(existing));
  return blobId;
}

// Load form by blobId
export async function loadFormDefinition(blobId: string): Promise<FormDefinition> {
  const raw = await readFromWalrus(blobId);
  return JSON.parse(raw);
}

function getLocalFormRegistry(): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem('walrusform_registry') ?? '{}');
  } catch { return {}; }
}
```

#### `lib/submissionStorage.ts`
```typescript
export interface FormSubmission {
  submissionId: string;      // uuid
  formBlobId: string;        // which form this belongs to
  submittedAt: string;
  submitterWallet?: string;
  answers: Record<string, any>;  // fieldId → value
  mediaBlobIds?: Record<string, string>;  // fieldId → walrus blobId for files
  encrypted: boolean;
  // Admin-only fields (stored separately or decrypted with Seal)
  adminNote?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'new' | 'reviewed' | 'actioned' | 'archived';
}

export async function submitForm(
  formBlobId: string,
  answers: Record<string, any>,
  mediaFiles?: Record<string, File>
): Promise<{ submissionBlobId: string }> {
  // 1. Upload any media files first
  const mediaBlobIds: Record<string, string> = {};
  if (mediaFiles) {
    for (const [fieldId, file] of Object.entries(mediaFiles)) {
      const buffer = await file.arrayBuffer();
      const { blobId } = await uploadToWalrus(buffer, { contentType: file.type });
      mediaBlobIds[fieldId] = blobId;
    }
  }
  
  // 2. Build submission object
  const submission: FormSubmission = {
    submissionId: crypto.randomUUID(),
    formBlobId,
    submittedAt: new Date().toISOString(),
    answers,
    mediaBlobIds,
    encrypted: false,
    status: 'new',
  };
  
  // 3. Upload submission JSON to Walrus
  const { blobId } = await uploadToWalrus(JSON.stringify(submission));
  
  // 4. Store blob ID in local index under this form
  const key = `walrusform_subs_${formBlobId}`;
  const existing = JSON.parse(localStorage.getItem(key) ?? '[]');
  existing.push({ blobId, submittedAt: submission.submittedAt });
  localStorage.setItem(key, JSON.stringify(existing));
  
  return { submissionBlobId: blobId };
}

export async function getSubmissionsForForm(formBlobId: string): Promise<FormSubmission[]> {
  const key = `walrusform_subs_${formBlobId}`;
  const index: { blobId: string }[] = JSON.parse(localStorage.getItem(key) ?? '[]');
  const submissions = await Promise.all(
    index.map(async ({ blobId }) => {
      const raw = await readFromWalrus(blobId);
      return { ...JSON.parse(raw), _blobId: blobId };
    })
  );
  return submissions;
}
```

---

## 🔐 SEAL ENCRYPTION — INTEGRATION SPEC

Seal is Mysten Labs' threshold encryption protocol for Sui. Use it for sensitive form submissions.

### Reference
- Docs: https://docs.walrus.site/seal
- SDK: `@mysten/seal` (install if available) or use the Seal HTTP API

### Implementation Pattern
```typescript
// lib/seal.ts

// Encrypt data so only addresses in `allowedDecryptors` can decrypt
export async function encryptWithSeal(
  data: string,
  allowedDecryptors: string[]  // array of Sui wallet addresses
): Promise<string> {
  // TODO: Integrate @mysten/seal SDK
  // 1. Create a Seal policy with the allowedDecryptors list
  // 2. Encrypt `data` under that policy
  // 3. Return the encrypted ciphertext (base64 or hex)
  // FALLBACK for MVP: if Seal SDK not available, use a placeholder
  // that marks data as "seal_pending" and documents the integration point
  console.warn('Seal encryption: SDK integration pending');
  return `SEAL_ENCRYPTED:${btoa(data)}`;  // MVP placeholder
}

export async function decryptWithSeal(
  ciphertext: string,
  walletAdapter: any  // connected wallet
): Promise<string> {
  if (ciphertext.startsWith('SEAL_ENCRYPTED:')) {
    return atob(ciphertext.replace('SEAL_ENCRYPTED:', ''));  // MVP placeholder
  }
  // TODO: Real Seal decryption using walletAdapter to sign
  throw new Error('Seal decryption not yet implemented');
}
```

> **MVP Strategy:** If the full Seal SDK integration is complex, implement the placeholder pattern above. Document it clearly in code comments. The UI policy tab should still be functional (saving allowed wallet addresses). The data flow must work end-to-end even if encryption is the placeholder for now.

---

## 👛 WALLET INTEGRATION — SPEC

### Setup (add to root layout or providers)
```typescript
// app/providers.tsx
'use client';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
const networks = { testnet: { url: getFullnodeUrl('testnet') } };

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
```

### Wallet Connect Button
- Use `ConnectButton` from `@mysten/dapp-kit` BUT wrap it with existing design styles
- The button must match the existing CTA button style on the landing page exactly
- Apply the same className, font, border-radius, and color tokens already used in the landing page hero section

### Auth Guard for Dashboard
```typescript
// components/WalletGuard.tsx
'use client';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const account = useCurrentAccount();
  const router = useRouter();
  
  useEffect(() => {
    if (!account) router.push('/');
  }, [account]);
  
  if (!account) return null;
  return <>{children}</>;
}
```

---

## 📝 RICH TEXT EDITOR — TIPTAP SPEC

Install: `@tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder`

```typescript
// components/inputs/RichTextInput.tsx
'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextInput({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? 'Write here...' }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // IMPORTANT: Apply NO default Tiptap styles.
  // Style the EditorContent wrapper using ONLY existing CSS classes from the project.
  // Match the look of other textarea inputs on the form page exactly.
  return (
    <div className="[COPY_EXISTING_TEXTAREA_CLASSNAMES_HERE]">
      <EditorContent editor={editor} />
    </div>
  );
}
```

> **Rule:** Before writing any className, look at the existing `<textarea>` elements on `/form/[id]` and copy their exact Tailwind classes. Tiptap must be invisible from a styling perspective.

---

## 📤 FILE UPLOAD — SCREENSHOT & VIDEO SPEC

```typescript
// components/inputs/FileUploadInput.tsx
'use client';
import { useState, useRef } from 'react';
import { uploadToWalrus } from '@/lib/walrus';

interface Props {
  type: 'screenshot' | 'video';
  onUploadComplete: (blobId: string) => void;
}

export function FileUploadInput({ type, onUploadComplete }: Props) {
  const [progress, setProgress] = useState<number | null>(null);
  const [blobId, setBlobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = type === 'screenshot' ? 'image/*' : 'video/*';
  const maxMB = type === 'screenshot' ? 10 : 200;

  const handleFile = async (file: File) => {
    if (file.size > maxMB * 1024 * 1024) {
      setError(`File too large. Max ${maxMB}MB.`);
      return;
    }
    setProgress(0);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      setProgress(50); // Walrus HTTP API doesn't support progress events, simulate
      const { blobId: id } = await uploadToWalrus(buffer, { contentType: file.type });
      setProgress(100);
      setBlobId(id);
      onUploadComplete(id);
    } catch (e: any) {
      setError(e.message ?? 'Upload failed');
      setProgress(null);
    }
  };

  // IMPORTANT: Style this component to match existing file input mockup on the form page.
  // Use the same drag-and-drop zone styling, icon, and text already present in the UI.
  // Only add the real upload logic and progress/success state.
  return (
    <div
      className="[COPY_EXISTING_FILE_ZONE_CLASSNAMES]"
      onClick={() => inputRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      
      {progress === null && !blobId && (
        <p>[MATCH EXISTING PLACEHOLDER TEXT AND ICON]</p>
      )}
      {progress !== null && progress < 100 && (
        <div>[PROGRESS BAR — match existing design tokens]</div>
      )}
      {blobId && (
        <div>[SUCCESS STATE — show blobId, match existing success styling]</div>
      )}
      {error && (
        <p className="[MATCH EXISTING ERROR TEXT STYLE]">{error}</p>
      )}
    </div>
  );
}
```

---

## 📊 CSV EXPORT — SPEC

```typescript
// lib/csvExport.ts
import Papa from 'papaparse';
import type { FormSubmission } from './submissionStorage';
import type { FormDefinition } from './formStorage';

export function exportSubmissionsToCSV(
  form: FormDefinition,
  submissions: FormSubmission[]
): void {
  const fieldLabels = Object.fromEntries(form.fields.map(f => [f.id, f.label]));
  
  const rows = submissions.map(sub => {
    const row: Record<string, any> = {
      'Submission ID': sub.submissionId,
      'Submitted At': sub.submittedAt,
      'Walrus Blob ID': sub._blobId ?? '',
      'Wallet': sub.submitterWallet ?? 'anonymous',
      'Status': sub.status ?? 'new',
      'Priority': sub.priority ?? '',
      'Admin Note': sub.adminNote ?? '',
    };
    for (const [fieldId, value] of Object.entries(sub.answers)) {
      const label = fieldLabels[fieldId] ?? fieldId;
      row[label] = Array.isArray(value) ? value.join(', ') : String(value ?? '');
    }
    return row;
  });

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${form.title.replace(/\s+/g, '_')}_responses_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

Wire this to the existing "Export CSV" button in the dashboard. **Do not change the button's visual design.**

---

## 🔗 FORM BUILDER — WIRE-UP SPEC

The `/builder` page has a "Deploy to Walrus" button. Here is exactly what must happen when it's clicked:

```typescript
// In the existing builder page component, replace the mock handler:

const handleDeployToWalrus = async () => {
  setIsDeploying(true);
  try {
    // 1. Validate: form must have at least a title and one field
    if (!formTitle || fields.length === 0) {
      showError('Add a title and at least one field before deploying.');
      return;
    }
    
    // 2. Build the FormDefinition object
    const formDef: FormDefinition = {
      id: crypto.randomUUID(),
      title: formTitle,
      description: formDescription,
      fields: fields,
      creatorWallet: connectedWallet?.address,
      createdAt: new Date().toISOString(),
      settings: {
        requireWallet: requireWalletEnabled,
        encryptWithSeal: sealEnabled,
        allowedDecryptors: sealAllowedAddresses,
      },
    };
    
    // 3. Upload to Walrus
    const blobId = await saveFormDefinition(formDef);
    
    // 4. Show success state with the real blobId
    // The shareable link is: `${window.location.origin}/form/${blobId}`
    setDeployedBlobId(blobId);
    setShareableLink(`${window.location.origin}/form/${blobId}`);
    showSuccessModal(); // use existing success modal/state
    
  } catch (err: any) {
    showError(err.message ?? 'Deployment failed');
  } finally {
    setIsDeploying(false);
  }
};
```

---

## 📋 PUBLIC FORM PAGE — WIRE-UP SPEC

The `/form/[id]` page receives a `blobId` as the `[id]` param. It must:

1. **On mount:** Fetch the form definition from Walrus using `loadFormDefinition(params.id)`
2. **Render:** Dynamic fields based on the loaded schema (already partially done — wire real data)
3. **On submit:** Call `submitForm(params.id, answers, mediaFiles)` and show the real Blob ID

```typescript
// app/form/[id]/page.tsx (replace mock logic)

'use client';
import { useEffect, useState } from 'react';
import { loadFormDefinition, FormDefinition } from '@/lib/formStorage';
import { submitForm } from '@/lib/submissionStorage';

export default function FormPage({ params }: { params: { id: string } }) {
  const [formDef, setFormDef] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [mediaFiles, setMediaFiles] = useState<Record<string, File>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedBlobId, setSubmittedBlobId] = useState<string | null>(null);

  useEffect(() => {
    loadFormDefinition(params.id)
      .then(setFormDef)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { submissionBlobId } = await submitForm(params.id, answers, mediaFiles);
      setSubmittedBlobId(submissionBlobId);
      // Show existing success page with REAL blob ID
    } catch (e: any) {
      // Show error using existing error UI pattern
    } finally {
      setSubmitting(false);
    }
  };

  // Render using EXISTING UI structure — only replace hardcoded data with dynamic data
  // ...
}
```

---

## 🗂 ADMIN DASHBOARD — WIRE-UP SPEC

The dashboard currently uses a hardcoded `RESPONSES` array. Replace it with:

```typescript
// In the dashboard page component:

useEffect(() => {
  // Get all form IDs from local registry
  const registry = JSON.parse(localStorage.getItem('walrusform_registry') ?? '{}');
  const formIds = Object.keys(registry);
  
  // For MVP: show submissions for ALL forms the user has created
  // Load submissions for each form from Walrus
  Promise.all(
    formIds.map(fid => getSubmissionsForForm(fid))
  ).then(allSubs => {
    setResponses(allSubs.flat().sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    ));
  });
}, []);
```

**Admin note saving:** When the admin saves a note in the slide-over panel, update the submission blob. Since Walrus blobs are immutable, use this strategy:
- Store admin metadata (notes, status, priority) in `localStorage` keyed by `submissionBlobId`
- On load, merge Walrus submission data with localStorage metadata
- This is the correct MVP approach — document it clearly

---

## 🔄 PAGE-BY-PAGE INTEGRATION CHECKLIST

### `/builder`
- [ ] Wire "Deploy to Walrus" button to real `saveFormDefinition()` 
- [ ] Show real blobId in success state
- [ ] Show shareable link: `yourdomain.com/form/{blobId}`
- [ ] Copy-to-clipboard button for shareable link
- [ ] Wallet connect button in header (styled to match existing)
- [ ] Rich Text field type → integrate Tiptap (headless, match existing textarea style)
- [ ] Dropdown field type → wire options management UI

### `/form/[id]`
- [ ] Load form definition from Walrus on mount (replace hardcoded schema)
- [ ] Render dynamic fields based on loaded schema
- [ ] File inputs → real `FileUploadInput` component with Walrus upload
- [ ] Submit button → calls `submitForm()`, shows real Blob ID on success page
- [ ] Loading state while fetching form definition (use existing skeleton/loading patterns)
- [ ] Error state if blobId not found

### `/dashboard`
- [ ] Replace hardcoded `RESPONSES` with real data from Walrus + localStorage index
- [ ] "Export CSV" button → calls `exportSubmissionsToCSV()`
- [ ] Stat cards → computed from real data (total responses, avg rating, blob count)
- [ ] Search/filter → client-side filter on loaded responses
- [ ] Admin note saving → localStorage merge strategy
- [ ] Status update (Archive/Actioned) → localStorage merge strategy

### `/settings`
- [ ] Seal Policy tab → save allowed wallet addresses to localStorage/form settings
- [ ] Profile tab → reflect connected wallet address
- [ ] Team management → store in localStorage for MVP

---

## 🧪 END-TO-END TEST FLOW

Before submitting the hackathon, verify this complete flow works:

1. Connect a Sui testnet wallet
2. Go to `/builder` → create a form with: title, rich text field, star rating, dropdown, screenshot upload
3. Click "Deploy to Walrus" → confirm a real Blob ID is returned (not mock)
4. Copy the shareable link `/form/{blobId}`
5. Open the link in a new incognito tab
6. Fill all fields, upload a screenshot, submit
7. Confirm the success page shows a real submission Blob ID
8. Go to `/dashboard` → confirm the submission appears
9. Click the submission → review detail page shows all answers
10. Add an admin note → confirm it persists on reload
11. Click "Export CSV" → download and open the file, confirm all data is present
12. Verify both Blob IDs on Walrus explorer: `https://walruscan.com/testnet/blob/{blobId}`

---

## 📦 FILE STRUCTURE — WHERE TO ADD NEW FILES

```
walrusform/
├── app/
│   ├── layout.tsx          ← Add Providers wrapper here
│   ├── providers.tsx       ← CREATE: Sui/Wallet providers
│   ├── form/[id]/
│   │   └── page.tsx        ← EDIT: wire real Walrus load + submit
│   ├── builder/
│   │   └── page.tsx        ← EDIT: wire real deploy
│   └── dashboard/
│       ├── page.tsx        ← EDIT: wire real data fetch + CSV export
│       └── response/[id]/
│           └── page.tsx    ← EDIT: wire status updates
├── lib/
│   ├── walrus.ts           ← CREATE: uploadToWalrus, readFromWalrus
│   ├── formStorage.ts      ← CREATE: saveFormDefinition, loadFormDefinition
│   ├── submissionStorage.ts← CREATE: submitForm, getSubmissionsForForm
│   ├── seal.ts             ← CREATE: encryptWithSeal, decryptWithSeal
│   └── csvExport.ts        ← CREATE: exportSubmissionsToCSV
└── components/
    ├── inputs/
    │   ├── RichTextInput.tsx   ← CREATE: Tiptap wrapper
    │   └── FileUploadInput.tsx ← CREATE: Walrus file upload
    └── WalletGuard.tsx         ← CREATE: auth wrapper
```

---

## 🚀 HACKATHON REQUIREMENTS — FINAL CHECKLIST

These must ALL be true before submission:

- [ ] At least 1 real form deployed to Walrus testnet with a real Blob ID
- [ ] At least 1 real submission stored on Walrus with a real Blob ID  
- [ ] Both Blob IDs verifiable at `https://walruscan.com/testnet`
- [ ] Demo video under 3 minutes, uploaded to Walrus
- [ ] Public GitHub repository with clear README
- [ ] README includes: what was built, setup instructions, Walrus integration explanation
- [ ] The app itself is used to submit the hackathon application (dogfooding!)

---

## 📝 README TEMPLATE (for the repo)

```markdown
# 🦭 WalrusForm

> Decentralized feedback and form platform built natively on Walrus.

## What We Built
WalrusForm lets teams create custom forms and collect feedback on-chain. 
Every submission is stored as a Walrus Blob — verifiable, permanent, and censorship-resistant.
Sensitive data can be encrypted with Seal so only authorized wallets can decrypt.

## Features
- 🏗 Visual drag-and-drop form builder
- 📝 8 input types: rich text, dropdown, checkbox, star rating, screenshot, video, URL, confirmation
- 🔗 Shareable form links (form definition stored on Walrus)
- 🐋 Every submission = a real Walrus Blob
- 🔐 Optional Seal encryption for private data  
- 📊 Admin dashboard with filtering, notes, priority, and CSV export
- 👛 Sui wallet authentication

## Tech Stack
- Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- Walrus Testnet (storage)
- Sui Testnet (wallet auth)
- Seal (encryption layer)
- Tiptap (rich text)

## Setup
\`\`\`bash
npm install
npm run dev
\`\`\`

## Live Demo
[link]

## Example Form
Form Blob ID: [blobId]
View at: https://aggregator.walrus-testnet.walrus.space/v1/[blobId]
```

---

*End of WalrusForm Agent Prompt — read every section before writing code.*
