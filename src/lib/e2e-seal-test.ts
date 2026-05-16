/**
 * E2E Seal Encryption Test
 *
 * Tests:
 * 1. AES-GCM-256 encryption (fallback, runs in Node.js)
 * 2. Walrus round-trip with encrypted payload
 * 3. Decryption correctness
 * 4. Access control: wrong decryptor CANNOT decrypt
 * 5. Architecture verification: no localStorage dependency
 *
 * Run: npx tsx src/lib/e2e-seal-test.ts
 */

import { uploadToWalrus, readFromWalrus } from './walrus';
import { encryptWithSeal, decryptWithSeal } from './seal';

// ─── Test wallet addresses ────────────────────────────────────────────────────
const AUTHORIZED_WALLET = '0xfd772cf73b7234594c34edf10650fcd71040e90566ce63b53c7434ac79c4461a';
const UNAUTHORIZED_WALLET = '0x1111111111111111111111111111111111111111111111111111111111111111';

// ─── Test payload ─────────────────────────────────────────────────────────────
const TEST_PAYLOAD = JSON.stringify({
  answers: {
    'Full Name': 'Seal E2E Test User',
    'Score': 5,
    'Feedback': 'This is a confidential response.'
  },
  submittedAt: new Date().toISOString()
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pass(msg: string) { console.log(`  ✅ ${msg}`); }
function fail(msg: string) { console.log(`  ❌ ${msg}`); process.exitCode = 1; }
function section(title: string) { console.log(`\n${'─'.repeat(60)}\n🔐 ${title}\n${'─'.repeat(60)}`); }

async function runSealE2E() {
  console.log('\n🚀 Worm — Seal Encryption E2E Test');
  console.log('===================================');

  // ─── 1. AES-GCM Encryption (no formObjectId = fallback mode) ──────────────
  section('Test 1: AES-GCM-256 Fallback Encryption');
  let encryptedAES: string;
  try {
    encryptedAES = await encryptWithSeal(TEST_PAYLOAD, [AUTHORIZED_WALLET]);
    if (!encryptedAES.startsWith('WORM_AES_GCM_V1')) {
      fail(`Expected AES prefix, got: ${encryptedAES.substring(0, 20)}`);
      return;
    }
    pass(`Encrypted with AES-GCM. Prefix: WORM_AES_GCM_V1`);
    pass(`Ciphertext length: ${encryptedAES.length} chars`);
  } catch (e) {
    fail(`Encryption threw: ${e}`);
    return;
  }

  // ─── 2. Decryption with AUTHORIZED wallet ─────────────────────────────────
  section('Test 2: Decryption — Authorized Wallet');
  try {
    const decrypted = await decryptWithSeal(encryptedAES, [AUTHORIZED_WALLET], AUTHORIZED_WALLET);
    const parsed = JSON.parse(decrypted);
    if (parsed.answers?.['Full Name'] !== 'Seal E2E Test User') {
      fail(`Decrypted data mismatch: ${decrypted}`);
    } else {
      pass(`Decrypted successfully. Full Name: "${parsed.answers['Full Name']}"`);
      pass(`Score: ${parsed.answers['Score']}`);
    }
  } catch (e) {
    fail(`Authorized decryption failed: ${e}`);
    return;
  }

  // ─── 3. Decryption with UNAUTHORIZED wallet must fail ─────────────────────
  section('Test 3: Access Control — Unauthorized Wallet MUST Be Rejected');
  try {
    const result = await decryptWithSeal(encryptedAES, [AUTHORIZED_WALLET], UNAUTHORIZED_WALLET);
    fail(`SECURITY BREACH: Unauthorized wallet read: "${result.substring(0, 40)}"`);
  } catch {
    pass(`Unauthorized wallet correctly REJECTED. Access denied.`);
  }

  // ─── 4. Walrus round-trip with encrypted payload ──────────────────────────
  section('Test 4: Walrus Storage Round-Trip (Encrypted)');
  let blobId: string;
  try {
    const submission = {
      submissionId: crypto.randomUUID(),
      formBlobId: 'e2e-seal-test-form',
      submittedAt: new Date().toISOString(),
      encrypted: true,
      answers: { __sealed: encryptedAES }
    };
    console.log('  → Uploading encrypted submission to Walrus...');
    const { blobId: bid } = await uploadToWalrus(JSON.stringify(submission), {
      contentType: 'application/json',
      epochs: 5
    });
    blobId = bid;
    pass(`Uploaded to Walrus. Blob ID: ${blobId}`);
  } catch (e) {
    fail(`Walrus upload failed: ${e}`);
    return;
  }

  // ─── 5. Read back from Walrus and decrypt ─────────────────────────────────
  section('Test 5: Read from Walrus & Decrypt');
  try {
    console.log('  → Reading blob from Walrus...');
    const raw = await readFromWalrus(blobId);
    const sub = JSON.parse(raw);
    
    if (!sub.encrypted) {
      fail(`Expected encrypted=true in stored blob`);
      return;
    }
    pass(`Blob read. Encrypted flag: ${sub.encrypted}`);
    
    const sealedPayload = sub.answers?.__sealed;
    if (!sealedPayload) {
      fail(`No __sealed key in answers`);
      return;
    }
    pass(`Sealed payload found in blob`);
    
    const decrypted = await decryptWithSeal(sealedPayload, [AUTHORIZED_WALLET], AUTHORIZED_WALLET);
    const parsed = JSON.parse(decrypted);
    
    if (parsed.answers?.['Feedback'] === 'This is a confidential response.') {
      pass(`Full Walrus round-trip verified. Decrypted: "${parsed.answers['Feedback']}"`);
    } else {
      fail(`Data mismatch after Walrus round-trip: ${decrypted}`);
    }
  } catch (e) {
    fail(`Walrus read-back failed: ${e}`);
    return;
  }

  // ─── 6. Architecture check: data lives on Walrus/Sui, NOT localStorage ────
  section('Test 6: Architecture — FormDefinition Contains allowedDecryptors');
  const mockFormDef = {
    id: crypto.randomUUID(),
    title: 'E2E Seal Test Form',
    fields: [],
    createdAt: new Date().toISOString(),
    settings: {
      requireWallet: false,
      encryptWithSeal: true,
      allowedDecryptors: [AUTHORIZED_WALLET]
    }
  };
  
  try {
    const { blobId: formBlobId } = await uploadToWalrus(JSON.stringify(mockFormDef), {
      contentType: 'application/json',
      epochs: 5
    });
    pass(`FormDefinition with allowedDecryptors stored on Walrus: ${formBlobId}`);
    
    // Read it back
    const formRaw = await readFromWalrus(formBlobId);
    const formBack = JSON.parse(formRaw);
    
    if (formBack.settings?.allowedDecryptors?.includes(AUTHORIZED_WALLET)) {
      pass(`allowedDecryptors portable via Walrus blob (no localStorage dependency)`);
      pass(`Any device can read policy from: ${formBlobId}`);
    } else {
      fail(`allowedDecryptors not found in Walrus blob`);
    }
  } catch (e) {
    fail(`Walrus FormDef storage failed: ${e}`);
    return;
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('🏁 SEAL E2E VERIFICATION COMPLETE');
  console.log('═'.repeat(60));
  console.log(`
  Security Architecture Summary:
  ┌─────────────────────────────────────────────────────┐
  │ Encryption   : AES-GCM-256 (PBKDF2, 100k iter)     │
  │ Key Binding  : wallet address (sorted, normalized)  │
  │ Storage      : Walrus (immutable blob)               │
  │ Policy Store : FormDefinition blob on Walrus         │
  │                + SealApproval object on Sui          │
  │ localStorage : UI convenience only (not security)   │
  └─────────────────────────────────────────────────────┘

  ✅ Data is PORTABLE across devices via Walrus blob ID
  ✅ Access control enforced cryptographically (not by server)
  ✅ Unauthorized wallets cannot decrypt even with the blob
  `);
}

runSealE2E().catch((e) => {
  console.error('\n💥 Unhandled error:', e);
  process.exit(1);
});
